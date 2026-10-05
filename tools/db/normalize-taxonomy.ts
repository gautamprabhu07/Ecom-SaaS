//Path: tools/db/normalize-taxonomy.ts
//moves site_config, products and shops onto the canonical taxonomy. Idempotent: safe to run repeatedly.
import { prisma, findAll, idOf, toOid, printTable, tally } from "./raw";
import { CATEGORIES, CATEGORY_TREE, normalizeCategory, normalizeSubCategory } from "../../packages/types/categories";

async function main() {
  //1. site_config: overwrite the single existing document (create it only if there is none)
  const config = await prisma.site_config.findFirst();
  if (config) {
    await prisma.site_config.update({ where: { id: config.id }, data: { categories: CATEGORIES, subCategories: CATEGORY_TREE } });
    console.log("site_config overwritten with the canonical 10 categories");
  } else {
    await prisma.site_config.create({ data: { categories: CATEGORIES, subCategories: CATEGORY_TREE } });
    console.log("site_config created");
  }

  //2. products: category and the required subCategory
  const products = await prisma.products.findMany({ select: { id: true, title: true, category: true, subCategory: true } });
  printTable("products by category BEFORE", tally(products.map((p) => p.category)));

  let productsChanged = 0;
  const unmapped: string[] = [];
  for (const product of products) {
    const category = normalizeCategory(product.category);
    if (!category) {
      unmapped.push(`${product.title} (${product.category})`);
      continue;
    }
    const subCategory = normalizeSubCategory(category, product.subCategory);
    if (category !== product.category || subCategory !== product.subCategory) {
      await prisma.products.update({ where: { id: product.id }, data: { category, subCategory } });
      productsChanged++;
    }
  }

  //3. shops: raw commands, because reading them through Prisma can throw on orphaned sellerIds
  const shops = await findAll("shops", {}, { name: 1, category: 1 });
  printTable("shops by category BEFORE", tally(shops.map((s) => s.category)));

  const updates: any[] = [];
  for (const shop of shops) {
    const category = normalizeCategory(shop.category);
    if (!category) {
      unmapped.push(`shop ${shop.name} (${shop.category})`);
      continue;
    }
    if (category !== shop.category) updates.push({ q: { _id: toOid(idOf(shop)) }, u: { $set: { category } } });
  }
  if (updates.length) await prisma.$runCommandRaw({ update: "shops", updates });

  const productsAfter = await prisma.products.findMany({ select: { category: true } });
  const shopsAfter = await findAll("shops", {}, { category: 1 });
  printTable("products by category AFTER", tally(productsAfter.map((p) => p.category)));
  printTable("shops by category AFTER", tally(shopsAfter.map((s) => s.category)));

  console.log(`\nupdated ${productsChanged} product(s) and ${updates.length} shop(s)`);
  if (unmapped.length) console.log(`NOT changed (unknown category):\n  - ${unmapped.join("\n  - ")}`);
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
