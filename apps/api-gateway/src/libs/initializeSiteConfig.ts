//Path: apps/api-gateway/src/libs/initializeSiteConfig.ts
import { PrismaClient } from "@prisma/client";
import { CATEGORIES, CATEGORY_TREE } from "@packages/types/categories";

const prisma = new PrismaClient();

const initializeSiteConfig = async () => {
  try {
    const existingConfig = await prisma.site_config.findFirst();

    if (!existingConfig) {
      await prisma.site_config.create({
        data: {
          categories: CATEGORIES,
          subCategories: CATEGORY_TREE,
        },
      });
    }
  } catch (error) {
    console.error("Error initializing site config:", error);
  }
};

export default initializeSiteConfig;
