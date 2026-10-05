//Path: tools/db/check-integrity.ts
//reports data problems; exits 1 if any (zero-image products are only a warning)
import { prisma, findAll, idOf, oidOf, realSellerIds } from "./raw";
import { CATEGORIES, CATEGORY_TREE } from "../../packages/types/categories";

const problems: string[] = [];
const warnings: string[] = [];

const report = (label: string, items: string[], target: string[]) => {
  console.log(`${items.length === 0 ? "ok     " : "PROBLEM"}  ${label}${items.length ? ` (${items.length})` : ""}`);
  items.slice(0, 10).forEach((item) => console.log(`           - ${item}`));
  if (items.length > 10) console.log(`           ... and ${items.length - 10} more`);
  if (items.length) target.push(label);
};

async function main() {
  const sellerIds = await realSellerIds();
  const shops = await findAll("shops", {}, { name: 1, sellerId: 1, category: 1 });
  const shopIds = new Set(shops.map(idOf));
  const products = await prisma.products.findMany({
    select: { id: true, title: true, category: true, subCategory: true, tags: true, shopId: true, _count: { select: { images: true } } },
  });

  console.log(`Checking ${shops.length} shops, ${products.length} products, ${sellerIds.size} sellers\n`);

  report("shops whose sellerId resolves to no seller", shops.filter((s) => !oidOf(s.sellerId) || !sellerIds.has(oidOf(s.sellerId)!)).map((s) => s.name), problems);
  report("products whose shopId resolves to no shop", products.filter((p) => !shopIds.has(p.shopId)).map((p) => p.title), problems);
  report("shops with a non-canonical category", shops.filter((s) => !CATEGORIES.includes(s.category)).map((s) => `${s.name} (${s.category})`), problems);
  report("products with a non-canonical category", products.filter((p) => !CATEGORIES.includes(p.category)).map((p) => `${p.title} (${p.category})`), problems);
  report(
    "products whose subCategory is not under their category",
    products.filter((p) => CATEGORIES.includes(p.category) && !CATEGORY_TREE[p.category].includes(p.subCategory)).map((p) => `${p.title} (${p.category} > ${p.subCategory})`),
    problems,
  );
  report(
    "products with duplicate tags",
    products.filter((p) => new Set(p.tags).size !== p.tags.length).map((p) => `${p.title} ${JSON.stringify(p.tags)}`),
    problems,
  );
  report("products with no images (warning only)", products.filter((p) => p._count.images === 0).map((p) => p.title), warnings);

  console.log(`\n${problems.length} problem type(s), ${warnings.length} warning type(s)`);
  await prisma.$disconnect();
  process.exit(problems.length ? 1 : 0);
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(2);
});
