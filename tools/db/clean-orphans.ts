//Path: tools/db/clean-orphans.ts
//finds shops whose sellerId points at no real seller. Report-only unless run with --confirm.
//usage: npx tsx tools/db/clean-orphans.ts [--confirm]
import fs from "fs";
import path from "path";
import { prisma, findAll, idOf, oidOf, toOid, realSellerIds } from "./raw";

const CONFIRM = process.argv.includes("--confirm");

async function main() {
  const sellerIds = await realSellerIds();
  const shops = await findAll("shops");
  const orphans = shops.filter((s) => !oidOf(s.sellerId) || !sellerIds.has(oidOf(s.sellerId)!));

  console.log(`${shops.length} shops, ${sellerIds.size} real sellers, ${orphans.length} orphaned shop(s)\n`);

  const deletable: any[] = [];
  const blocked: string[] = [];
  for (const shop of orphans) {
    const shopId = idOf(shop);
    const products = await prisma.products.count({ where: { shopId } });
    const orders = await prisma.orders.count({ where: { shopId } });
    console.log(`  ${shop.name.padEnd(14)} products: ${String(products).padStart(3)}   orders: ${orders}`);
    if (orders > 0) blocked.push(shop.name);
    else deletable.push(shop);
  }

  if (blocked.length) console.log(`\nREFUSING to delete shops that have orders: ${blocked.join(", ")}`);
  if (!CONFIRM) {
    console.log(`\nreport only. ${deletable.length} shop(s) would be deleted. Re-run with --confirm to delete.`);
    await prisma.$disconnect();
    return;
  }

  const shopIds = deletable.map(idOf);
  const products = await prisma.products.findMany({ where: { shopId: { in: shopIds } }, include: { images: true } });
  const productIds = products.map((p) => p.id);

  //keep a copy of everything removed so a mistake is recoverable
  const backupDir = path.join(__dirname, "backups");
  fs.mkdirSync(backupDir, { recursive: true });
  const backupFile = path.join(backupDir, `orphans-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  fs.writeFileSync(backupFile, JSON.stringify({ shops: deletable, products }, null, 2));
  console.log(`\nbackup written to ${path.relative(process.cwd(), backupFile)}`);

  const images = await prisma.images.deleteMany({ where: { OR: [{ productsId: { in: productIds } }, { shopId: { in: shopIds } }] } });
  const productAnalytics = await prisma.productAnalytics.deleteMany({ where: { productId: { in: productIds } } });
  const removedProducts = await prisma.products.deleteMany({ where: { id: { in: productIds } } });
  const followers = await prisma.followers.deleteMany({ where: { shopsId: { in: shopIds } } });
  const reviews = await prisma.shopReviews.deleteMany({ where: { shopsId: { in: shopIds } } });
  const shopAnalytics = await prisma.shopAnalytics.deleteMany({ where: { shopId: { in: shopIds } } });
  const visitors = await prisma.uniqueShopVisitors.deleteMany({ where: { shopId: { in: shopIds } } });
  if (shopIds.length) await prisma.$runCommandRaw({ delete: "shops", deletes: [{ q: { _id: { $in: shopIds.map(toOid) } }, limit: 0 }] });

  console.log(
    `\nremoved: ${shopIds.length} shops, ${removedProducts.count} products, ${images.count} images, ${productAnalytics.count} productAnalytics, ` +
      `${followers.count} followers, ${reviews.count} reviews, ${shopAnalytics.count} shopAnalytics, ${visitors.count} uniqueShopVisitors`,
  );
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
