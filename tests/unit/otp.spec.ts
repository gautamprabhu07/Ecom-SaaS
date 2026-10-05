import { validateRegistrationData, checkOtpRestrictions, trackOtpRequest, sendOtp, verifyOtp, handleforgotPassword, verifyForgotPasswordOtp } from '../../apps/auth-service/src/utils/auth.helper';
import prisma from '@packages/libs/prisma';
import { sendEmail } from '../../apps/auth-service/src/utils/sendMail';

//an in-memory stand-in for Redis that honours the calls auth.helper makes (get / set with EX / del)
const store = new Map<string, string>();
const ttl = new Map<string, number>();
jest.mock('@packages/libs/redis', () => ({
  __esModule: true,
  default: {
    get: jest.fn(async (k: string) => store.get(k) ?? null),
    set: jest.fn(async (k: string, v: unknown, _ex?: string, seconds?: number) => {
      store.set(k, String(v));
      if (seconds) ttl.set(k, seconds);
      return 'OK';
    }),
    del: jest.fn(async (...keys: string[]) => keys.forEach((k) => store.delete(k))),
  },
}));
jest.mock('@packages/libs/prisma', () => ({ __esModule: true, default: { users: { findUnique: jest.fn() }, sellers: { findUnique: jest.fn() } } }));
const mockUsers = (prisma as any).users;
const mockSellers = (prisma as any).sellers;
jest.mock('../../apps/auth-service/src/utils/sendMail', () => ({ sendEmail: jest.fn().mockResolvedValue(undefined) }));

const EMAIL = 'shopper@example.com';
const next = jest.fn();

//the helpers signal problems by throwing a ValidationError
const failure = async (promise: Promise<unknown>) => promise.then(() => null, (e) => e);

beforeEach(() => {
  store.clear();
  ttl.clear();
  jest.clearAllMocks();
});

describe('validateRegistrationData', () => {
  const valid = { name: 'Una', email: EMAIL, password: 'pw12345678' };

  it('accepts a complete user registration', () => {
    expect(() => validateRegistrationData(valid, 'user')).not.toThrow();
  });

  it('rejects missing fields and malformed emails', () => {
    expect(() => validateRegistrationData({ ...valid, name: '' }, 'user')).toThrow(/Missing required/);
    expect(() => validateRegistrationData({ ...valid, email: 'not-an-email' }, 'user')).toThrow(/Invalid email/);
  });

  it('requires phone number and country for sellers only', () => {
    expect(() => validateRegistrationData(valid, 'seller')).toThrow(/Missing required/);
    expect(() => validateRegistrationData({ ...valid, phone_number: '+10000000', country: 'US' }, 'seller')).not.toThrow();
  });
});

describe('sendOtp', () => {
  it('stores a 4-digit OTP for 5 minutes, sets a 1-minute cooldown and emails it', async () => {
    await sendOtp('Una', EMAIL, 'user-activation-mail');
    const otp = store.get(`otp:${EMAIL}`)!;
    expect(otp).toMatch(/^\d{4}$/);
    expect(ttl.get(`otp:${EMAIL}`)).toBe(300);
    expect(store.get(`otp_cooldown:${EMAIL}`)).toBe('true');
    expect(ttl.get(`otp_cooldown:${EMAIL}`)).toBe(60);
    expect(sendEmail).toHaveBeenCalledWith(EMAIL, expect.any(String), 'user-activation-mail', { name: 'Una', otp });
  });
});

describe('checkOtpRestrictions', () => {
  it('passes when nothing is locked', async () => {
    expect(await failure(checkOtpRestrictions(EMAIL, next))).toBeNull();
  });

  it('blocks a request made inside the 1-minute cooldown', async () => {
    store.set(`otp_cooldown:${EMAIL}`, 'true');
    expect((await failure(checkOtpRestrictions(EMAIL, next))).message).toMatch(/once every minute/);
  });

  it('blocks while the spam lock is active', async () => {
    store.set(`otp_spam_lock:${EMAIL}`, 'locked');
    expect((await failure(checkOtpRestrictions(EMAIL, next))).message).toMatch(/maximum number of OTP requests/);
  });

  it('blocks while the failed-attempt lock is active, and that lock wins over the others', async () => {
    store.set(`otp_lock:${EMAIL}`, 'locked');
    store.set(`otp_cooldown:${EMAIL}`, 'true');
    expect((await failure(checkOtpRestrictions(EMAIL, next))).message).toMatch(/30 minutes/);
  });
});

describe('trackOtpRequest (spam throttle)', () => {
  it('allows two requests an hour and counts them', async () => {
    await trackOtpRequest(EMAIL, next);
    await trackOtpRequest(EMAIL, next);
    expect(store.get(`otp_request_count:${EMAIL}`)).toBe('2');
    expect(ttl.get(`otp_request_count:${EMAIL}`)).toBe(3600);
  });

  it('locks the account for an hour on the third request', async () => {
    await trackOtpRequest(EMAIL, next);
    await trackOtpRequest(EMAIL, next);
    const error = await failure(trackOtpRequest(EMAIL, next));
    expect(error.statusCode).toBe(400);
    expect(store.get(`otp_spam_lock:${EMAIL}`)).toBe('locked');
    expect(ttl.get(`otp_spam_lock:${EMAIL}`)).toBe(3600);
  });

  it('counts each email separately', async () => {
    await trackOtpRequest(EMAIL, next);
    await trackOtpRequest(EMAIL, next);
    expect(await failure(trackOtpRequest('other@example.com', next))).toBeNull();
  });
});

