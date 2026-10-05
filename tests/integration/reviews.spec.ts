import router from '../../apps/product-service/src/routes/product.routes';
import orderRouter from '../../apps/order-service/src/routes/order.route';
import prisma from '@packages/libs/prisma';
import { client, makeSellerWithShop, makeUser, resetDatabase, startApp } from './helpers';

jest.mock('@packages/libs/imagekit', () => ({ __esModule: true, default: {} }));
jest.mock('stripe', () => ({ __esModule: true, default: jest.fn().mockImplementation(() => ({ webhooks: {}, paymentIntents: {} })) }));

let app: Awaited<ReturnType<typeof startApp>>;
let orderApp: Awaited<ReturnType<typeof startApp>>;

beforeAll(async () => {
  app = await startApp(router);
  orderApp = await startApp(orderRouter);
});
afterAll(async () => {
  await app.close();
  await orderApp.close();
  await prisma.$disconnect();
});
beforeEach(resetDatabase);

const TEXT = 'Arrived quickly and exactly as described.';

const setup = async () => {
  const { seller, shop } = await makeSellerWithShop();
  const buyer = await makeUser();
  const stranger = await makeUser();
  const as = (id: string, role: 'user' | 'seller' = 'user', base = app.baseUrl) => {
    const http = client(base);
    http.signInAs(id, role);
    return http;
  };
  return { seller, shop, buyer, stranger, as };
};

describe('review eligibility', () => {
  it('rejects a user who has never bought from the shop, and accepts them once a paid order exists', async () => {
    const s = await setup();
    const http = s.as(s.buyer.id);

    const rejected = await http.post(`/shop/${s.shop.id}/review`, { rating: 5, text: TEXT });
    expect(rejected.status).toBe(403);
    expect(await prisma.shopReviews.count()).toBe(0);

    //an unpaid order is not a purchase
    await prisma.orders.create({ data: { userId: s.buyer.id, shopId: s.shop.id, total: 10, status: 'Pending' } });
    expect((await http.post(`/shop/${s.shop.id}/review`, { rating: 5, text: TEXT })).status).toBe(403);

    await prisma.orders.create({ data: { userId: s.buyer.id, shopId: s.shop.id, total: 10, status: 'Paid' } });
    const accepted = await http.post(`/shop/${s.shop.id}/review`, { rating: 5, text: TEXT });
    expect(accepted.status).toBe(201);
    expect((await prisma.shops.findUnique({ where: { id: s.shop.id } }))!.ratings).toBe(5);
  });

  it('does not let a purchase from one shop review another', async () => {
    const s = await setup();
    const other = await makeSellerWithShop();
    await prisma.orders.create({ data: { userId: s.buyer.id, shopId: other.shop.id, total: 10, status: 'Paid' } });
    expect((await s.as(s.buyer.id).post(`/shop/${s.shop.id}/review`, { rating: 4, text: TEXT })).status).toBe(403);
  });

  it('is only for customers: sellers and anonymous visitors are refused', async () => {
    const s = await setup();
    expect((await s.as(s.seller.id, 'seller').post(`/shop/${s.shop.id}/review`, { rating: 5, text: TEXT })).status).toBe(403);
    expect((await client(app.baseUrl).post(`/shop/${s.shop.id}/review`, { rating: 5, text: TEXT })).status).toBe(401);
  });
});

