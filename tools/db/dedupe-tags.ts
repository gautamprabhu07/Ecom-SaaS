//Path: tools/db/dedupe-tags.ts
//rewrites every product's tags as unique, trimmed, lowercase values
import { prisma } from "./raw";

async function main() {
  const products = await prisma.products.findMany({ select: { id: true, title: true, tags: true } });
  let changed = 0;

  for (const product of products) {
    const cleaned = [...new Set(product.tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))];
    const same = cleaned.length === product.tags.length && cleaned.every((tag, i) => tag === product.tags[i]);
    if (same) continue;

    await prisma.products.update({ where: { id: product.id }, data: { tags: cleaned } });
    changed++;
  }

  console.log(`checked ${products.length} product(s), cleaned tags on ${changed}`);
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
