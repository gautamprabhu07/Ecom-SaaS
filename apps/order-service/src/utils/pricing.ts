//Path: apps/order-service/src/utils/pricing.ts
//the money rules of checkout, kept free of Stripe/Prisma/Redis so they can be unit tested.

//the platform keeps this share of every payment; the seller receives the rest
export const PLATFORM_FEE_RATE = 0.1;

//Stripe works in whole cents
export const toCents = (amount: number): number => Math.round(amount * 100);

//10% platform fee in cents, rounded down so the platform never takes more than its share
export const platformFeeCents = (customerAmountCents: number): number => Math.floor(customerAmountCents * PLATFORM_FEE_RATE);

//what the seller is paid out of a payment
export const sellerPayoutCents = (customerAmountCents: number): number => customerAmountCents - platformFeeCents(customerAmountCents);

export interface PricedItem {
  id: string;
  sale_price: number;
  quantity: number;
}

export const cartTotal = (items: PricedItem[]): number => items.reduce((sum, item) => sum + item.sale_price * item.quantity, 0);

//the discount a coupon gives on a single line (price * quantity): a percentage or a flat amount, never more than the line costs
export const couponDiscount = (linePrice: number, discountType: string, discountValue: number): number => {
  let discount = 0;
  if (discountType === "percentage") discount = (linePrice * discountValue) / 100;
  else if (discountType === "flat") discount = discountValue;
  return Math.min(Math.max(discount, 0), linePrice);
};

export interface AppliedCoupon {
  discountedProductId?: string;
  discountPercent?: number;
  discountAmount?: number;
}

//the amount one shop's order is stored with: its items' total, less the coupon when the coupon's product is in this order
export const shopOrderTotal = (items: PricedItem[], coupon?: AppliedCoupon | null): number => {
  let total = cartTotal(items);
  if (coupon && coupon.discountedProductId) {
    const discounted = items.find((item) => item.id === coupon.discountedProductId);
    if (discounted) {
      const discount =
        (coupon.discountPercent ?? 0) > 0
          ? (discounted.sale_price * discounted.quantity * (coupon.discountPercent as number)) / 100
          : Number(coupon.discountAmount ?? 0);
      total -= discount;
    }
  }
  return total;
};

//a cart's lines grouped by the shop that sells them (one order is created per shop)
export const groupByShop = <T extends { shopId: string }>(items: T[]): Record<string, T[]> =>
  items.reduce((groups: Record<string, T[]>, item) => {
    (groups[item.shopId] ??= []).push(item);
    return groups;
  }, {});

//order-independent fingerprint of a cart, used to reuse an existing payment session for an identical cart.
//(this used to call `.localCompare`, which does not exist, so any cart with two or more items threw a TypeError)
export const cartFingerprint = (cart: any[]): string =>
  JSON.stringify(
    cart
      .map((item) => ({
        id: item.id,
        quantity: item.quantity,
        sale_price: item.sale_price,
        shopId: item.shopId,
        selectedOptions: item.selectedOptions || {},
      }))
      .sort((a, b) => String(a.id).localeCompare(String(b.id))),
  );
