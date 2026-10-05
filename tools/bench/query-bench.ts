//Path: tools/bench/query-bench.ts
//times the project's hottest queries (each 30 times) against the throwaway "bench" database and prints a markdown table.
//  npx tsx tools/bench/query-bench.ts before    -> also saves tools/bench/results-before.json
//  npx tsx tools/bench/query-bench.ts after     -> saves results-after.json
//The first run of each query is a warm-up and is not counted. Queries mirror the real controllers (cited per row).
import { useBenchDatabase } from "./bench-db";
import fs from "fs";

useBenchDatabase();

const RUNS = 30;
const label = process.argv[2] ?? "run";
const fx = JSON.parse(fs.readFileSync("tools/bench/fixtures.json", "utf-8"));

const percentile = (sorted: number[], p: number) => sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)];

(async () => {
  const { default: prisma } = await import("../../packages/libs/prisma");

  const paidFrom = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
  const noStart = { OR: [{ starting_date: { equals: null } }, { starting_date: { isSet: false } }] };

  const queries: { name: string; source: string; run: () => Promise<unknown> }[] = [
    {
      name: "Product listing: category + price range, paginated",
      source: "getFilteredProducts",
      run: () => prisma.products.findMany({ where: { AND: [{ sale_price: { gte: 50, lte: 300 } }, noStart, { category: { in: ["Electronics", "Fashion"] } }] }, skip: 20, take: 20, include: { images: true } }),
    },
    {
      name: "Home listing: latest products, paginated",
      source: "getAllProducts",
      run: () => prisma.products.findMany({ where: noStart, orderBy: { createdAt: "desc" }, take: 20, include: { images: true } }),
    },
    { name: "Product by slug", source: "getProductDetails", run: () => prisma.products.findUnique({ where: { slug: fx.slug } }) },
    { name: "Products by shopId", source: "getShopProducts / getShopDetails", run: () => prisma.products.findMany({ where: { shopId: fx.shopId, isDeleted: false }, include: { images: true } }) },
    {
      name: "Keyword search (title / short_description contains)",
      source: "searchProducts",
      run: () => prisma.products.findMany({ where: { OR: [{ title: { contains: "wireless", mode: "insensitive" } }, { short_description: { contains: "wireless", mode: "insensitive" } }] }, select: { id: true, title: true, slug: true }, take: 10, orderBy: { createdAt: "desc" } }),
    },
    { name: "Top shops: Paid orders grouped by shop, sum of total", source: "topShops", run: () => prisma.orders.groupBy({ by: ["shopId"], where: { status: "Paid" }, _sum: { total: true }, orderBy: { _sum: { total: "desc" } }, take: 10 }) },
    { name: "Orders by shopId, newest first", source: "getSellerOrders", run: () => prisma.orders.findMany({ where: { shopId: fx.shopId }, orderBy: { createdAt: "desc" } }) },
    { name: "Orders by userId, newest first (with items)", source: "getUserOrders", run: () => prisma.orders.findMany({ where: { userId: fx.userId }, include: { items: true }, orderBy: { createdAt: "desc" } }) },
    { name: "Seller revenue: Paid orders in last 30 days", source: "analytics paidTotals", run: () => prisma.$runCommandRaw({ aggregate: "orders", pipeline: [{ $match: { status: "Paid", shopId: { $oid: fx.shopId }, createdAt: { $gte: { $date: paidFrom } } } }, { $group: { _id: null, revenue: { $sum: "$total" } } }], cursor: {} }) },
    { name: "Order items by orderId", source: "orders include items", run: () => prisma.orderItems.findMany({ where: { orderId: fx.orderId } }) },
    { name: "Product images by productsId", source: "every product include", run: () => prisma.images.findMany({ where: { productsId: fx.productId } }) },
    { name: "Followers of a shop (count)", source: "getShopDetails / topShops", run: () => prisma.followers.count({ where: { shopsId: fx.shopId } }) },
    { name: "userAnalytics by userId", source: "recommendation / track-user", run: () => prisma.userAnalytics.findUnique({ where: { userId: fx.userId } }) },
    { name: "productAnalytics by productId", source: "kafka-service consumer", run: () => prisma.productAnalytics.findUnique({ where: { productId: fx.productId } }) },
    { name: "Messages by conversationId, newest 20", source: "chatting getMessages", run: () => prisma.message.findMany({ where: { conversationId: fx.conversationId }, orderBy: { createdAt: "desc" }, take: 20 }) },
  ];

  const results: { name: string; source: string; p50: number; p95: number; mean: number }[] = [];
  for (const q of queries) {
    await q.run(); //warm-up: connection + query plan
    const times: number[] = [];
    for (let i = 0; i < RUNS; i++) {
      const start = process.hrtime.bigint();
      await q.run();
      times.push(Number(process.hrtime.bigint() - start) / 1e6);
    }
    times.sort((a, b) => a - b);
    const mean = times.reduce((a, b) => a + b, 0) / times.length;
    results.push({ name: q.name, source: q.source, p50: percentile(times, 50), p95: percentile(times, 95), mean });
    console.error(`  ${q.name}: p50 ${percentile(times, 50).toFixed(1)}ms`);
  }

  fs.writeFileSync(`tools/bench/results-${label}.json`, JSON.stringify(results, null, 2));
  console.log(`\n| Query | p50 (ms) | p95 (ms) | mean (ms) |\n|---|---:|---:|---:|`);
  for (const r of results) console.log(`| ${r.name} | ${r.p50.toFixed(1)} | ${r.p95.toFixed(1)} | ${r.mean.toFixed(1)} |`);
  await prisma.$disconnect();
})();
