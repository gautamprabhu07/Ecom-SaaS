import { toCents, platformFeeCents, sellerPayoutCents, cartTotal, couponDiscount, shopOrderTotal, groupByShop, cartFingerprint } from '../../apps/order-service/src/utils/pricing';

const item = (id: string, sale_price: number, quantity: number, shopId = 'shop1') => ({ id, sale_price, quantity, shopId });

describe('platform fee (10 / 90 split)', () => {
  it('converts dollars to whole cents without float drift', () => {
    expect(toCents(19.99)).toBe(1999);
    expect(toCents(0.1 + 0.2)).toBe(30);
    expect(toCents(100)).toBe(10000);
  });

  it('takes 10% for the platform and pays the seller 90%', () => {
    expect(platformFeeCents(10000)).toBe(1000);
    expect(sellerPayoutCents(10000)).toBe(9000);
  });

  it('rounds the platform fee down, and fee + payout always equals the payment', () => {
    for (const cents of [1, 9, 99, 1999, 123457, 99999]) {
      expect(platformFeeCents(cents) + sellerPayoutCents(cents)).toBe(cents);
      expect(platformFeeCents(cents)).toBe(Math.floor(cents * 0.1));
    }
    expect(platformFeeCents(1999)).toBe(199);
    expect(sellerPayoutCents(1999)).toBe(1800);
  });
});

describe('cartTotal', () => {
  it('sums price x quantity', () => {
    expect(cartTotal([item('a', 10, 2), item('b', 5.5, 3)])).toBeCloseTo(36.5);
  });
  it('is zero for an empty cart', () => {
    expect(cartTotal([])).toBe(0);
  });
});

describe('couponDiscount', () => {
  it('applies a percentage to the line price', () => {
    expect(couponDiscount(200, 'percentage', 15)).toBe(30);
  });
  it('applies a flat amount', () => {
    expect(couponDiscount(200, 'flat', 25)).toBe(25);
  });
  it('never discounts more than the line costs', () => {
    expect(couponDiscount(20, 'flat', 50)).toBe(20);
    expect(couponDiscount(20, 'percentage', 150)).toBe(20);
  });
  it('gives nothing for an unknown type or a negative value', () => {
    expect(couponDiscount(100, 'bogus', 10)).toBe(0);
    expect(couponDiscount(100, 'flat', -10)).toBe(0);
  });
});

describe('shopOrderTotal (what each shop\'s order is stored with)', () => {
  const items = [item('p1', 50, 2), item('p2', 30, 1)]; // 130

  it('is the plain total without a coupon', () => {
    expect(shopOrderTotal(items)).toBe(130);
    expect(shopOrderTotal(items, null)).toBe(130);
  });

  it('subtracts a percentage discount from the discounted product only', () => {
    expect(shopOrderTotal(items, { discountedProductId: 'p1', discountPercent: 10 })).toBe(120); // 10% of 50*2
  });

  it('subtracts a flat discount', () => {
    expect(shopOrderTotal(items, { discountedProductId: 'p2', discountPercent: 0, discountAmount: 12 })).toBe(118);
  });

  it('accepts a flat amount sent as a string, as verify-coupon returns it', () => {
    expect(shopOrderTotal(items, { discountedProductId: 'p2', discountAmount: '12.50' as any })).toBe(117.5);
  });

  it('ignores a coupon for a product that is in another shop\'s order', () => {
    expect(shopOrderTotal(items, { discountedProductId: 'elsewhere', discountPercent: 50 })).toBe(130);
  });
});

describe('groupByShop', () => {
  it('splits a cart into one list per shop', () => {
    const groups = groupByShop([item('a', 1, 1, 's1'), item('b', 1, 1, 's2'), item('c', 1, 1, 's1')]);
    expect(Object.keys(groups).sort()).toEqual(['s1', 's2']);
    expect(groups.s1.map((i) => i.id)).toEqual(['a', 'c']);
  });
});

describe('cartFingerprint', () => {
  const a = { ...item('a', 10, 1), selectedOptions: { size: 'M' } };
  const b = item('b', 20, 2);

  it('does not depend on item order', () => {
    expect(cartFingerprint([a, b])).toBe(cartFingerprint([b, a]));
  });

  it('works for carts of two or more items (the old .localCompare threw a TypeError here)', () => {
    expect(() => cartFingerprint([a, b, item('c', 1, 1)])).not.toThrow();
  });

  it('differs when a quantity or option changes', () => {
    expect(cartFingerprint([a, b])).not.toBe(cartFingerprint([a, { ...b, quantity: 3 }]));
    expect(cartFingerprint([a, b])).not.toBe(cartFingerprint([{ ...a, selectedOptions: { size: 'L' } }, b]));
  });
});
