//stripe is replaced by a fake whose webhook "verification" just parses the body, so tests can post any payment event
jest.mock('stripe', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    webhooks: { constructEvent: (raw: string) => JSON.parse(raw) },
    paymentIntents: { create: jest.fn() },
  })),
}));

import router from '../../apps/order-service/src/routes/order.route';
import { createOrder } from '../../apps/order-service/src/controllers/order.controller';
import prisma from '@packages/libs/prisma';
import * as mail from './mocks/mail';
import { client, makeProduct, makeSellerWithShop, makeUser, resetDatabase, startApp } from './helpers';
import { resetRedis, store } from './mocks/redis';

let app: Awaited<ReturnType<typeof startApp>>;

beforeAll(async () => {
  app = await startApp(router);
});
afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});
beforeEach(async () => {
  await resetDatabase();
  resetRedis();
  mail.sentEmails.length = 0;
  mail.mailBehavior.fail = false;
  jest.restoreAllMocks();
});

//play the part of Stripe calling the webhook after a successful payment
const stripeWebhook = async (sessionId: string, userId: string) => {
  const event = { type: 'payment_intent.succeeded', data: { object: { metadata: { sessionId, userId } } } };
  const result: { code?: number; body?: unknown } = {};
  const res: any = {
    status: (code: number) => {
      result.code = code;
      return { json: (body: unknown) => (result.body = body), send: (body: unknown) => (result.body = body) };
    },
  };
  let error: unknown;
  await createOrder({ headers: { 'stripe-signature': 'sig' }, rawBody: JSON.stringify(event) } as any, res, (e?: unknown) => (error = e));
  return { ...result, error };
};

const world = async () => {
  const shopA = await makeSellerWithShop();
  const shopB = await makeSellerWithShop();
  const user = await makeUser();
  const a1 = await makeProduct(shopA.shop.id, shopA.seller.id, { sale_price: 50, stock: 10 });
  const a2 = await makeProduct(shopA.shop.id, shopA.seller.id, { sale_price: 30, stock: 4 });
  const b1 = await makeProduct(shopB.shop.id, shopB.seller.id, { sale_price: 20, stock: 7 });
  const http = client(app.baseUrl);
  http.signInAs(user.id, 'user');
  const line = (p: { id: string; sale_price: number }, shopId: string, quantity: number) => ({ id: p.id, title: 'Widget', sale_price: p.sale_price, quantity, shopId });
  return { shopA, shopB, user, a1, a2, b1, http, line };
};

describe('checkout', () => {
  it('turns a paid multi-shop cart into one order per shop with correct totals, decrements stock and consumes the session', async () => {
    const w = await world();
    const cart = [w.line(w.a1, w.shopA.shop.id, 2), w.line(w.a2, w.shopA.shop.id, 1), w.line(w.b1, w.shopB.shop.id, 3)];

    //three items: this used to crash with "a.id.localCompare is not a function"
    const session = await w.http.post('/create-payment-session', { cart });
    expect(session.status).toBe(200);
    const sessionId = session.body.sessionId;
    expect(store.has(`payment_session:${sessionId}`)).toBe(true);

    //an identical cart reuses the same session instead of creating a second
    expect((await w.http.post('/create-payment-session', { cart: [...cart].reverse() })).body.sessionId).toBe(sessionId);

    const result = await stripeWebhook(sessionId, w.user.id);
    expect(result.error).toBeUndefined();
    expect(result.code).toBe(200);

    const orders = await prisma.orders.findMany({ include: { items: true } });
    expect(orders).toHaveLength(2);
    const orderA = orders.find((o) => o.shopId === w.shopA.shop.id)!;
    const orderB = orders.find((o) => o.shopId === w.shopB.shop.id)!;
    expect(orderA).toMatchObject({ userId: w.user.id, status: 'Paid', total: 50 * 2 + 30 });
    expect(orderA.items).toHaveLength(2);
    expect(orderB).toMatchObject({ status: 'Paid', total: 60 });

    const stock = async (id: string) => (await prisma.products.findUnique({ where: { id } }))!;
    expect(await stock(w.a1.id)).toMatchObject({ stock: 8, totalSales: 2 });
    expect(await stock(w.a2.id)).toMatchObject({ stock: 3, totalSales: 1 });
    expect(await stock(w.b1.id)).toMatchObject({ stock: 4, totalSales: 3 });
    expect((await prisma.productAnalytics.findUnique({ where: { productId: w.a1.id } }))!.purchases).toBe(2);

    //the session is gone, the buyer was emailed, and each seller was notified
    expect(store.has(`payment_session:${sessionId}`)).toBe(false);
    expect(mail.sentEmails.at(-1)).toMatchObject({ to: w.user.email, template: 'order-confirmation' });
    const notified = (await prisma.notifications.findMany()).map((n) => n.recieverId);
    expect(notified).toEqual(expect.arrayContaining([w.shopA.seller.id, w.shopB.seller.id]));
  });

  it('does not create duplicate orders when Stripe retries the webhook', async () => {
    const w = await world();
    const session = await w.http.post('/create-payment-session', { cart: [w.line(w.a1, w.shopA.shop.id, 1)] });
    await stripeWebhook(session.body.sessionId, w.user.id);
    expect(await prisma.orders.count()).toBe(1);

    const retry = await stripeWebhook(session.body.sessionId, w.user.id);
    expect(retry.code).toBe(404);
    expect(await prisma.orders.count()).toBe(1);
    expect((await prisma.products.findUnique({ where: { id: w.a1.id } }))!.stock).toBe(9);
  });

  it('still completes the order when the confirmation email fails (the session is consumed first)', async () => {
    const w = await world();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    mail.mailBehavior.fail = true;
    const session = await w.http.post('/create-payment-session', { cart: [w.line(w.a1, w.shopA.shop.id, 1)] });

    const result = await stripeWebhook(session.body.sessionId, w.user.id);
    expect(result.code).toBe(200);
    expect(await prisma.orders.count()).toBe(1);
    expect(store.has(`payment_session:${session.body.sessionId}`)).toBe(false);
    //and a retry still cannot duplicate it
    expect((await stripeWebhook(session.body.sessionId, w.user.id)).code).toBe(404);
    expect(await prisma.orders.count()).toBe(1);
  });

  it('applies a percentage coupon only to the discounted product\'s shop order', async () => {
    const w = await world();
    const cart = [w.line(w.a1, w.shopA.shop.id, 2), w.line(w.b1, w.shopB.shop.id, 1)];
    const session = await w.http.post('/create-payment-session', { cart, coupon: { discountedProductId: w.a1.id, discountPercent: 10, discountAmount: 0 } });
    await stripeWebhook(session.body.sessionId, w.user.id);

    const orders = await prisma.orders.findMany();
    expect(orders.find((o) => o.shopId === w.shopA.shop.id)!.total).toBe(90); // 100 less 10%
    expect(orders.find((o) => o.shopId === w.shopB.shop.id)!.total).toBe(20);
  });

  it('rejects an empty cart and requires a signed-in buyer', async () => {
    const w = await world();
    expect((await w.http.post('/create-payment-session', { cart: [] })).status).toBe(400);
    expect((await client(app.baseUrl).post('/create-payment-session', { cart: [w.line(w.a1, w.shopA.shop.id, 1)] })).status).toBe(401);
  });
});

