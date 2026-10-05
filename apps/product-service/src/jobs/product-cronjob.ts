//Path: apps/product-service/src/jobs/product-cronjob.ts
import prisma from "@packages/libs/prisma";
import imagekit from "@packages/libs/imagekit";
import cron from "node-cron";

//permanently purge products whose 24h soft-delete grace period has expired
cron.schedule("0 0 * * *", async () => {
  try {
    const now = new Date();
    const expiredProducts = await prisma.products.findMany({
      where: {
         isDeleted: true,
         deletedAt: {lte:now},
      },
      select: { id: true, images: true },
    });

    if (expiredProducts.length === 0) {
      console.log("[product-cron] No expired products to purge.");
      return;
    }

    const productIds = expiredProducts.map((p) => p.id);

    //best-effort cleanup of the files on ImageKit so they don't linger as orphans;
    //a failed CDN delete must not block purging the database rows
    const fileIds = expiredProducts.flatMap((p) => p.images.map((img) => img.file_id));
    await Promise.allSettled(fileIds.map((fileId) => imagekit.files.delete(fileId)));

    await prisma.images.deleteMany({ where: { productsId: { in: productIds } } });
    const result = await prisma.products.deleteMany({ where: { id: { in: productIds } } });

    console.log(`[product-cron] Purged ${result.count} expired product(s) and ${fileIds.length} image(s).`);
   } catch (error) {
    console.error("Error deleting products:", error);
  }
});
