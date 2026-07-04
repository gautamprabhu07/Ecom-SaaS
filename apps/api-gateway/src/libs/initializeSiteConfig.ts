import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const initializeSiteConfig = async () => {
  try {
    const existingConfig = await prisma.site_config.findFirst();

    if (!existingConfig) {
      await prisma.site_config.create({
        data: {
          categories: [
            "Electronics",
            "Fashion",
            "Home & Garden",
            "Sports & Outdoors",
            "Health & Beauty",
            "Toys & Games",
          ],
          subCategories: {
            Electronics: [
              "Mobile Phones",
              "Laptops",
              "Cameras",
              "Audio Equipment",
            ],
            Fashion: [
              "Men's Clothing",
              "Women's Clothing",
              "Shoes",
              "Accessories",
            ],
            "Home & Garden": [
              "Furniture",
              "Kitchenware",
              "Decor",
              "Gardening Tools",
            ],
            "Sports & Outdoors": [
              "Fitness Equipment",
              "Outdoor Gear",
              "Sportswear",
            ],
            "Health & Beauty": [
              "Skincare",
              "Makeup",
              "Haircare",
              "Wellness Products",
            ],
            "Toys & Games": [
              "Action Figures",
              "Board Games",
              "Puzzles",
              "Educational Toys",
            ],
          },
        },
      });
    }
  } catch (error) {
    console.error("Error initializing site config:", error);
  }
};

export default initializeSiteConfig;
