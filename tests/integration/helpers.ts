import express, { Router } from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import http from 'http';
import { AddressInfo } from 'net';
import prisma from '@packages/libs/prisma';
import { errorMiddleware } from '@packages/error-handler/error-middleware';

//empties every collection but keeps the collections and their indexes, so each test starts from a blank database
export const resetDatabase = async () => {
  const listed: any = await prisma.$runCommandRaw({ listCollections: 1, nameOnly: true });
  for (const { name } of listed.cursor.firstBatch) {
    if (name.startsWith('system.')) continue;
    await prisma.$runCommandRaw({ delete: name, deletes: [{ q: {}, limit: 0 }] });
  }
};

//a real HTTP server around a service's router, the same way each service's main.ts wires it
export const startApp = async (router: Router) => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api', router);
  app.use(errorMiddleware);
  const server: http.Server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
  return { baseUrl, close: () => new Promise<void>((resolve) => server.close(() => resolve())) };
};

//a tiny HTTP client that keeps cookies like a browser would (the services authenticate with httpOnly cookies)
export const client = (baseUrl: string) => {
  const jar = new Map<string, string>();

  const send = async (method: string, path: string, body?: unknown, headers: Record<string, string> = {}) => {
    const cookie = [...jar].map(([k, v]) => `${k}=${v}`).join('; ');
    const response = await fetch(baseUrl + path, {
      method,
      headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}), ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    for (const line of response.headers.getSetCookie()) {
      const [pair, ...attributes] = line.split(';');
      const [name, value] = [pair.slice(0, pair.indexOf('=')), pair.slice(pair.indexOf('=') + 1)];
      const cleared = value === '' || attributes.some((a) => /expires=thu, 01 jan 1970/i.test(a));
      if (cleared) jar.delete(name.trim());
      else jar.set(name.trim(), value);
    }
    const text = await response.text();
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = text;
    }
    return { status: response.status, body: json };
  };

  return {
    get: (path: string) => send('GET', path),
    post: (path: string, body?: unknown) => send('POST', path, body),
    put: (path: string, body?: unknown) => send('PUT', path, body),
    patch: (path: string, body?: unknown) => send('PATCH', path, body),
    delete: (path: string) => send('DELETE', path),
    cookies: jar,
    cookie: (name: string) => jar.get(name),
    forget: (name: string) => jar.delete(name),
    //sign in without going through the login endpoint: attach a freshly signed access token for the account
    signInAs: (id: string, role: 'user' | 'seller' | 'admin') => {
      const token = jwt.sign({ id, role }, process.env.ACCESS_TOKEN_SECRET!, { expiresIn: '15m' });
      jar.set(role === 'seller' ? 'seller_access_token' : 'access_token', token);
    },
  };
};

//direct database fixtures
export const makeUser = (overrides: Record<string, unknown> = {}) =>
  prisma.users.create({ data: { name: 'Test User', email: `user${Math.random().toString(36).slice(2)}@test.dev`, password: 'x', ...overrides } as any });

export const makeSellerWithShop = async (overrides: Record<string, unknown> = {}) => {
  const seller = await prisma.sellers.create({
    data: { name: 'Seller', email: `seller${Math.random().toString(36).slice(2)}@test.dev`, password: 'x', phone_number: '1', country: 'US', ...overrides } as any,
  });
  const shop = await prisma.shops.create({
    data: { name: 'Shop ' + seller.id.slice(-4), bio: 'bio', address: 'addr', opening_hours: '9-5', category: 'Electronics', sellerId: seller.id } as any,
  });
  return { seller, shop };
};

export const makeProduct = (shopId: string, sellerId: string, overrides: Record<string, unknown> = {}) =>
  prisma.products.create({
    data: {
      title: 'Widget',
      slug: `widget-${Math.random().toString(36).slice(2)}`,
      category: 'Electronics',
      subCategory: 'Gadgets',
      short_description: 'short',
      detailed_description: 'long',
      tags: ['a'],
      customProperties: {},
      stock: 10,
      sale_price: 50,
      regular_price: 60,
      sellerId,
      shopId,
      ...overrides,
    } as any,
  });