describe('review lifecycle', () => {
  it('keeps the shop average in step with creates, edits and deletes, and notifies the seller of new reviews', async () => {
    const s = await setup();
    for (const user of [s.buyer, s.stranger]) await prisma.orders.create({ data: { userId: user.id, shopId: s.shop.id, total: 10, status: 'Paid' } });
    const buyer = s.as(s.buyer.id);
    const other = s.as(s.stranger.id);
    const average = async () => (await prisma.shops.findUnique({ where: { id: s.shop.id } }))!.ratings;

    expect((await buyer.post(`/shop/${s.shop.id}/review`, { rating: 5, text: TEXT })).status).toBe(201);
    expect((await other.post(`/shop/${s.shop.id}/review`, { rating: 2, text: TEXT })).status).toBe(201);
    expect(await average()).toBe(3.5);

    //one review per user per shop
    expect((await buyer.post(`/shop/${s.shop.id}/review`, { rating: 1, text: TEXT })).status).toBe(400);

    expect((await buyer.put(`/shop/${s.shop.id}/review`, { rating: 3, text: 'Changed my mind a little.' })).status).toBe(200);
    expect(await average()).toBe(2.5);

    expect((await other.delete(`/shop/${s.shop.id}/review`)).status).toBe(200);
    expect(await average()).toBe(3);
    expect(await prisma.shopReviews.count()).toBe(1);

    const sellerNotes = await prisma.notifications.findMany({ where: { recieverId: s.seller.id } });
    expect(sellerNotes).toHaveLength(2);
    expect(sellerNotes[0].title).toBe('New Review Received');

    //the seller sees them through the notification API, and can mark them read
    const sellerOrderApi = s.as(s.seller.id, 'seller', orderApp.baseUrl);
    const list = await sellerOrderApi.get('/notifications');
    expect(list.body.unreadCount).toBe(2);
    expect((await sellerOrderApi.patch('/notifications/read-all')).body.updated).toBe(2);
    expect((await sellerOrderApi.get('/notifications')).body.unreadCount).toBe(0);

    //another account's notifications are invisible, and cannot be marked read
    expect((await s.as(s.buyer.id, 'user', orderApp.baseUrl).get('/notifications')).body.notifications).toHaveLength(0);
    expect((await s.as(s.buyer.id, 'user', orderApp.baseUrl).patch(`/notifications/${sellerNotes[0].id}/read`)).status).toBe(404);
  });

  it('validates rating and text', async () => {
    const s = await setup();
    await prisma.orders.create({ data: { userId: s.buyer.id, shopId: s.shop.id, total: 10, status: 'Paid' } });
    const http = s.as(s.buyer.id);
    expect((await http.post(`/shop/${s.shop.id}/review`, { rating: 6, text: TEXT })).status).toBe(400);
    expect((await http.post(`/shop/${s.shop.id}/review`, { rating: 3, text: 'too short' })).status).toBe(400);
    expect((await http.post(`/shop/nonsense/review`, { rating: 3, text: TEXT })).status).toBe(400);
  });

  it('reports eligibility, the distribution and pagination to the shop page', async () => {
    const s = await setup();
    const reviewers = await Promise.all([makeUser(), makeUser(), makeUser()]);
    for (const [i, user] of reviewers.entries()) {
      await prisma.orders.create({ data: { userId: user.id, shopId: s.shop.id, total: 10, status: 'Paid' } });
      await prisma.shopReviews.create({ data: { userId: user.id, shopsId: s.shop.id, rating: i + 3, reviews: TEXT } });
    }
    await prisma.orders.create({ data: { userId: s.buyer.id, shopId: s.shop.id, total: 10, status: 'Paid' } });

    const page = await s.as(s.buyer.id).get(`/shop/${s.shop.id}/reviews?page=1&limit=2`);
    expect(page.status).toBe(200);
    expect(page.body.reviews).toHaveLength(2);
    expect(page.body.pagination).toEqual({ page: 1, limit: 2, total: 3, pages: 2 });
    expect(page.body.distribution).toEqual({ '1': 0, '2': 0, '3': 1, '4': 1, '5': 1 });
    expect(page.body.average).toBe(4);
    expect(page.body.viewer).toEqual({ canReview: true, myReview: null });
    expect(page.body.reviews[0].user).toEqual(expect.objectContaining({ name: expect.any(String) }));

    //visitors can read, but are not offered the form
    const anon = await client(app.baseUrl).get(`/shop/${s.shop.id}/reviews`);
    expect(anon.status).toBe(200);
    expect(anon.body.viewer.canReview).toBe(false);
  });
});
