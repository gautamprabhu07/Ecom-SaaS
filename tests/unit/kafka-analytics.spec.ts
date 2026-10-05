import { updateUserAnalytics, updateProductAnalytics, updateShopAnalytics } from '../../apps/kafka-service/src/services/analytics.services';
import prisma from '@packages/libs/prisma';

jest.mock('@packages/libs/prisma', () => ({
  __esModule: true,
  default: {
    userAnalytics: { findUnique: jest.fn(), upsert: jest.fn() },
    productAnalytics: { upsert: jest.fn() },
    shopAnalytics: { findUnique: jest.fn(), upsert: jest.fn((args: any) => ({ op: 'shopAnalytics.upsert', args })) },
    uniqueShopVisitors: { findUnique: jest.fn(), create: jest.fn((args: any) => ({ op: 'visitor.create', args })) },
    $transaction: jest.fn(),
  },
}));

const db: any = prisma;
const quiet = jest.spyOn(console, 'error').mockImplementation(() => undefined);
afterAll(() => quiet.mockRestore());

beforeEach(() => {
  jest.clearAllMocks();
  db.userAnalytics.findUnique.mockResolvedValue(null);
  db.shopAnalytics.findUnique.mockResolvedValue(null);
  db.uniqueShopVisitors.findUnique.mockResolvedValue(null);
});

const savedActions = () => db.userAnalytics.upsert.mock.calls[0][0].update.actions as any[];
const existing = (actions: any[]) => db.userAnalytics.findUnique.mockResolvedValue({ actions });

describe('updateUserAnalytics', () => {
  it('records every product_view, even repeated ones (the recommender uses them)', async () => {
    existing([{ productId: 'p1', action: 'product_view' }]);
    await updateUserAnalytics({ userId: 'u1', productId: 'p1', shopId: 's1', action: 'product_view' });
    expect(savedActions().filter((a) => a.action === 'product_view')).toHaveLength(2);
  });

  it('records a wishlist or cart add once: a repeat of the same product and action is ignored', async () => {
    existing([{ productId: 'p1', action: 'add_to_cart' }]);
    await updateUserAnalytics({ userId: 'u1', productId: 'p1', action: 'add_to_cart' });
    expect(savedActions()).toHaveLength(1);

    jest.clearAllMocks();
    existing([{ productId: 'p1', action: 'add_to_cart' }]);
    await updateUserAnalytics({ userId: 'u1', productId: 'p1', action: 'add_to_wishlist' });
    expect(savedActions().map((a) => a.action)).toEqual(['add_to_cart', 'add_to_wishlist']);
  });

  it('removes the matching add when the item is removed from the cart or wishlist', async () => {
    existing([
      { productId: 'p1', action: 'add_to_cart' },
      { productId: 'p1', action: 'add_to_wishlist' },
      { productId: 'p2', action: 'add_to_cart' },
    ]);
    await updateUserAnalytics({ userId: 'u1', productId: 'p1', action: 'remove_from_cart' });
    expect(savedActions().map((a) => `${a.productId}:${a.action}`)).toEqual(['p1:add_to_wishlist', 'p2:add_to_cart']);

    jest.clearAllMocks();
    existing([{ productId: 'p1', action: 'add_to_wishlist' }]);
    await updateUserAnalytics({ userId: 'u1', productId: 'p1', action: 'remove_from_wishlist' });
    expect(savedActions()).toEqual([]);
  });

  it('keeps at most 100 actions, dropping the oldest', async () => {
    existing(Array.from({ length: 100 }, (_, i) => ({ productId: `old${i}`, action: 'product_view' })));
    await updateUserAnalytics({ userId: 'u1', productId: 'new', action: 'product_view' });
    const actions = savedActions();
    expect(actions).toHaveLength(100);
    expect(actions[0].productId).toBe('old1');
    expect(actions[99].productId).toBe('new');
  });

  it('stores country, city and device only when the event has them', async () => {
    await updateUserAnalytics({ userId: 'u1', productId: 'p1', action: 'product_view', country: 'India', device: 'Chrome on Windows (desktop)' });
    const { update, create } = db.userAnalytics.upsert.mock.calls[0][0];
    expect(update).toMatchObject({ country: 'India', device: 'Chrome on Windows (desktop)' });
    expect(update).not.toHaveProperty('city');
    expect(create.userId).toBe('u1');
  });

  it('lets errors propagate so the consumer can retry', async () => {
    db.userAnalytics.findUnique.mockRejectedValue(new Error('db down'));
    await expect(updateUserAnalytics({ userId: 'u1', action: 'product_view' })).rejects.toThrow('db down');
  });
});

