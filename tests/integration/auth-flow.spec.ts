import bcrypt from 'bcryptjs';
import router from '../../apps/auth-service/src/routes/auth.router';
import prisma from '@packages/libs/prisma';
import { client, resetDatabase, startApp } from './helpers';
import { resetRedis, store } from './mocks/redis';
import { sentEmails } from './mocks/mail';

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
  sentEmails.length = 0;
});

const PASSWORD = 'Sup3rSecret!';

describe('user: signup -> OTP -> login -> refresh', () => {
  it('completes the whole journey', async () => {
    const http = client(app.baseUrl);
    const email = 'new.user@test.dev';

    const signup = await http.post('/user-registration', { name: 'New User', email, password: PASSWORD });
    expect(signup.status).toBe(200);
    expect(sentEmails.at(-1)).toMatchObject({ to: email, template: 'user-activation-mail' });
    const otp = store.get(`otp:${email}`)!;
    expect(otp).toMatch(/^\d{4}$/);

    //wrong OTP is refused and nothing is created
    const wrong = await http.post('/verify-user', { name: 'New User', email, password: PASSWORD, otp: otp === '1234' ? '4321' : '1234' });
    expect(wrong.status).toBe(400);
    expect(await prisma.users.count({ where: { email } })).toBe(0);

    const verified = await http.post('/verify-user', { name: 'New User', email, password: PASSWORD, otp });
    expect(verified.status).toBe(201);
    const stored = await prisma.users.findUnique({ where: { email } });
    expect(stored!.password).not.toBe(PASSWORD); //hashed
    expect(await bcrypt.compare(PASSWORD, stored!.password!)).toBe(true);

    //a second signup with the same email is rejected
    expect((await http.post('/user-registration', { name: 'New User', email, password: PASSWORD })).status).toBe(400);

    expect((await http.post('/login-user', { email, password: 'wrong' })).status).toBe(401);
    const login = await http.post('/login-user', { email, password: PASSWORD });
    expect(login.status).toBe(200);
    expect(http.cookie('access_token')).toBeTruthy();
    expect(http.cookie('refresh_token')).toBeTruthy();

    expect((await http.get('/logged-in-user')).body.user.email).toBe(email);

    //the access token "expires" (cookie dropped); the refresh token mints a new one
    http.forget('access_token');
    expect((await http.get('/logged-in-user')).status).toBe(401);
    expect((await http.post('/refresh-token')).status).toBe(200);
    expect(http.cookie('access_token')).toBeTruthy();
    expect((await http.get('/logged-in-user')).status).toBe(200);
  });

  it('refuses a refresh with no or a forged refresh token', async () => {
    const http = client(app.baseUrl);
    expect((await http.post('/refresh-token')).status).toBe(400);
    const forged = await http.post('/refresh-token', undefined);
    expect(forged.status).toBe(400);
  });

  it('throttles OTP requests: a second request inside the cooldown is refused', async () => {
    const http = client(app.baseUrl);
    const body = { name: 'A', email: 'throttle@test.dev', password: PASSWORD };
    expect((await http.post('/user-registration', body)).status).toBe(200);
    const again = await http.post('/user-registration', body);
    expect(again.status).toBe(400);
    expect(again.body.message).toMatch(/once every minute/);
  });
});

describe('seller: signup -> OTP -> shop -> login -> refresh', () => {
  it('completes the whole journey', async () => {
    const http = client(app.baseUrl);
    const email = 'seller@test.dev';
    const details = { name: 'Sam Seller', email, password: PASSWORD, phone_number: '+10000000', country: 'US' };

    expect((await http.post('/seller-registration', details)).status).toBe(200);
    expect(sentEmails.at(-1)).toMatchObject({ to: email, template: 'seller-activation' });
    const otp = store.get(`otp:${email}`)!;

    const verified = await http.post('/verify-seller', { ...details, otp });
    expect(verified.status).toBe(201);
    const sellerId = verified.body.seller.id;

    const shop = await http.post('/create-shop', { name: 'Sam Shop', bio: 'We sell things', address: '1 Main St', opening_hours: '9-5', website: 'https://sam.example', category: 'Electronics', sellerId });
    expect(shop.status).toBe(201);

    expect((await http.post('/login-seller', { email, password: 'nope' })).status).toBe(401);
    expect((await http.post('/login-seller', { email, password: PASSWORD })).status).toBe(200);
    expect(http.cookie('seller_access_token')).toBeTruthy();
    expect(http.cookie('seller_refresh_token')).toBeTruthy();

    const me = await http.get('/logged-in-seller');
    expect(me.status).toBe(200);
    expect(me.body.seller.shop.name).toBe('Sam Shop');

    http.forget('seller_access_token');
    expect((await http.get('/logged-in-seller')).status).toBe(401);
    expect((await http.post('/refresh-token')).status).toBe(200);
    expect((await http.get('/logged-in-seller')).status).toBe(200);
  });

  it('keeps a user session out of seller-only routes (403, not 401)', async () => {
    const user = await prisma.users.create({ data: { name: 'U', email: 'u@test.dev', password: 'x' } });
    const http = client(app.baseUrl);
    http.signInAs(user.id, 'user');
    expect((await http.get('/logged-in-seller')).status).toBe(403);
  });
});

describe('admin: login -> refresh', () => {
  const email = 'admin@test.dev';

  beforeEach(async () => {
    await prisma.users.create({ data: { name: 'Admin', email, password: await bcrypt.hash(PASSWORD, 10), role: 'admin' } });
  });

  it('logs an admin in, serves admin routes and refreshes the session', async () => {
    const http = client(app.baseUrl);
    expect((await http.post('/login-admin', { email, password: 'wrong' })).status).toBe(401);
    expect((await http.post('/login-admin', { email, password: PASSWORD })).status).toBe(200);
    expect((await http.get('/logged-in-admin')).status).toBe(200);

    http.forget('access_token');
    expect((await http.get('/logged-in-admin')).status).toBe(401);
    expect((await http.post('/refresh-token')).status).toBe(200);
    expect((await http.get('/logged-in-admin')).status).toBe(200);
  });

  it('refuses a normal user at the admin login, and a user token at admin routes', async () => {
    await prisma.users.create({ data: { name: 'Plain', email: 'plain@test.dev', password: await bcrypt.hash(PASSWORD, 10) } });
    const http = client(app.baseUrl);
    expect((await http.post('/login-admin', { email: 'plain@test.dev', password: PASSWORD })).status).toBe(401);

    expect((await http.post('/login-user', { email: 'plain@test.dev', password: PASSWORD })).status).toBe(200);
    expect((await http.get('/logged-in-admin')).status).toBe(403);
  });
});
