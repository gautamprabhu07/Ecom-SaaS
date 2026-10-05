import { createReview, updateReview, deleteReview, getShopReviews } from '../../apps/product-service/src/controllers/review.controller';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../../apps/order-service/src/controllers/notification.controller';
import prisma from '@packages/libs/prisma';

jest.mock('@packages/libs/prisma', () => ({
  __esModule: true,
  default: {
    shops: { findUnique: jest.fn(), update: jest.fn() },
    orders: { count: jest.fn() },
    shopReviews: { findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), aggregate: jest.fn(), count: jest.fn(), groupBy: jest.fn() },
    notifications: { create: jest.fn(), findMany: jest.fn(), count: jest.fn(), updateMany: jest.fn() },
  },
}));

const db: any = prisma;
const SHOP = 'a'.repeat(24);
const GOOD = { rating: 4, text: 'Fast shipping and well packed.' };

const run = (fn: any, req: any) =>
  new Promise<{ code?: number; body?: any; error?: any }>((resolve) => {
    const res: any = { status: (code: number) => ({ json: (body: any) => resolve({ code, body }) }) };
    fn({ params: {}, query: {}, body: {}, ...req }, res, (error: any) => resolve({ error }));
  });

const buyer = { id: 'u1', name: 'Una' };
const reviewReq = (body: any = GOOD, user: any = buyer) => ({ user, params: { shopId: SHOP }, body });

beforeEach(() => {
  jest.resetAllMocks();
  db.shops.findUnique.mockResolvedValue({ id: SHOP, name: 'Shop', sellerId: 'seller1' });
  db.orders.count.mockResolvedValue(1);
  db.shopReviews.findFirst.mockResolvedValue(null);
  db.shopReviews.create.mockResolvedValue({ id: 'r1' });
  db.shopReviews.aggregate.mockResolvedValue({ _avg: { rating: 4.25 } });
  db.notifications.create.mockResolvedValue({});
});

describe('createReview', () => {
  it('rejects a user who never bought from the shop with 403', async () => {
    db.orders.count.mockResolvedValue(0);
    const { error } = await run(createReview, reviewReq());
    expect(error.statusCode).toBe(403);
    expect(db.shopReviews.create).not.toHaveBeenCalled();
  });

  it('only counts paid orders as a purchase', async () => {
    await run(createReview, reviewReq());
    expect(db.orders.count.mock.calls[0][0].where).toEqual({ userId: 'u1', shopId: SHOP, status: 'Paid' });
  });

  it.each([[0], [6], [3.5], ['x'], [undefined]])('rejects rating %p', async (rating) => {
    const { error } = await run(createReview, reviewReq({ ...GOOD, rating }));
    expect(error.statusCode).toBe(400);
  });

  it.each([['short'], ['x'.repeat(1001)], [undefined], ['   padded   ']])('rejects review text %p', async (text) => {
    const { error } = await run(createReview, reviewReq({ rating: 5, text }));
    expect(error.statusCode).toBe(400);
  });

  it('rejects a seller or anonymous caller with 403', async () => {
    expect((await run(createReview, reviewReq(GOOD, null))).error.statusCode).toBe(403);
  });

  it('rejects a malformed shop id and an unknown shop', async () => {
    expect((await run(createReview, { user: buyer, params: { shopId: 'nope' }, body: GOOD })).error.statusCode).toBe(400);
    db.shops.findUnique.mockResolvedValue(null);
    expect((await run(createReview, reviewReq())).error.statusCode).toBe(404);
  });

  it('allows one review per user per shop', async () => {
    db.shopReviews.findFirst.mockResolvedValue({ id: 'existing' });
    const { error } = await run(createReview, reviewReq());
    expect(error.statusCode).toBe(400);
    expect(db.shopReviews.create).not.toHaveBeenCalled();
  });

  it('saves the review, recomputes the shop average (rounded to 1 decimal) and notifies the seller', async () => {
    const { code, body } = await run(createReview, reviewReq());
    expect(code).toBe(201);
    expect(body.average).toBe(4.3);
    expect(db.shops.update).toHaveBeenCalledWith({ where: { id: SHOP }, data: { ratings: 4.3 } });
    expect(db.notifications.create.mock.calls[0][0].data).toMatchObject({ recieverId: 'seller1', creatorId: 'u1', title: 'New Review Received' });
  });

  it('still succeeds when the seller notification fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    db.notifications.create.mockRejectedValue(new Error('boom'));
    expect((await run(createReview, reviewReq())).code).toBe(201);
  });
});

describe('updateReview / deleteReview', () => {
  it('cannot edit or delete a review you have not written (404)', async () => {
    expect((await run(updateReview, reviewReq())).error.statusCode).toBe(404);
    expect((await run(deleteReview, reviewReq())).error.statusCode).toBe(404);
  });

  it('edits only your own review and recomputes the average', async () => {
    db.shopReviews.findFirst.mockResolvedValue({ id: 'mine' });
    db.shopReviews.update.mockResolvedValue({ id: 'mine' });
    const { code } = await run(updateReview, reviewReq({ rating: 2, text: 'Changed my mind about it.' }));
    expect(code).toBe(200);
    expect(db.shopReviews.findFirst.mock.calls[0][0].where).toEqual({ userId: 'u1', shopsId: SHOP });
    expect(db.shopReviews.update.mock.calls[0][0].where).toEqual({ id: 'mine' });
    expect(db.shops.update).toHaveBeenCalled();
  });

  it('deletes your review and recomputes the average; an empty shop goes back to 0', async () => {
    db.shopReviews.findFirst.mockResolvedValue({ id: 'mine' });
    db.shopReviews.aggregate.mockResolvedValue({ _avg: { rating: null } });
    const { code, body } = await run(deleteReview, reviewReq());
    expect(code).toBe(200);
    expect(body.average).toBe(0);
    expect(db.shopReviews.delete).toHaveBeenCalledWith({ where: { id: 'mine' } });
  });
});

