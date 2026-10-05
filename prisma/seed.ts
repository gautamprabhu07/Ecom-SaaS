//Path: prisma/seed.ts
//Seeds a realistic marketplace: 10 shops, 200 products, 50 buyers, 400 orders over 6 months, reviews,
//followers and the interaction history the recommender and the dashboards need.
//
//usage: npm run seed      (safe to re-run: the result is the same every time)
//
//What it WIPES: every product, shop, order, review, follower and analytics row, plus the users/sellers it created
//itself (emails ending in @seed.outsource.dev). What it KEEPS: all other users and sellers (your real logins, the
//admin). Existing real sellers each get one of the new shops so their dashboards are populated too.
import "dotenv/config";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { CATEGORIES, CATEGORY_TREE } from "../packages/types/categories";
import { IMAGE_POOLS, unsplash } from "./seed-data/images";
import { PRODUCT_TEMPLATES, ProductTemplate } from "./seed-data/catalog";

const prisma = new PrismaClient();

const SEED_DOMAIN = "@seed.outsource.dev";
const PASSWORD = "Password123!";
const NOW = Date.now();
const DAY = 24 * 60 * 60 * 1000;

const N_BUYERS = 50;
const N_ORDERS = 400;
const N_REVIEWS_PER_SHOP = 12;
const N_REVIEWS_TOTAL = 150;
const N_EVENTS = 16;
const N_OUT_OF_STOCK = 5;