describe('verify-coupon', () => {
  it('computes percentage and flat discounts, capped at the line price', async () => {
    const w = await world();
    const pct = await prisma.discount_codes.create({ data: { public_name: 'Ten', discountType: 'percentage', discountValue: 10, discountCode: 'TEN', sellerId: w.shopA.seller.id } });
    const flat = await prisma.discount_codes.create({ data: { public_name: 'Huge', discountType: 'flat', discountValue: 500, discountCode: 'HUGE', sellerId: w.shopA.seller.id } });
    const cart = (codeId: string) => [{ ...w.line(w.a1, w.shopA.shop.id, 2), discount_codes: [codeId] }];

    const tenPercent = await w.http.post('/verify-coupon', { couponCode: 'TEN', cart: cart(pct.id) });
    expect(tenPercent.body).toMatchObject({ valid: true, discountAmount: '10.00' });

    const capped = await w.http.post('/verify-coupon', { couponCode: 'HUGE', cart: cart(flat.id) });
    expect(capped.body.discountAmount).toBe('100.00'); // cannot exceed the 2 x $50 line

    const notApplicable = await w.http.post('/verify-coupon', { couponCode: 'TEN', cart: [w.line(w.b1, w.shopB.shop.id, 1)] });
    expect(notApplicable.body.valid).toBe(false);

    expect((await w.http.post('/verify-coupon', { couponCode: 'NOPE', cart: cart(pct.id) })).status).toBe(400);
  });
});

describe('delivery status updates', () => {
  it('lets only the owning seller update an order and notifies the buyer', async () => {
    const w = await world();
    const order = await prisma.orders.create({ data: { userId: w.user.id, shopId: w.shopA.shop.id, total: 50, status: 'Paid' } });

    const intruder = client(app.baseUrl);
    intruder.signInAs(w.shopB.seller.id, 'seller');
    expect((await intruder.put(`/update-status/${order.id}`, { deliveryStatus: 'Shipped' })).status).toBe(403);
    expect((await prisma.orders.findUnique({ where: { id: order.id } }))!.deliveryStatus).toBe('Ordered');

    const owner = client(app.baseUrl);
    owner.signInAs(w.shopA.seller.id, 'seller');
    expect((await owner.put(`/update-status/${order.id}`, { deliveryStatus: 'Shipped' })).status).toBe(200);
    expect((await prisma.orders.findUnique({ where: { id: order.id } }))!.deliveryStatus).toBe('Shipped');
    const note = await prisma.notifications.findFirst({ where: { recieverId: w.user.id } });
    expect(note!.message).toMatch(/Shipped/);

    expect((await owner.put(`/update-status/${order.id}`, { deliveryStatus: 'Teleported' })).status).toBe(400);
  });
});