describe('getShopReviews', () => {
  beforeEach(() => {
    db.shopReviews.findMany.mockResolvedValue([]);
    db.shopReviews.count.mockResolvedValue(23);
    db.shopReviews.groupBy.mockResolvedValue([{ rating: 5, _count: { _all: 10 } }, { rating: 4, _count: { _all: 13 } }]);
  });

  it('paginates newest first and reports average and distribution', async () => {
    const { body } = await run(getShopReviews, { params: { shopId: SHOP }, query: { page: '2', limit: '10' } });
    const query = db.shopReviews.findMany.mock.calls[0][0];
    expect(query).toMatchObject({ skip: 10, take: 10, orderBy: { createdAt: 'desc' } });
    expect(body.pagination).toEqual({ page: 2, limit: 10, total: 23, pages: 3 });
    expect(body.distribution).toEqual({ '1': 0, '2': 0, '3': 0, '4': 13, '5': 10 });
    expect(body.average).toBe(4.3);
  });

  it('clamps silly page sizes', async () => {
    await run(getShopReviews, { params: { shopId: SHOP }, query: { page: '-4', limit: '9999' } });
    expect(db.shopReviews.findMany.mock.calls[0][0]).toMatchObject({ skip: 0, take: 50 });
  });

  it('tells an eligible buyer they can review, and a reviewer what their own review is', async () => {
    db.shopReviews.findFirst.mockResolvedValue(null);
    expect((await run(getShopReviews, { user: buyer, params: { shopId: SHOP } })).body.viewer).toEqual({ canReview: true, myReview: null });

    db.shopReviews.findFirst.mockResolvedValue({ id: 'mine' });
    expect((await run(getShopReviews, { user: buyer, params: { shopId: SHOP } })).body.viewer).toEqual({ canReview: false, myReview: { id: 'mine' } });

    db.shopReviews.findFirst.mockResolvedValue(null);
    db.orders.count.mockResolvedValue(0);
    expect((await run(getShopReviews, { user: buyer, params: { shopId: SHOP } })).body.viewer.canReview).toBe(false);
  });

  it('does not let anonymous visitors review', async () => {
    expect((await run(getShopReviews, { params: { shopId: SHOP } })).body.viewer.canReview).toBe(false);
  });
});

describe('notifications', () => {
  const user = { user: { id: 'u1' } };
  const seller = { seller: { id: 's1' } };
  const ID = 'b'.repeat(24);

  it('lists only the caller\'s own notifications, whether they are a user or a seller', async () => {
    db.notifications.findMany.mockResolvedValue([]);
    db.notifications.count.mockResolvedValueOnce(3).mockResolvedValueOnce(1);
    await run(getNotifications, user);
    expect(db.notifications.findMany.mock.calls[0][0].where).toEqual({ recieverId: 'u1' });

    db.notifications.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0);
    await run(getNotifications, seller);
    expect(db.notifications.findMany.mock.calls[1][0].where).toEqual({ recieverId: 's1' });
  });

  it('returns the unread count and pagination', async () => {
    db.notifications.findMany.mockResolvedValue([{ id: 'n1' }]);
    db.notifications.count.mockResolvedValueOnce(45).mockResolvedValueOnce(7);
    const { body } = await run(getNotifications, { ...user, query: { page: '2', limit: '20' } });
    expect(body.unreadCount).toBe(7);
    expect(body.pagination).toEqual({ page: 2, limit: 20, total: 45, pages: 3 });
  });

  it('rejects an unauthenticated caller', async () => {
    expect((await run(getNotifications, {})).error.statusCode).toBe(401);
  });

  it('marks one notification read only if it belongs to the caller', async () => {
    db.notifications.updateMany.mockResolvedValue({ count: 1 });
    expect((await run(markNotificationRead, { ...user, params: { id: ID } })).code).toBe(200);
    expect(db.notifications.updateMany.mock.calls[0][0].where).toEqual({ id: ID, recieverId: 'u1' });

    db.notifications.updateMany.mockResolvedValue({ count: 0 });
    expect((await run(markNotificationRead, { ...user, params: { id: ID } })).error.statusCode).toBe(404);
    expect((await run(markNotificationRead, { ...user, params: { id: 'bad' } })).error.statusCode).toBe(400);
  });

  it('marks all of the caller\'s unread notifications read', async () => {
    db.notifications.updateMany.mockResolvedValue({ count: 4 });
    const { body } = await run(markAllNotificationsRead, seller);
    expect(db.notifications.updateMany.mock.calls[0][0]).toEqual({ where: { recieverId: 's1', status: 'Unread' }, data: { status: 'Read' } });
    expect(body.updated).toBe(4);
  });
});