// ---------------------------------------------------------------------------------------------- random helpers
//mulberry32: a tiny seeded generator, so every run produces the same dataset
let state = 20260705;
const rand = () => {
  state |= 0;
  state = (state + 0x6d2b79f5) | 0;
  let t = Math.imul(state ^ (state >>> 15), 1 | state);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const randInt = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;
const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
const shuffle = <T>(arr: T[]): T[] => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};
const sample = <T>(arr: T[], n: number): T[] => shuffle(arr).slice(0, n);
const weighted = <T>(entries: [T, number][]): T => {
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = rand() * total;
  for (const [value, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return value;
  }
  return entries[entries.length - 1][0];
};
const oid = () => crypto.randomBytes(12).toString("hex");
const round2 = (n: number) => Math.round(n * 100) / 100;
const daysAgo = (d: number) => new Date(NOW - d * DAY);
const slugify = (s: string) =>
  s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const rotate = <T>(arr: T[], by: number): T[] => (arr.length ? [...arr.slice(by % arr.length), ...arr.slice(0, by % arr.length)] : arr);

async function insertMany(delegate: any, rows: any[], size = 400) {
  for (let i = 0; i < rows.length; i += size) {
    await delegate.createMany({ data: rows.slice(i, i + size) });
  }
}

// ---------------------------------------------------------------------------------------------- reference data
type ShopTemplate = {
  category: string;
  name: string;
  bio: string;
  address: string;
  hours: string;
  handle: string;
  coverSubject: string;
  avatarSubject: string;
  base: number; //base rating before reviews
};

const SHOP_TEMPLATES: ShopTemplate[] = [
  { category: "Electronics", name: "Volt & Wire Electronics", bio: "Phones, laptops and audio gear from trusted brands, with fast dispatch and a one-year warranty on everything.", address: "Koramangala, Bengaluru, India", hours: "Mon - Sat (10am-8pm)", handle: "voltandwire", coverSubject: "laptop", avatarSubject: "headphones", base: 4.6 },
  { category: "Fashion", name: "Thread & Thimble", bio: "Everyday clothing, shoes and accessories with an honest fit guide and easy 30-day returns.", address: "Linking Road, Mumbai, India", hours: "Mon - Sun (11am-9pm)", handle: "threadandthimble", coverSubject: "wardrobe", avatarSubject: "handbag", base: 4.4 },
  { category: "Home & Garden", name: "Hearth & Hedge", bio: "Furniture, kitchenware and garden essentials for homes that are actually lived in.", address: "Indiranagar, Bengaluru, India", hours: "Tue - Sun (10am-7pm)", handle: "hearthandhedge", coverSubject: "livingroom", avatarSubject: "planter", base: 4.5 },
  { category: "Health & Beauty", name: "Dewdrop Botanicals", bio: "Gentle skincare, makeup and wellness products, cruelty free and tested on sensitive skin.", address: "Banjara Hills, Hyderabad, India", hours: "Mon - Sat (10am-8pm)", handle: "dewdropbotanicals", coverSubject: "skincare", avatarSubject: "serum", base: 4.7 },
  { category: "Sports & Outdoors", name: "Summit Gear Co.", bio: "Home-gym equipment, camping gear and cycling kit chosen by people who actually use it.", address: "Koregaon Park, Pune, India", hours: "Mon - Sat (9am-7pm)", handle: "summitgearco", coverSubject: "hiking", avatarSubject: "bicycle", base: 4.3 },
  { category: "Toys & Games", name: "Little Quest Toys", bio: "Board games, puzzles and wooden toys for family game nights and curious kids.", address: "Anna Nagar, Chennai, India", hours: "Mon - Sun (10am-8pm)", handle: "littlequesttoys", coverSubject: "bricks", avatarSubject: "chess", base: 4.8 },
  { category: "Groceries", name: "Fresh Basket Pantry", bio: "Small-batch pantry staples, coffee, tea and organic produce delivered fresh.", address: "Salt Lake, Kolkata, India", hours: "Mon - Sun (8am-9pm)", handle: "freshbasketpantry", coverSubject: "fruitbasket", avatarSubject: "honey", base: 4.5 },
  { category: "Books & Stationery", name: "Paper Trail Books", bio: "Novels, non-fiction and thoughtful stationery for readers, students and note-takers.", address: "Tiger Circle, Manipal, India", hours: "Mon - Sat (9am-6pm)", handle: "papertrailbooks", coverSubject: "library", avatarSubject: "pen", base: 4.6 },
  { category: "Pet Supplies", name: "Paws & Whiskers", bio: "Food, beds, toys and grooming essentials for dogs and cats, from people who love both.", address: "Jubilee Hills, Hyderabad, India", hours: "Mon - Sun (9am-8pm)", handle: "pawsandwhiskers", coverSubject: "dogsrun", avatarSubject: "cat", base: 4.7 },
  { category: "Gaming", name: "Pixel Forge Games", bio: "Consoles, controllers, games and PC gear, with genuine stock and quick shipping.", address: "Whitefield, Bengaluru, India", hours: "Mon - Sat (11am-9pm)", handle: "pixelforgegames", coverSubject: "setup", avatarSubject: "controller", base: 4.4 },
];

//real sellers get these shops first, in this order
const REAL_SELLER_CATEGORIES = ["Books & Stationery", "Fashion", "Electronics"];

const NEW_SELLERS: { name: string; country: string; phone: string }[] = [
  { name: "Anika Rao", country: "India", phone: "+91 98450 11201" },
  { name: "Marcus Webb", country: "United Kingdom", phone: "+44 7700 900145" },
  { name: "Priya Nair", country: "India", phone: "+91 98860 33410" },
  { name: "Tomas Herrera", country: "Spain", phone: "+34 612 345 678" },
  { name: "Sofia Lindqvist", country: "Sweden", phone: "+46 70 123 4567" },
  { name: "Daniel Okafor", country: "Nigeria", phone: "+234 802 345 6789" },
  { name: "Mei Tanaka", country: "Japan", phone: "+81 90 1234 5678" },
];

const FIRST_NAMES = ["Aarav", "Diya", "Rohan", "Isha", "Kabir", "Meera", "Arjun", "Sana", "Vikram", "Naina", "Liam", "Olivia", "Noah", "Emma", "Ethan", "Ava", "Lucas", "Mia", "Oliver", "Chloe", "Hans", "Lena", "Omar", "Layla", "Ryo"];
const LAST_NAMES = ["Sharma", "Iyer", "Menon", "Kapoor", "Reddy", "Das", "Patel", "Khan", "Mehta", "Joshi", "Smith", "Johnson", "Brown", "Taylor", "Wilson", "Clarke", "Muller", "Schmidt", "Hassan", "Sato"];

const LOCATIONS: { country: string; cities: string[]; weight: number; zip: () => string; streets: string[] }[] = [
  { country: "India", cities: ["Bengaluru", "Mumbai", "Delhi", "Hyderabad", "Chennai", "Pune", "Kolkata", "Manipal"], weight: 52, zip: () => String(randInt(560001, 600099)), streets: ["MG Road", "Park Street", "Residency Road", "Brigade Road", "Linking Road"] },
  { country: "United States", cities: ["New York", "San Francisco", "Austin", "Chicago"], weight: 14, zip: () => String(randInt(10001, 94105)), streets: ["Maple Avenue", "Oak Street", "Lakeview Drive", "Market Street"] },
  { country: "United Kingdom", cities: ["London", "Manchester"], weight: 8, zip: () => `M${randInt(1, 9)} ${randInt(1, 9)}AB`, streets: ["High Street", "Station Road", "Church Lane"] },
  { country: "Germany", cities: ["Berlin", "Munich"], weight: 5, zip: () => String(randInt(10115, 80999)), streets: ["Hauptstrasse", "Bahnhofstrasse"] },
  { country: "Canada", cities: ["Toronto", "Vancouver"], weight: 5, zip: () => `M5V ${randInt(1, 9)}K${randInt(1, 9)}`, streets: ["King Street", "Queen Street"] },
  { country: "Australia", cities: ["Sydney", "Melbourne"], weight: 4, zip: () => String(randInt(2000, 3999)), streets: ["George Street", "Collins Street"] },
  { country: "United Arab Emirates", cities: ["Dubai"], weight: 4, zip: () => "00000", streets: ["Sheikh Zayed Road"] },
  { country: "Singapore", cities: ["Singapore"], weight: 4, zip: () => String(randInt(100000, 199999)), streets: ["Orchard Road"] },
  { country: "Netherlands", cities: ["Amsterdam"], weight: 4, zip: () => `${randInt(1000, 1099)} AB`, streets: ["Prinsengracht"] },
];

const DEVICES: [string, number][] = [
  ["Chrome on Windows (desktop)", 28],
  ["Safari on iOS (mobile)", 20],
  ["Chrome on Android (mobile)", 24],
  ["Safari on macOS (desktop)", 10],
  ["Firefox on Windows (desktop)", 8],
  ["Edge on Windows (desktop)", 6],
  ["Chrome on macOS (desktop)", 4],
];

const REVIEW_TEXT: Record<number, string[]> = {
  5: [
    "Fast dispatch and careful packaging. Everything matched the photos exactly.",
    "Great communication from the seller, and my order arrived two days early.",
    "Quality is far better than I expected for the price. I will order again.",
    "Smooth experience from start to finish. Highly recommend this shop.",
    "Items were exactly as described and beautifully packed.",
    "The seller answered my question within the hour and shipped the same day.",
    "Excellent value and genuinely helpful customer service.",
    "My second order from this shop and again no issues at all.",
  ],
  4: [
    "Good quality and fair prices. Delivery took a day longer than promised.",
    "Happy with my purchase; the packaging could be a little better.",
    "Solid products and a helpful seller. Would buy again.",
    "Nice range and good value, though one item was slightly different in colour.",
    "Arrived well packed and works as described. A little slow to ship.",
  ],
  3: [
    "Products are decent but delivery was slower than I hoped.",
    "Average experience: the item is fine, packaging was basic.",
    "Okay overall. The seller fixed a small issue, but it took a few days.",
    "Fair value for money, though not quite as pictured.",
  ],
};

const REVIEW_FLAVOUR: Record<string, string> = {
  "Electronics": "The device was well protected and powered up first time.",
  "Fashion": "The fit was true to size.",
  "Home & Garden": "The assembly instructions were clear.",
  "Health & Beauty": "My skin felt great after a week.",
  "Sports & Outdoors": "It has held up well through hard workouts.",
  "Toys & Games": "The kids have barely put it down.",
  "Groceries": "Everything arrived fresh.",
  "Books & Stationery": "The books arrived in perfect condition.",
  "Pet Supplies": "My pet loves it.",
  "Gaming": "It worked perfectly out of the box.",
};

const WARRANTY: Record<string, string> = {
  "Electronics": "1 year",
  "Fashion": "30 days",
  "Home & Garden": "1 year",
  "Health & Beauty": "No warranty",
  "Sports & Outdoors": "1 year",
  "Toys & Games": "6 months",
  "Groceries": "No warranty",
  "Books & Stationery": "No warranty",
  "Pet Supplies": "30 days",
  "Gaming": "1 year",
};

const COLOR_PALETTE = ["#111827", "#9CA3AF", "#1E3A8A", "#F5F5F4", "#7F1D1D", "#065F46"];
const CLOTHING_SIZES = ["S", "M", "L", "XL"];
const SHOE_SIZES = ["7", "8", "9", "10", "11"];

//which products offer colour / size choices
const optionsFor = (t: ProductTemplate): { colors: string[]; sizes: string[] } => {
  const colors = () => sample(COLOR_PALETTE, randInt(2, 3));
  if (t.category === "Fashion") {
    if (t.subCategory === "Footwear") return { colors: colors(), sizes: SHOE_SIZES };
    if (t.subCategory === "Bags & Accessories") return { colors: colors(), sizes: [] };
    return { colors: colors(), sizes: t.title.includes("Poncho") ? ["S", "M", "L"] : CLOTHING_SIZES };
  }
  if (t.category === "Electronics" && ["phone", "tablet", "headphones", "earbuds", "smartwatch", "laptop"].includes(t.subject)) {
    return { colors: colors(), sizes: [] };
  }
  if (t.category === "Sports & Outdoors" && ["runningshoes", "sprint"].includes(t.subject)) return { colors: colors(), sizes: SHOE_SIZES };
  if (t.category === "Sports & Outdoors" && /Jersey|Shorts|Jacket/.test(t.title)) return { colors: colors(), sizes: CLOTHING_SIZES };
  if (t.category === "Pet Supplies" && ["dogsweater", "doghoodie"].includes(t.subject)) return { colors: [], sizes: ["XS", "S", "M", "L", "XL"] };
  return { colors: [], sizes: [] };
};

// ---------------------------------------------------------------------------------------------- types
type SeedProduct = {
  id: string;
  shopId: string;
  sellerId: string;
  template: ProductTemplate;
  title: string;
  slug: string;
  sale: number;
  regular: number;
  colors: string[];
  sizes: string[];
  createdAt: Date;
  isEvent: boolean;
  startingDate: Date | null;
  endingDate: Date | null;
  sold: number;
  stock: number;
  rating: number;
  imageIds: string[];
};
type SeedUser = {
  id: string;
  name: string;
  email: string;
  addressId: string;
  country: string;
  city: string;
  device: string;
  affinity: string[];
  favourites: string[]; //product ids in the sub-categories this buyer keeps coming back to
};
type SeedOrder = {
  id: string;
  userId: string;
  shopId: string;
  createdAt: Date;
  updatedAt: Date;
  status: string;
  deliveryStatus: string;
  total: number;
  items: { id: string; productId: string; quantity: number; price: number; selectedOptions: any }[];
};
type ActionEvent = { productId: string; shopId: string; action: string; timestamp: string };

const counts = (): Record<string, number> => ({});

async function main() {
  const started = Date.now();

  // ------------------------------------------------------------------------------------------ 0. sanity-check the catalog
  const perCategory: Record<string, number> = {};
  for (const t of PRODUCT_TEMPLATES) {
    perCategory[t.category] = (perCategory[t.category] || 0) + 1;
    if (!CATEGORY_TREE[t.category]?.includes(t.subCategory)) throw new Error(`bad subCategory: ${t.category} > ${t.subCategory} (${t.title})`);
    if (!IMAGE_POOLS[t.category]?.[t.subject]) throw new Error(`no images for subject "${t.subject}" in ${t.category} (${t.title})`);
  }
  for (const category of CATEGORIES) if (perCategory[category] !== 20) throw new Error(`${category} has ${perCategory[category]} templates, expected 20`);

  // ------------------------------------------------------------------------------------------ 1. wipe
  console.log("Wiping catalog data and previously seeded accounts...");
  await prisma.orderItems.deleteMany();
  await prisma.orders.deleteMany();
  await prisma.shopReviews.deleteMany();
  await prisma.followers.deleteMany();
  await prisma.productAnalytics.deleteMany();
  await prisma.shopAnalytics.deleteMany();
  await prisma.uniqueShopVisitors.deleteMany();
  await prisma.userAnalytics.deleteMany();
  //images that belong to a user (avatars) are kept; product and shop images go
  await prisma.images.deleteMany({ where: { OR: [{ userId: null }, { userId: { isSet: false } }] } });
  await prisma.products.deleteMany();
  //raw delete: reading shops through Prisma throws when a shop's sellerId doesn't resolve
  await prisma.$runCommandRaw({ delete: "shops", deletes: [{ q: {}, limit: 0 }] });

  const oldSeedUsers = await prisma.users.findMany({ where: { email: { endsWith: SEED_DOMAIN } }, select: { id: true } });
  if (oldSeedUsers.length) {
    const ids = oldSeedUsers.map((u) => u.id);
    await prisma.address.deleteMany({ where: { userId: { in: ids } } });
    await prisma.images.deleteMany({ where: { userId: { in: ids } } });
    await prisma.users.deleteMany({ where: { id: { in: ids } } });
  }
  await prisma.sellers.deleteMany({ where: { email: { endsWith: SEED_DOMAIN } } });

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  // ------------------------------------------------------------------------------------------ 2. sellers + shops
  const realSellers = await prisma.sellers.findMany({ orderBy: { createdAt: "asc" } });
  const sellerByCategory: Record<string, { id: string; name: string; email: string; seeded: boolean }> = {};
  const unassigned = [...SHOP_TEMPLATES];

  realSellers.forEach((seller, i) => {
    const category = REAL_SELLER_CATEGORIES[i] ?? unassigned[0]?.category;
    if (!category) return;
    const idx = unassigned.findIndex((t) => t.category === category);
    if (idx < 0) return;
    unassigned.splice(idx, 1);
    sellerByCategory[category] = { id: seller.id, name: seller.name, email: seller.email, seeded: false };
  });

  const newSellerRows: any[] = [];
  unassigned.forEach((template, i) => {
    const person = NEW_SELLERS[i % NEW_SELLERS.length];
    const id = oid();
    const email = `${slugify(person.name).replace(/-/g, ".")}${SEED_DOMAIN}`;
    newSellerRows.push({ id, name: person.name, email, phone_number: person.phone, country: person.country, password: passwordHash, createdAt: daysAgo(randInt(200, 230)) });
    sellerByCategory[template.category] = { id, name: person.name, email, seeded: true };
  });
  await insertMany(prisma.sellers, newSellerRows);

  const shopByCategory: Record<string, { id: string; sellerId: string; name: string; template: ShopTemplate }> = {};
  const shopRows: any[] = [];
  const shopImageRows: any[] = [];
  for (const template of SHOP_TEMPLATES) {
    const seller = sellerByCategory[template.category];
    const id = oid();
    const pool = IMAGE_POOLS[template.category];
    shopByCategory[template.category] = { id, sellerId: seller.id, name: template.name, template };
    shopRows.push({
      id,
      name: template.name,
      bio: template.bio,
      category: template.category,
      address: template.address,
      opening_hours: template.hours,
      website: `https://${template.handle}.example.com`,
      socialLinks: [{ type: "instagram", url: `https://instagram.com/${template.handle}` }],
      coverBanner: unsplash(pool[template.coverSubject][0], 1600, 500),
      ratings: template.base,
      sellerId: seller.id,
      createdAt: daysAgo(randInt(200, 225)),
    });
    shopImageRows.push({ id: oid(), file_id: `seed-shop-${template.handle}`, url: unsplash(pool[template.avatarSubject][0], 300, 300), shopId: id });
  }
  await insertMany(prisma.shops, shopRows);
  await insertMany(prisma.images, shopImageRows);

  // ------------------------------------------------------------------------------------------ 3. buyers + addresses
  const users: SeedUser[] = [];
  const userRows: any[] = [];
  const addressRows: any[] = [];
  const usedNames = new Set<string>();
  while (users.length < N_BUYERS) {
    const first = pick(FIRST_NAMES);
    const last = pick(LAST_NAMES);
    const name = `${first} ${last}`;
    if (usedNames.has(name)) continue;
    usedNames.add(name);

    const location = weighted(LOCATIONS.map((l) => [l, l.weight] as [typeof l, number]));
    const city = pick(location.cities);
    const id = oid();
    const addressId = oid();
    const email = `${first}.${last}${users.length + 1}${SEED_DOMAIN}`.toLowerCase();
    const affinity = shuffle(CATEGORIES).slice(0, rand() < 0.45 ? 1 : 2);

    users.push({ id, name, email, addressId, country: location.country, city, device: weighted(DEVICES), affinity, favourites: [] });
    userRows.push({ id, name, email, role: "user", password: passwordHash, createdAt: daysAgo(randInt(120, 215)) });
    addressRows.push({
      id: addressId,
      userId: id,
      label: "Home",
      name,
      street: `${randInt(2, 240)} ${pick(location.streets)}`,
      city,
      zip: location.zip(),
      country: location.country,
      isDefault: true,
    });
  }
  await insertMany(prisma.users, userRows);
  await insertMany(prisma.address, addressRows);

  // ------------------------------------------------------------------------------------------ 4. products
  const products: SeedProduct[] = [];
  const subjectUse: Record<string, number> = {};
  const subSubjects: Record<string, string[]> = {};
  for (const t of PRODUCT_TEMPLATES) {
    const key = `${t.category}|${t.subCategory}`;
    (subSubjects[key] ||= []);
    if (!subSubjects[key].includes(t.subject)) subSubjects[key].push(t.subject);
  }

  for (const [index, template] of PRODUCT_TEMPLATES.entries()) {
    const shop = shopByCategory[template.category];
    const pool = IMAGE_POOLS[template.category];

    //gallery: this subject's photos first, then photos from sibling subjects, then anything in the category
    const useKey = `${template.category}|${template.subject}`;
    const use = (subjectUse[useKey] = (subjectUse[useKey] ?? -1) + 1);
    const ordered: string[] = [...rotate(pool[template.subject], use)];
    for (const sibling of subSubjects[`${template.category}|${template.subCategory}`]) {
      if (sibling !== template.subject) ordered.push(...rotate(pool[sibling], use));
    }
    for (const subject of Object.keys(pool)) ordered.push(...rotate(pool[subject], use));
    const imageIds = [...new Set(ordered)].slice(0, 3);

    const base = template.min + rand() * (template.max - template.min);
    const sale = round2(Math.floor(base) + 0.99);
    const regular = round2(Math.ceil(sale * (1 + 0.1 + rand() * 0.25)) - 0.01);
    const options = optionsFor(template);
    const early = rand() < 0.85;

    products.push({
      id: oid(),
      shopId: shop.id,
      sellerId: shop.sellerId,
      template,
      title: template.title,
      slug: `${slugify(template.title)}-${(index + 1).toString(36)}${randInt(100, 999)}`,
      sale,
      regular: regular > sale ? regular : round2(sale + 5),
      colors: options.colors,
      sizes: options.sizes,
      createdAt: early ? daysAgo(randInt(181, 215)) : daysAgo(randInt(20, 180)),
      isEvent: false,
      startingDate: null,
      endingDate: null,
      sold: 0,
      stock: 0,
      rating: 5,
      imageIds,
    });
  }

  //offers: a handful of products run time-limited events (these show on the Offers page, not the main listing)
  const eventCandidates = shuffle(products);
  eventCandidates.slice(0, N_EVENTS).forEach((product, i) => {
    product.isEvent = true;
    const upcoming = i >= N_EVENTS - 2;
    product.startingDate = upcoming ? daysAgo(-randInt(2, 5)) : daysAgo(randInt(2, 10));
    product.endingDate = daysAgo(-randInt(12, 35));
    //offer price: 20-40% below the regular price, still ending in .99
    product.sale = round2(Math.max(0.99, Math.floor(product.regular * (0.6 + rand() * 0.2)) - 0.01));
  });

  const productsByShop: Record<string, SeedProduct[]> = {};
  const productsByCategory: Record<string, SeedProduct[]> = {};
  const productById: Record<string, SeedProduct> = {};
  for (const product of products) {
    (productsByShop[product.shopId] ||= []).push(product);
    (productsByCategory[product.template.category] ||= []).push(product);
    productById[product.id] = product;
  }
  //real shoppers return to a few sub-categories (e.g. "Laptops", not all of Electronics), which leaves plenty of
  //in-category products they have not seen yet for a recommender to surface
  for (const user of users) {
    const favouriteSubs = new Set<string>();
    for (const category of user.affinity) {
      for (const sub of sample(CATEGORY_TREE[category], randInt(1, 2))) favouriteSubs.add(`${category}|${sub}`);
    }
    user.favourites = products
      .filter((p) => favouriteSubs.has(`${p.template.category}|${p.template.subCategory}`))
      .map((p) => p.id);
  }
  const categoryOfShop: Record<string, string> = {};
  for (const [category, shop] of Object.entries(shopByCategory)) categoryOfShop[shop.id] = category;

  // ------------------------------------------------------------------------------------------ 5. orders
  //how many orders each buyer places (about 8 each, summing to exactly N_ORDERS)
  const orderCounts = users.map(() => randInt(4, 12));
  let diff = N_ORDERS - orderCounts.reduce((a, b) => a + b, 0);
  while (diff !== 0) {
    const i = randInt(0, users.length - 1);
    if (diff > 0 && orderCounts[i] < 14) { orderCounts[i]++; diff--; }
    else if (diff < 0 && orderCounts[i] > 2) { orderCounts[i]--; diff++; }
  }

  //more recent days are more likely, so monthly revenue trends upward
  const sampleDaysAgo = () => {
    for (;;) {
      const d = rand() * 180;
      if (rand() < 1 - 0.65 * (d / 180)) return d;
    }
  };

  const orders: SeedOrder[] = [];
  users.forEach((user, ui) => {
    for (let n = 0; n < orderCounts[ui]; n++) {
      const placedDaysAgo = Math.max(0.3, sampleDaysAgo());
      const createdAt = new Date(NOW - placedDaysAgo * DAY);
      const category = rand() < 0.7 ? pick(user.affinity) : pick(CATEGORIES);
      const shop = shopByCategory[category];
      const eligible = productsByShop[shop.id].filter((p) => p.createdAt.getTime() <= createdAt.getTime());
      const pool = eligible.length ? eligible : productsByShop[shop.id];
      const itemCount = Math.min(pool.length, weighted<number>([[1, 45], [2, 30], [3, 17], [4, 8]]));

      const favouriteSet = new Set(user.favourites);
      const favouritePool = pool.filter((p) => favouriteSet.has(p.id));
      const chosen: SeedProduct[] = [];
      for (let guard = 0; chosen.length < itemCount && guard < 60; guard++) {
        const candidate = pick(favouritePool.length && rand() < 0.6 ? favouritePool : pool);
        if (!chosen.includes(candidate)) chosen.push(candidate);
      }
      const items = chosen.map((product) => {
        const quantity = weighted<number>([[1, 75], [2, 18], [3, 7]]);
        const selectedOptions: any = {};
        if (product.sizes.length) selectedOptions.size = pick(product.sizes);
        if (product.colors.length) selectedOptions.color = pick(product.colors);
        return { id: oid(), productId: product.id, quantity, price: product.sale, selectedOptions: Object.keys(selectedOptions).length ? selectedOptions : null };
      });

      const status = weighted<string>([["Paid", 87], ["Pending", 8], ["Failed", 5]]);
      let deliveryStatus = "Ordered";
      if (status === "Paid") {
        if (placedDaysAgo > 14) deliveryStatus = weighted<string>([["Delivered", 90], ["Out for Delivery", 5], ["Shipped", 5]]);
        else if (placedDaysAgo > 7) deliveryStatus = weighted<string>([["Delivered", 50], ["Out for Delivery", 20], ["Shipped", 20], ["Packed", 10]]);
        else deliveryStatus = weighted<string>([["Ordered", 30], ["Packed", 30], ["Shipped", 25], ["Out for Delivery", 15]]);
      }

      orders.push({
        id: oid(),
        userId: user.id,
        shopId: shop.id,
        createdAt,
        updatedAt: new Date(Math.min(NOW, createdAt.getTime() + (deliveryStatus === "Delivered" ? randInt(3, 9) : randInt(0, 3)) * DAY)),
        status,
        deliveryStatus,
        total: round2(items.reduce((sum, item) => sum + item.price * item.quantity, 0)),
        items,
      });
    }
  });
  orders.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  //units sold (paid orders only) drive totalSales; stock is what's left on the shelf
  for (const order of orders) {
    if (order.status !== "Paid") continue;
    for (const item of order.items) productById[item.productId].sold += item.quantity;
  }
  const inStockPool = products.filter((p) => !p.isEvent);
  const zeroStock = new Set(sample(inStockPool, N_OUT_OF_STOCK).map((p) => p.id));
  for (const product of products) product.stock = zeroStock.has(product.id) ? 0 : randInt(6, 150);

  // ------------------------------------------------------------------------------------------ 6. reviews + shop ratings
  const firstPaid: Record<string, Record<string, Date>> = {}; //shopId -> userId -> first paid order date
  for (const order of orders) {
    if (order.status !== "Paid") continue;
    const byUser = (firstPaid[order.shopId] ||= {});
    if (!byUser[order.userId] || order.createdAt < byUser[order.userId]) byUser[order.userId] = order.createdAt;
  }

  const reviewRows: any[] = [];
  const reviewed = new Set<string>(); //one review per buyer per shop
  const shopRatingSum: Record<string, { sum: number; n: number }> = {};
  const addReview = (shopId: string, userId: string, firstDate: Date) => {
    const rating = weighted<number>([[5, 50], [4, 35], [3, 15]]);
    let text = pick(REVIEW_TEXT[rating]);
    if (rating >= 4 && rand() < 0.6) text += ` ${REVIEW_FLAVOUR[categoryOfShop[shopId]]}`;
    const createdAt = new Date(Math.min(NOW - DAY, firstDate.getTime() + randInt(3, 25) * DAY));
    reviewRows.push({ id: oid(), userId, shopsId: shopId, rating, reviews: text, createdAt, updatedAt: createdAt });
    reviewed.add(`${shopId}:${userId}`);
    const agg = (shopRatingSum[shopId] ||= { sum: 0, n: 0 });
    agg.sum += rating;
    agg.n += 1;
  };

  //first pass: a similar number of reviews for every shop
  for (const shop of Object.values(shopByCategory)) {
    const candidates = Object.entries(firstPaid[shop.id] ?? {});
    for (const [userId, firstDate] of sample(candidates, Math.min(N_REVIEWS_PER_SHOP, candidates.length))) {
      addReview(shop.id, userId, firstDate);
    }
  }
  //second pass: top up to the target from buyers who haven't reviewed yet
  const leftovers = Object.values(shopByCategory).flatMap((shop) =>
    Object.entries(firstPaid[shop.id] ?? {})
      .filter(([userId]) => !reviewed.has(`${shop.id}:${userId}`))
      .map(([userId, firstDate]) => ({ shopId: shop.id, userId, firstDate })),
  );
  for (const extra of sample(leftovers, Math.max(0, N_REVIEWS_TOTAL - reviewRows.length))) {
    addReview(extra.shopId, extra.userId, extra.firstDate);
  }

  const shopRating: Record<string, number> = {};
  for (const shop of Object.values(shopByCategory)) {
    const agg = shopRatingSum[shop.id];
    shopRating[shop.id] = agg ? Math.round((agg.sum / agg.n) * 10) / 10 : shop.template.base;
  }
  for (const product of products) {
    const base = shopRating[product.shopId];
    product.rating = Math.round(Math.min(5, Math.max(3.5, base + (rand() - 0.55) * 0.9)) * 10) / 10;
  }

  // ------------------------------------------------------------------------------------------ 7. followers
  const followerRows: any[] = [];
  const followerSeen = new Set<string>();
  for (const user of users) {
    const boughtFrom = [...new Set(orders.filter((o) => o.userId === user.id && o.status === "Paid").map((o) => o.shopId))];
    const chosen = new Set<string>();
    for (const shopId of boughtFrom) if (rand() < 0.5) chosen.add(shopId);
    chosen.add(shopByCategory[pick(user.affinity)].id);
    if (rand() < 0.35) chosen.add(pick(Object.values(shopByCategory)).id);
    for (const shopId of chosen) {
      const key = `${user.id}:${shopId}`;
      if (followerSeen.has(key)) continue;
      followerSeen.add(key);
      followerRows.push({ id: oid(), userId: user.id, shopsId: shopId });
    }
  }

  // ------------------------------------------------------------------------------------------ 8. interaction history + analytics
  //each buyer's history = their real purchases + browsing that leans 70% towards their favourite categories
  const productViews: Record<string, number> = {};
  const productCart: Record<string, number> = {};
  const productWish: Record<string, number> = {};
  const productLast: Record<string, number> = {};
  const productUnits: Record<string, number> = {};
  const shopVisitors: Record<string, Set<string>> = {};
  const shopLast: Record<string, number> = {};
  const userAnalyticsRows: any[] = [];
  const visitorRows: any[] = [];
  const shopCountry: Record<string, Record<string, number>> = {};
  const shopCity: Record<string, Record<string, number>> = {};
  const shopDevice: Record<string, Record<string, number>> = {};

  for (const order of orders) {
    if (order.status !== "Paid") continue;
    for (const item of order.items) productUnits[item.productId] = (productUnits[item.productId] || 0) + item.quantity;
  }

  let totalActions = 0;
  for (const user of users) {
    const events: ActionEvent[] = [];
    for (const order of orders) {
      if (order.userId !== user.id || order.status !== "Paid") continue;
      for (const item of order.items) {
        events.push({ productId: item.productId, shopId: order.shopId, action: "purchase", timestamp: order.createdAt.toISOString() });
      }
    }

    const target = randInt(60, 100);
    const seen = new Set<string>();
    let guard = 0;
    while (events.length < target && guard++ < 1000) {
      const inAffinity = rand() < 0.7;
      const product =
        inAffinity && user.favourites.length && rand() < 0.6
          ? productById[pick(user.favourites)]
          : pick(productsByCategory[inAffinity ? pick(user.affinity) : pick(CATEGORIES)]);
      const action = weighted<string>([["product_view", 60], ["add_to_cart", 20], ["add_to_wishlist", 20]]);
      if (action !== "product_view") {
        const key = `${product.id}:${action}`;
        if (seen.has(key)) continue;
        seen.add(key);
      }
      events.push({ productId: product.id, shopId: product.shopId, action, timestamp: new Date(NOW - rand() * 90 * DAY).toISOString() });
    }

    //the app keeps only the most recent 100 actions per user
    events.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    const kept = events.slice(-100);
    totalActions += kept.length;

    const visited = new Set<string>();
    for (const event of kept) {
      const at = new Date(event.timestamp).getTime();
      productLast[event.productId] = Math.max(productLast[event.productId] || 0, at);
      if (event.action === "product_view") productViews[event.productId] = (productViews[event.productId] || 0) + 1;
      if (event.action === "add_to_cart") productCart[event.productId] = (productCart[event.productId] || 0) + 1;
      if (event.action === "add_to_wishlist") productWish[event.productId] = (productWish[event.productId] || 0) + 1;
      visited.add(event.shopId);
      shopLast[event.shopId] = Math.max(shopLast[event.shopId] || 0, at);
    }
    for (const order of orders) if (order.userId === user.id) visited.add(order.shopId);

    for (const shopId of visited) {
      (shopVisitors[shopId] ||= new Set()).add(user.id);
      visitorRows.push({ id: oid(), shopId, userId: user.id, visitedAt: new Date(shopLast[shopId] || NOW - rand() * 60 * DAY) });
      //every visit adds to the shop's country / city / device breakdowns
      const visits = 1 + randInt(0, 3);
      (shopCountry[shopId] ||= {})[user.country] = (shopCountry[shopId][user.country] || 0) + visits;
      (shopCity[shopId] ||= {})[user.city] = (shopCity[shopId][user.city] || 0) + visits;
      (shopDevice[shopId] ||= {})[user.device] = (shopDevice[shopId][user.device] || 0) + visits;
    }

    userAnalyticsRows.push({
      id: oid(),
      userId: user.id,
      lastVisited: new Date(kept[kept.length - 1].timestamp),
      actions: kept,
      country: user.country,
      city: user.city,
      device: user.device,
    });
  }

  const productAnalyticsRows: any[] = [];
  for (const product of products) {
    const views = productViews[product.id] || 0;
    const cartAdds = productCart[product.id] || 0;
    const wishlistAdds = productWish[product.id] || 0;
    const purchases = productUnits[product.id] || 0;
    if (!views && !cartAdds && !wishlistAdds && !purchases) continue;
    productAnalyticsRows.push({
      id: oid(), productId: product.id, shopId: product.shopId, views, cartAdds, wishlistAdds, purchases,
      lastViewedAt: productLast[product.id] ? new Date(productLast[product.id]) : null,
    });
  }

  const shopAnalyticsRows = Object.values(shopByCategory).map((shop) => ({
    id: oid(),
    shopId: shop.id,
    totalVisitors: shopVisitors[shop.id]?.size ?? 0,
    countryStats: shopCountry[shop.id] ?? {},
    cityStats: shopCity[shop.id] ?? {},
    deviceStats: shopDevice[shop.id] ?? {},
    lastViewedAt: shopLast[shop.id] ? new Date(shopLast[shop.id]) : null,
  }));

  // ------------------------------------------------------------------------------------------ 9. write everything
  console.log("Writing data...");
  const productRows: any[] = [];
  const productImageRows: any[] = [];
  for (const p of products) {
    const t = p.template;
    const bullets = t.features.map((f) => `<li>${f}</li>`).join("");
    const shopName = shopByCategory[t.category].name;
    productRows.push({
      id: p.id,
      title: p.title,
      slug: p.slug,
      category: t.category,
      subCategory: t.subCategory,
      isDeleted: false,
      short_description: t.blurb,
      detailed_description: `<p>${t.blurb}</p><p>Sold and shipped by ${shopName}, with free returns within 30 days and fast dispatch.</p><ul>${bullets}</ul>`,
      tags: [...new Set([...t.tags, t.subCategory.toLowerCase(), t.category.toLowerCase()])].slice(0, 5),
      warranty: WARRANTY[t.category],
      custom_specifications: [],
      customProperties: [],
      cashOnDelivery: rand() < 0.7 ? "yes" : "no",
      brand: t.brand,
      video_url: null,
      colors: p.colors,
      sizes: p.sizes,
      discount_codes: [],
      stock: p.stock,
      starting_date: p.startingDate,
      ending_date: p.endingDate,
      sale_price: p.sale,
      regular_price: p.regular,
      rating: p.rating,
      deletedAt: null,
      status: "Active",
      sellerId: p.sellerId,
      shopId: p.shopId,
      totalSales: p.sold,
      createdAt: p.createdAt,
      updatedAt: p.createdAt,
    });
    p.imageIds.forEach((imageId, i) => {
      productImageRows.push({ id: oid(), file_id: `seed-${p.slug}-${i + 1}`, url: unsplash(imageId, 900), productsId: p.id });
    });
  }

  await insertMany(prisma.products, productRows);
  await insertMany(prisma.images, productImageRows);
  await insertMany(prisma.orders, orders.map((o) => ({
    id: o.id, shopId: o.shopId, userId: o.userId, total: o.total, shippingAddressId: users.find((u) => u.id === o.userId)!.addressId,
    couponCode: null, discountAmount: 0, status: o.status, deliveryStatus: o.deliveryStatus, createdAt: o.createdAt, updatedAt: o.updatedAt,
  })));
  await insertMany(prisma.orderItems, orders.flatMap((o) => o.items.map((item) => ({
    id: item.id, orderId: o.id, productId: item.productId, quantity: item.quantity, price: item.price,
    selectedOptions: item.selectedOptions ?? undefined, createdAt: o.createdAt,
  }))));
  await insertMany(prisma.shopReviews, reviewRows);
  await insertMany(prisma.followers, followerRows);
  await insertMany(prisma.userAnalytics, userAnalyticsRows);
  await insertMany(prisma.productAnalytics, productAnalyticsRows);
  await insertMany(prisma.uniqueShopVisitors, visitorRows);
  await insertMany(prisma.shopAnalytics, shopAnalyticsRows);

  //shop ratings are the average of the reviews that now exist
  for (const shop of Object.values(shopByCategory)) {
    await prisma.$runCommandRaw({
      update: "shops",
      updates: [{ q: { _id: { $oid: shop.id } }, u: { $set: { ratings: shopRating[shop.id] } } }],
    });
  }

  // ------------------------------------------------------------------------------------------ 10. summary
  const paid = orders.filter((o) => o.status === "Paid");
  const byStatus = counts();
  const byDelivery = counts();
  const revenueByMonth = counts();
  const ordersByMonth = counts();
  for (const o of orders) {
    byStatus[o.status] = (byStatus[o.status] || 0) + 1;
    const month = o.createdAt.toISOString().slice(0, 7);
    ordersByMonth[month] = (ordersByMonth[month] || 0) + 1;
    if (o.status === "Paid") {
      byDelivery[o.deliveryStatus] = (byDelivery[o.deliveryStatus] || 0) + 1;
      revenueByMonth[month] = round2((revenueByMonth[month] || 0) + o.total);
    }
  }
  const revenueByShop = counts();
  for (const o of paid) revenueByShop[categoryOfShop[o.shopId]] = round2((revenueByShop[categoryOfShop[o.shopId]] || 0) + o.total);

  const line = (label: string, value: any) => console.log(`  ${label.padEnd(34)} ${value}`);
  console.log("\n================ SEED SUMMARY ================");
  line("sellers (new / reused real)", `${newSellerRows.length} / ${realSellers.length}`);
  line("shops", shopRows.length);
  line("buyers", userRows.length);
  line("products", `${productRows.length} (${products.filter((p) => p.isEvent).length} are timed offers)`);
  line("product images", productImageRows.length);
  line("orders", `${orders.length}  ${JSON.stringify(byStatus)}`);
  line("order items", orders.reduce((s, o) => s + o.items.length, 0));
  line("shop reviews", reviewRows.length);
  line("followers", followerRows.length);
  line("userAnalytics rows / actions", `${userAnalyticsRows.length} / ${totalActions} (avg ${(totalActions / userAnalyticsRows.length).toFixed(0)} per user)`);
  line("productAnalytics rows", productAnalyticsRows.length);
  line("shopAnalytics rows / visitors", `${shopAnalyticsRows.length} / ${visitorRows.length}`);
  line("out-of-stock products", products.filter((p) => p.stock === 0).length);
  line("delivery status (paid orders)", JSON.stringify(byDelivery));
  console.log("\n  orders per month:", JSON.stringify(ordersByMonth));
  console.log("  revenue per month (paid):", JSON.stringify(revenueByMonth));
  console.log("  revenue by shop (paid):", JSON.stringify(revenueByShop));
  console.log("  shop ratings:", JSON.stringify(Object.fromEntries(Object.values(shopByCategory).map((s) => [s.name, shopRating[s.id]]))));
  console.log("\n  demo buyer login :", users[0].email, "/", PASSWORD);
  for (const [category, seller] of Object.entries(sellerByCategory)) {
    console.log(`  seller ${seller.seeded ? "(seeded)" : "(YOUR REAL ACCOUNT)"} ${category.padEnd(20)} ${seller.email}${seller.seeded ? ` / ${PASSWORD}` : ""}`);
  }
  console.log(`\ndone in ${((Date.now() - started) / 1000).toFixed(1)}s`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