describe('updateProductAnalytics', () => {
  const update = () => db.productAnalytics.upsert.mock.calls[0][0].update;
  const create = () => db.productAnalytics.upsert.mock.calls[0][0].create;

  it('ignores events without a product', async () => {
    await updateProductAnalytics({ action: 'product_view' });
    expect(db.productAnalytics.upsert).not.toHaveBeenCalled();
  });

  it.each([
    ['product_view', { views: { increment: 1 } }],
    ['add_to_cart', { cartAdds: { increment: 1 } }],
    ['remove_from_cart', { cartAdds: { decrement: 1 } }],
    ['add_to_wishlist', { wishlistAdds: { increment: 1 } }],
    ['remove_from_wishlist', { wishlistAdds: { decrement: 1 } }],
    ['purchase', { purchases: { increment: 1 } }],
  ])('%s updates the right counter', async (action, expected) => {
    await updateProductAnalytics({ productId: 'p1', shopId: 's1', action });
    expect(update()).toMatchObject(expected);
  });

  it('creates the row with the first event counted', async () => {
    await updateProductAnalytics({ productId: 'p1', shopId: 's1', action: 'add_to_cart' });
    expect(create()).toMatchObject({ productId: 'p1', shopId: 's1', views: 0, cartAdds: 1, wishlistAdds: 0, purchases: 0 });
  });

  it('starts counters at zero for a removal on a brand new row (no negative counts)', async () => {
    await updateProductAnalytics({ productId: 'p1', action: 'remove_from_cart' });
    expect(create().cartAdds).toBe(0);
    expect(create().shopId).toBeNull();
  });
});

describe('updateShopAnalytics', () => {
  const analyticsWrite = () => db.shopAnalytics.upsert.mock.calls[0][0];

  it('ignores events without a shop', async () => {
    await updateShopAnalytics({ userId: 'u1' });
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it('counts a first visit: new visitor row, visitor total incremented, frequency maps started', async () => {
    await updateShopAnalytics({ shopId: 's1', userId: 'u1', country: 'India', city: 'Pune', device: 'Chrome on Windows (desktop)' });
    const ops = db.$transaction.mock.calls[0][0];
    expect(ops.map((o: any) => o.op)).toEqual(['visitor.create', 'shopAnalytics.upsert']);
    expect(analyticsWrite().update.totalVisitors).toEqual({ increment: 1 });
    expect(analyticsWrite().update.countryStats).toEqual({ India: 1 });
    expect(analyticsWrite().update.cityStats).toEqual({ Pune: 1 });
    expect(analyticsWrite().update.deviceStats).toEqual({ 'Chrome on Windows (desktop)': 1 });
    expect(analyticsWrite().create.totalVisitors).toBe(1);
  });

  it('adds to existing frequency maps and does not recount a returning visitor', async () => {
    db.uniqueShopVisitors.findUnique.mockResolvedValue({ shopId: 's1', userId: 'u1' });
    db.shopAnalytics.findUnique.mockResolvedValue({ countryStats: { India: 4, France: 1 }, cityStats: { Pune: 4 }, deviceStats: { Mobile: 2 } });
    await updateShopAnalytics({ shopId: 's1', userId: 'u1', country: 'India', city: 'Delhi', device: 'Mobile' });
    const ops = db.$transaction.mock.calls[0][0];
    expect(ops.map((o: any) => o.op)).toEqual(['shopAnalytics.upsert']);
    expect(analyticsWrite().update).not.toHaveProperty('totalVisitors');
    expect(analyticsWrite().update.countryStats).toEqual({ India: 5, France: 1 });
    expect(analyticsWrite().update.cityStats).toEqual({ Pune: 4, Delhi: 1 });
    expect(analyticsWrite().update.deviceStats).toEqual({ Mobile: 3 });
  });

  it('files missing location and device under "Unknown" keys', async () => {
    await updateShopAnalytics({ shopId: 's1', userId: 'u1' });
    expect(analyticsWrite().update.countryStats).toEqual({ Unknown: 1 });
    expect(analyticsWrite().update.deviceStats).toEqual({ 'Unknown Device': 1 });
  });

  it('lets a transaction failure propagate so the consumer can retry', async () => {
    db.$transaction.mockRejectedValue(new Error('write conflict'));
    await expect(updateShopAnalytics({ shopId: 's1', userId: 'u1' })).rejects.toThrow('write conflict');
  });
});
