import jwt from 'jsonwebtoken';
import isAuthenticated from '../../packages/middleware/isAuthenticated';
import isOptionalAuth from '../../packages/middleware/isOptionalAuth';
import { isUser, isSeller, isAdmin } from '../../packages/middleware/authorizeRoles';
import prisma from '@packages/libs/prisma';

jest.mock('@packages/libs/prisma', () => ({
  __esModule: true,
  default: { users: { findUnique: jest.fn() }, sellers: { findUnique: jest.fn() } },
}));

const SECRET = 'test-secret';
const sign = (payload: object, options: jwt.SignOptions = {}) => jwt.sign(payload, SECRET, { expiresIn: '15m', ...options });

const makeRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};
const makeReq = (cookies: Record<string, string> = {}, headers: Record<string, string> = {}): any => ({ cookies, headers });

const users = prisma.users.findUnique as jest.Mock;
const sellers = prisma.sellers.findUnique as jest.Mock;

beforeEach(() => {
  jest.resetAllMocks();
  process.env.ACCESS_TOKEN_SECRET = SECRET;
});

describe('isAuthenticated', () => {
  it('rejects a request with no token', async () => {
    const res = makeRes();
    const next = jest.fn();
    await isAuthenticated(makeReq(), res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('accepts a user token from the access_token cookie', async () => {
    users.mockResolvedValue({ id: 'u1', name: 'Una' });
    const req = makeReq({ access_token: sign({ id: 'u1', role: 'user' }) });
    const next = jest.fn();
    await isAuthenticated(req, makeRes(), next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual({ id: 'u1', name: 'Una' });
    expect(req.role).toBe('user');
    expect(sellers).not.toHaveBeenCalled();
  });

  it('accepts a seller token from the seller_access_token cookie and loads the shop', async () => {
    sellers.mockResolvedValue({ id: 's1', shop: { id: 'shop1' } });
    const req = makeReq({ seller_access_token: sign({ id: 's1', role: 'seller' }) });
    const next = jest.fn();
    await isAuthenticated(req, makeRes(), next);
    expect(next).toHaveBeenCalled();
    expect(req.seller.shop.id).toBe('shop1');
    expect(req.role).toBe('seller');
    expect(sellers.mock.calls[0][0].include).toEqual({ shop: true });
  });

  it('accepts an admin token and loads the account from the users table', async () => {
    users.mockResolvedValue({ id: 'a1', role: 'admin' });
    const req = makeReq({ access_token: sign({ id: 'a1', role: 'admin' }) });
    const next = jest.fn();
    await isAuthenticated(req, makeRes(), next);
    expect(next).toHaveBeenCalled();
    expect(req.role).toBe('admin');
    expect(req.user.id).toBe('a1');
  });

  it('accepts a Bearer token in the Authorization header', async () => {
    users.mockResolvedValue({ id: 'u1' });
    const req = makeReq({}, { authorization: `Bearer ${sign({ id: 'u1', role: 'user' })}` });
    const next = jest.fn();
    await isAuthenticated(req, makeRes(), next);
    expect(next).toHaveBeenCalled();
  });

  it('rejects an expired token', async () => {
    const res = makeRes();
    const next = jest.fn();
    await isAuthenticated(makeReq({ access_token: sign({ id: 'u1', role: 'user' }, { expiresIn: -10 }) }), res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects a token signed with a different secret', async () => {
    const forged = jwt.sign({ id: 'u1', role: 'admin' }, 'someone-elses-secret');
    const res = makeRes();
    const next = jest.fn();
    await isAuthenticated(makeReq({ access_token: forged }), res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects a valid token whose account no longer exists', async () => {
    users.mockResolvedValue(null);
    const res = makeRes();
    const next = jest.fn();
    await isAuthenticated(makeReq({ access_token: sign({ id: 'gone', role: 'user' }) }), res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects a token carrying an unknown role', async () => {
    const res = makeRes();
    const next = jest.fn();
    await isAuthenticated(makeReq({ access_token: sign({ id: 'x', role: 'superuser' }) }), res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('isOptionalAuth', () => {
  it('lets anonymous visitors through', async () => {
    const next = jest.fn();
    const req = makeReq();
    await isOptionalAuth(req, makeRes(), next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toBeUndefined();
  });

  it('attaches a signed-in user', async () => {
    users.mockResolvedValue({ id: 'u1' });
    const req = makeReq({ access_token: sign({ id: 'u1', role: 'user' }) });
    const next = jest.fn();
    await isOptionalAuth(req, makeRes(), next);
    expect(req.user).toEqual({ id: 'u1' });
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('treats an invalid token as a logged-out visitor instead of failing', async () => {
    const req = makeReq({ access_token: 'garbage' });
    const next = jest.fn();
    await isOptionalAuth(req, makeRes(), next);
    expect(next).toHaveBeenCalledWith();
    expect(req.user).toBeUndefined();
  });
});

describe('role guards', () => {
  const guards = { user: isUser, seller: isSeller, admin: isAdmin } as const;

  for (const [allowed, guard] of Object.entries(guards)) {
    for (const role of ['user', 'seller', 'admin', undefined]) {
      const shouldPass = role === allowed;
      it(`${allowed} guard ${shouldPass ? 'allows' : 'rejects with 403 for'} role ${role}`, () => {
        const next = jest.fn();
        guard({ role } as any, {} as any, next);
        if (shouldPass) {
          expect(next).toHaveBeenCalledWith();
        } else {
          const error = next.mock.calls[0][0];
          expect(error.statusCode).toBe(403);
        }
      });
    }
  }
});