describe('verifyOtp', () => {
  beforeEach(() => store.set(`otp:${EMAIL}`, '1234'));

  it('rejects when no OTP is stored (expired)', async () => {
    store.clear();
    expect((await failure(verifyOtp(EMAIL, '1234', next))).message).toMatch(/expired/);
  });

  it('accepts the right code and clears the OTP and failed-attempt counter', async () => {
    store.set(`otp_failed_attempts:${EMAIL}`, '1');
    expect(await failure(verifyOtp(EMAIL, '1234', next))).toBeNull();
    expect(store.has(`otp:${EMAIL}`)).toBe(false);
    expect(store.has(`otp_failed_attempts:${EMAIL}`)).toBe(false);
  });

  it('counts wrong guesses and reports attempts remaining', async () => {
    const first = await failure(verifyOtp(EMAIL, '0000', next));
    expect(first.message).toMatch(/2 attempts remaining/);
    const second = await failure(verifyOtp(EMAIL, '0000', next));
    expect(second.message).toMatch(/1 attempts remaining/);
    expect(store.get(`otp_failed_attempts:${EMAIL}`)).toBe('2');
  });

  it('locks the account for 30 minutes and discards the OTP on the third wrong guess', async () => {
    await failure(verifyOtp(EMAIL, '0000', next));
    await failure(verifyOtp(EMAIL, '0000', next));
    const third = await failure(verifyOtp(EMAIL, '0000', next));
    expect(third.message).toMatch(/locked/);
    expect(store.get(`otp_lock:${EMAIL}`)).toBe('locked');
    expect(ttl.get(`otp_lock:${EMAIL}`)).toBe(1800);
    expect(store.has(`otp:${EMAIL}`)).toBe(false);
    //even the correct code no longer works: a fresh OTP is required, and checkOtpRestrictions refuses to issue one
    expect((await failure(checkOtpRestrictions(EMAIL, next))).message).toMatch(/30 minutes/);
  });

  it('does not let a success after two failures leave a lingering counter', async () => {
    await failure(verifyOtp(EMAIL, '0000', next));
    await failure(verifyOtp(EMAIL, '0000', next));
    expect(await failure(verifyOtp(EMAIL, '1234', next))).toBeNull();
    store.set(`otp:${EMAIL}`, '1234');
    //counter was cleared, so a new wrong guess starts again from "2 attempts remaining"
    expect((await failure(verifyOtp(EMAIL, '0000', next))).message).toMatch(/2 attempts remaining/);
  });
});

describe('forgot-password flow', () => {
  const makeRes = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  it('requires an email and a known account', async () => {
    const next = jest.fn();
    await handleforgotPassword({ body: {} } as any, makeRes(), next, 'user');
    expect(next.mock.calls[0][0].message).toMatch(/Email is required/);

    mockUsers.findUnique.mockResolvedValue(null);
    const next2 = jest.fn();
    await handleforgotPassword({ body: { email: EMAIL } } as any, makeRes(), next2, 'user');
    expect(next2.mock.calls[0][0].message).toMatch(/No user found/);
  });

  it('sends a seller-template OTP to a seller and counts the request', async () => {
    mockSellers.findUnique.mockResolvedValue({ name: 'Sam' });
    const res = makeRes();
    await handleforgotPassword({ body: { email: EMAIL } } as any, res, jest.fn(), 'seller');
    expect(sendEmail).toHaveBeenCalledWith(EMAIL, expect.any(String), 'forgot-password-seller-mail', expect.objectContaining({ name: 'Sam' }));
    expect(store.get(`otp_request_count:${EMAIL}`)).toBe('1');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('is refused during the cooldown, before any email is sent', async () => {
    mockUsers.findUnique.mockResolvedValue({ name: 'Una' });
    store.set(`otp_cooldown:${EMAIL}`, 'true');
    const next = jest.fn();
    await handleforgotPassword({ body: { email: EMAIL } } as any, makeRes(), next, 'user');
    expect(next.mock.calls[0][0].message).toMatch(/once every minute/);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('verifies the OTP, and reports wrong or missing input', async () => {
    store.set(`otp:${EMAIL}`, '4321');
    const res = makeRes();
    await verifyForgotPasswordOtp({ body: { email: EMAIL, otp: '4321' } } as any, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);

    const next = jest.fn();
    await verifyForgotPasswordOtp({ body: { email: EMAIL } } as any, makeRes(), next);
    expect(next.mock.calls[0][0].message).toMatch(/required/);
  });
});
