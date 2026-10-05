//Path: packages/libs/analytics/queries.ts
//the dashboard queries, shared by admin-service (whole platform) and seller-service (one shop).
//
//SCOPE IS A SECURITY BOUNDARY. Every function takes a `scope`: with `shopId` set, it can only ever read that shop's
//rows; with it empty, it reads the whole platform. Only admin-service may pass an empty scope. seller-service always
//builds the scope from the authenticated seller's own shop and never from anything the client sends.
import prisma from "../prisma";
import {
  DailyRevenueRow,
  RangeDays,
  bucketUnitFor,
  buildRevenueSeries,
  mergeCounts,
  percentChange,
  rankCounts,
  rate,
  startOfUtcDay,
  summarizeDevices,
  toNumber,
} from "./transform";

export interface Scope {
  //restrict every query to this shop; leave undefined for platform-wide numbers (admin only)
  shopId?: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

//first instant of the window: `days` UTC days ending today, so a 30-day range is today plus the 29 days before it
const windowStart = (days: number, now: number) => startOfUtcDay(now) - (days - 1) * DAY_MS;

const ordersMatch = (scope: Scope) => (scope.shopId ? { shopId: { $oid: scope.shopId } } : {});
const prismaShopFilter = (scope: Scope) => (scope.shopId ? { shopId: scope.shopId } : {});

//only paid orders are revenue: pending and failed payments must never inflate the numbers
const paidTotals = async (scope: Scope, from: Date, to?: Date) => {
  const result: any = await prisma.$runCommandRaw({
    aggregate: "orders",
    pipeline: [
      { $match: { status: "Paid", createdAt: { $gte: { $date: from.toISOString() }, ...(to ? { $lt: { $date: to.toISOString() } } : {}) }, ...ordersMatch(scope) } },
      { $group: { _id: null, revenue: { $sum: "$total" }, orders: { $sum: 1 } } },
    ],
    cursor: {},
  });
  //a single $group with _id: null always yields one row, so the default batch size is fine here
  const row = result.cursor.firstBatch[0];
  return { revenue: row ? toNumber(row.revenue) : 0, orders: row ? toNumber(row.orders) : 0 };
};

// ------------------------------------------------------------------------------------------ revenue over time
export async function getRevenueSeries(scope: Scope, days: RangeDays, now: number = Date.now()) {
  const since = new Date(windowStart(days, now));
  //the database does the grouping (one row per day); Node only fills gaps and rolls days up into weeks or months
  const result: any = await prisma.$runCommandRaw({
    aggregate: "orders",
    pipeline: [
      { $match: { status: "Paid", createdAt: { $gte: { $date: since.toISOString() } }, ...ordersMatch(scope) } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, revenue: { $sum: "$total" }, orders: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ],
    //an aggregation returns only its first 101 rows unless told otherwise. A 180-day range has up to 180 daily groups,
    //so without this the most recent ~80 days silently went missing from the chart and the totals.
    cursor: { batchSize: 1000 },
  });
  const rows: DailyRevenueRow[] = result.cursor.firstBatch.map((r: any) => ({ day: r._id, revenue: toNumber(r.revenue), orders: toNumber(r.orders) }));
  const points = buildRevenueSeries(rows, days, now);
  return {
    days,
    unit: bucketUnitFor(days),
    points,
    totalRevenue: Math.round(points.reduce((sum, p) => sum + p.revenue, 0) * 100) / 100,
    totalOrders: points.reduce((sum, p) => sum + p.orders, 0),
  };
}

// ------------------------------------------------------------------------------------------ devices
export async function getDeviceBreakdown(scope: Scope) {
  const rows = await prisma.shopAnalytics.findMany({ where: prismaShopFilter(scope), select: { deviceStats: true } });
  return summarizeDevices(mergeCounts(rows.map((r) => r.deviceStats as Record<string, unknown> | null)));
}

// ------------------------------------------------------------------------------------------ geography
export async function getGeography(scope: Scope) {
  const rows = await prisma.shopAnalytics.findMany({ where: prismaShopFilter(scope), select: { countryStats: true, cityStats: true } });
  const countries = mergeCounts(rows.map((r) => r.countryStats as Record<string, unknown> | null));
  const cities = mergeCounts(rows.map((r) => r.cityStats as Record<string, unknown> | null));
  return {
    totalVisits: Object.values(countries).reduce((a, b) => a + b, 0),
    countries: rankCounts(countries),
    cities: rankCounts(cities, 10),
  };
}

// ------------------------------------------------------------------------------------------ headline numbers
//each figure is compared with the equally long period immediately before it
export async function getSummary(scope: Scope, days: RangeDays, now: number = Date.now()) {
  const since = new Date(windowStart(days, now));
  const previousSince = new Date(since.getTime() - days * DAY_MS);

  const [current, previous, visitors, previousVisitors, devices] = await Promise.all([
    paidTotals(scope, since),
    paidTotals(scope, previousSince, since),
    prisma.uniqueShopVisitors.count({ where: { ...prismaShopFilter(scope), visitedAt: { gte: since } } }),
    prisma.uniqueShopVisitors.count({ where: { ...prismaShopFilter(scope), visitedAt: { gte: previousSince, lt: since } } }),
    getDeviceBreakdown(scope),
  ]);

  const mobile = devices.slices.find((s) => s.name === "Mobile")?.share ?? 0;
  return {
    days,
    revenue: { value: Math.round(current.revenue * 100) / 100, previous: Math.round(previous.revenue * 100) / 100, change: percentChange(current.revenue, previous.revenue) },
    orders: { value: current.orders, previous: previous.orders, change: percentChange(current.orders, previous.orders) },
    //first-time visitors in the period (a buyer counts once per shop, on their first visit)
    visitors: { value: visitors, previous: previousVisitors, change: percentChange(visitors, previousVisitors) },
    //all-time: device mix isn't recorded per day, so there is no previous period to compare with
    mobileShare: { value: devices.total > 0 ? mobile : null },
  };
}

// ------------------------------------------------------------------------------------------ conversion funnel
//all-time totals from the event counters kept by kafka-service
export async function getFunnel(scope: Scope) {
  const { _sum } = await prisma.productAnalytics.aggregate({
    where: prismaShopFilter(scope),
    _sum: { views: true, cartAdds: true, wishlistAdds: true, purchases: true },
  });
  const views = _sum.views ?? 0;
  const cartAdds = _sum.cartAdds ?? 0;
  const wishlistAdds = _sum.wishlistAdds ?? 0;
  const purchases = _sum.purchases ?? 0;
  return {
    views,
    cartAdds,
    wishlistAdds,
    purchases,
    conversion: {
      viewToCart: rate(cartAdds, views),
      cartToPurchase: rate(purchases, cartAdds),
      viewToPurchase: rate(purchases, views),
    },
  };
}

// ------------------------------------------------------------------------------------------ top products
export async function getTopProducts(scope: Scope, limit: number) {
  const rows = await prisma.productAnalytics.findMany({
    where: prismaShopFilter(scope),
    orderBy: [{ purchases: "desc" }, { views: "desc" }],
    take: limit,
  });
  const products = await prisma.products.findMany({
    where: { id: { in: rows.map((r) => r.productId) } },
    select: { id: true, title: true, category: true, sale_price: true, images: { take: 1, select: { url: true } } },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  return rows
    .filter((r) => byId.has(r.productId)) //an analytics row can outlive a deleted product
    .map((r) => {
      const product = byId.get(r.productId)!;
      return {
        productId: r.productId,
        title: product.title,
        category: product.category,
        price: product.sale_price,
        image: product.images[0]?.url ?? null,
        purchases: r.purchases,
        views: r.views,
        cartAdds: r.cartAdds,
        revenue: Math.round(r.purchases * product.sale_price * 100) / 100,
      };
    });
}

// ------------------------------------------------------------------------------------------ recent orders
export async function getRecentOrders(scope: Scope, limit: number) {
  const orders = await prisma.orders.findMany({
    where: prismaShopFilter(scope),
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, total: true, status: true, deliveryStatus: true, createdAt: true, shopId: true, user: { select: { name: true } } },
  });

  //platform-wide view: show which shop each order belongs to
  const shopNames = new Map<string, string>();
  if (!scope.shopId) {
    const ids = [...new Set(orders.map((o) => o.shopId).filter((id): id is string => Boolean(id)))];
    const shops = await prisma.shops.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } });
    for (const shop of shops) shopNames.set(shop.id, shop.name);
  }

  return orders.map((o) => ({
    id: o.id,
    reference: o.id.slice(-6).toUpperCase(),
    customer: o.user?.name ?? "Guest",
    amount: o.total,
    paymentStatus: o.status,
    deliveryStatus: o.deliveryStatus,
    //a paid order shows how far delivery has got; an unpaid one shows its payment state
    status: o.status === "Paid" ? o.deliveryStatus : o.status,
    shop: o.shopId ? (shopNames.get(o.shopId) ?? null) : null,
    createdAt: o.createdAt.toISOString(),
  }));
}
