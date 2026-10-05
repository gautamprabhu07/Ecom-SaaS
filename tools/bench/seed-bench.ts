//Path: tools/bench/seed-bench.ts
//fills the throwaway "bench" database with enough synthetic rows that an index matters. Deterministic (seeded RNG).
//  npx tsx tools/bench/seed-bench.ts          -> seed (run `drop` then `prisma db push` first; see docs/performance.md)
//  npx tsx tools/bench/seed-bench.ts drop     -> delete the bench database
import { useBenchDatabase } from "./bench-db";

useBenchDatabase();

const SIZE = { shops: 300, users: 5000, products: 30000, orders: 60000, itemsPerOrder: 2, images: 60000, followers: 30000, conversations: 500, messages: 100000 };
const CATEGORIES = ["Electronics", "Fashion", "Home & Living", "Beauty", "Sports", "Books", "Toys", "Grocery", "Automotive", "Health"];

let state = 123456789;
const rand = () => ((state = (state * 1664525 + 1013904223) >>> 0) / 4294967296);
const pick = <T,>(xs: T[]) => xs[Math.floor(rand() * xs.length)];
const int = (n: number) => Math.floor(rand() * n);

let counter = 0;
//a valid 24-hex ObjectId; unique per call
const oid = () => (0x65000000 + counter++).toString(16).padStart(8, "0") + Math.floor(rand() * 0xffffffffff).toString(16).padStart(10, "0") + (counter & 0xffffff).toString(16).padStart(6, "0");

const WORDS = "lightweight durable premium compact wireless ergonomic classic modern portable smart eco comfortable stylish waterproof foldable adjustable".split(" ");
const sentence = (n: number) => Array.from({ length: n }, () => pick(WORDS)).join(" ");

const chunked = async <T,>(rows: T[], size: number, write: (chunk: T[]) => Promise<unknown>) => {
  for (let i = 0; i < rows.length; i += size) await write(rows.slice(i, i + size));
};

(async () => {
  const { default: prisma } = await import("../../packages/libs/prisma");
  if (process.argv[2] === "drop") {
    await prisma.$runCommandRaw({ dropDatabase: 1 });
    console.log("bench database dropped");
    await prisma.$disconnect();
    return;
  }

  //expects an empty bench database that `prisma db push` has already created the collections and unique indexes in
  console.log("seeding...");

  const shopIds = Array.from({ length: SIZE.shops }, oid);
  const userIds = Array.from({ length: SIZE.users }, oid);
  const now = Date.now();
  const yearMs = 365 * 24 * 3600 * 1000;

  const products = Array.from({ length: SIZE.products }, (_, i) => ({
    id: oid(),
    title: `${sentence(3)} ${i}`,
    slug: `product-${i}-${int(1e9)}`,
    category: pick(CATEGORIES),
    subCategory: "General",
    short_description: sentence(12),
    detailed_description: sentence(60),
    customProperties: {},
    stock: int(100),
    sale_price: 5 + int(500),
    regular_price: 10 + int(600),
    totalSales: int(2000),
    isDeleted: rand() < 0.03,
    sellerId: oid(),
    shopId: pick(shopIds),
    createdAt: new Date(now - int(yearMs)),
  }));
  await chunked(products, 2000, (data) => prisma.products.createMany({ data }));
  console.log("products", products.length);

  const orders = Array.from({ length: SIZE.orders }, () => ({
    id: oid(),
    shopId: pick(shopIds),
    userId: pick(userIds),
    total: 10 + int(500),
    status: rand() < 0.9 ? "Paid" : "Pending",
    createdAt: new Date(now - int(yearMs)),
  }));
  await chunked(orders, 2000, (data) => prisma.orders.createMany({ data }));
  console.log("orders", orders.length);

  const items = orders.flatMap((o) =>
    Array.from({ length: SIZE.itemsPerOrder }, () => ({ orderId: o.id, productId: pick(products).id, quantity: 1 + int(3), price: 10 + int(200) })),
  );
  await chunked(items, 2000, (data) => prisma.orderItems.createMany({ data }));
  console.log("orderItems", items.length);

  const images = Array.from({ length: SIZE.images }, (_, i) => ({ file_id: `f${i}`, url: `https://example.com/${i}.jpg`, productsId: products[i % products.length].id }));
  await chunked(images, 2000, (data) => prisma.images.createMany({ data }));
  console.log("images", images.length);

  const seen = new Set<string>();
  const followers: { userId: string; shopsId: string }[] = [];
  while (followers.length < SIZE.followers) {
    const userId = pick(userIds);
    const shopsId = pick(shopIds);
    if (!seen.has(userId + shopsId)) {
      seen.add(userId + shopsId);
      followers.push({ userId, shopsId });
    }
  }
  await chunked(followers, 2000, (data) => prisma.followers.createMany({ data }));
  console.log("followers", followers.length);

  const conversations = Array.from({ length: SIZE.conversations }, oid);
  const messages = Array.from({ length: SIZE.messages }, (_, i) => ({
    conversationId: pick(conversations),
    senderId: pick(userIds),
    senderType: "user",
    content: `message ${i} ${sentence(6)}`,
    createdAt: new Date(now - int(yearMs)),
  }));
  await chunked(messages, 2000, (data) => prisma.message.createMany({ data }));
  console.log("messages", messages.length);

  await chunked(userIds.map((userId) => ({ userId })), 2000, (data) => prisma.userAnalytics.createMany({ data }));
  await chunked(products.map((p) => ({ productId: p.id, shopId: p.shopId, views: int(500) })), 2000, (data) => prisma.productAnalytics.createMany({ data }));
  console.log("analytics rows done");

  //remember the ids the benchmark will look up
  const fs = await import("fs");
  fs.writeFileSync(
    "tools/bench/fixtures.json",
    JSON.stringify({ shopId: shopIds[7], userId: userIds[11], conversationId: conversations[3], productId: products[100].id, slug: products[100].slug, orderId: orders[5].id }),
  );
  await prisma.$disconnect();
  console.log("done");
})();
