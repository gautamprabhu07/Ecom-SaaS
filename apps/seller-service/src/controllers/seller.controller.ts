//Path: apps/seller-service/src/controllers/seller.controller.ts
import { Request, Response, NextFunction } from "express";
import prisma from "@packages/libs/prisma"
import { ValidationError } from "@packages/error-handler";
import imagekit from "@packages/libs/imagekit";
import { toFile } from "@imagekit/nodejs";

//get seller's own shop profile (with products, events, reviews)
export const getSellerProfile = async (req: any, res: Response, next: NextFunction) => {
   try {
      const sellerId = req.seller?.id;
      if (!sellerId) {
         return next(new ValidationError("You must be logged in as a seller."));
      }

      const shop = await prisma.shops.findUnique({
         where: { sellerId },
         include: {
            avatar: true,
            followers: true,
         },
      });

      if (!shop) {
         return next(new ValidationError("Shop not found for this seller."));
      }

      const [products, offers, reviews] = await Promise.all([
         prisma.products.findMany({
            where: {
               shopId: shop.id,
               isDeleted: false,
               OR: [
                  { starting_date: { equals: null } },
                  { starting_date: { isSet: false } },
               ],
            },
            include: { images: true },
            orderBy: { createdAt: "desc" },
         }),
         prisma.products.findMany({
            where: {
               shopId: shop.id,
               isDeleted: false,
               AND: [
                  { starting_date: { not: null } },
                  { ending_date: { not: null } },
               ],
            },
            include: { images: true },
            orderBy: { createdAt: "desc" },
         }),
         prisma.shopReviews.findMany({
            where: { shopsId: shop.id },
            include: {
               user: {
                  select: { id: true, name: true, avatar: true },
               },
            },
            orderBy: { createdAt: "desc" },
         }),
      ]);

      return res.status(200).json({
         success: true,
         shop: {
            id: shop.id,
            name: shop.name,
            bio: shop.bio,
            category: shop.category,
            address: shop.address,
            opening_hours: shop.opening_hours,
            website: shop.website,
            ratings: shop.ratings,
            coverBanner: shop.coverBanner,
            avatar: shop.avatar?.[0]?.url || null,
            followersCount: shop.followers.length,
         },
         products,
         offers,
         reviews,
      });
   }
   catch (error) {
      return next(error);
   }
};

//update shop profile details (name, bio, address, opening hours, website)
export const updateShopProfile = async (req: any, res: Response, next: NextFunction) => {
   try {
      const sellerId = req.seller?.id;
      if (!sellerId) {
         return next(new ValidationError("You must be logged in as a seller."));
      }

      const { name, bio, address, opening_hours, website } = req.body;

      const shop = await prisma.shops.findUnique({ where: { sellerId } });
      if (!shop) {
         return next(new ValidationError("Shop not found for this seller."));
      }

      const updatedShop = await prisma.shops.update({
         where: { id: shop.id },
         data: {
            ...(name && { name }),
            ...(bio && { bio }),
            ...(address && { address }),
            ...(opening_hours && { opening_hours }),
            ...(website && { website }),
         },
      });

      return res.status(200).json({ success: true, shop: updatedShop });
   }
   catch (error) {
      return next(error);
   }
};

//update shop avatar
export const updateShopAvatar = async (req: any, res: Response, next: NextFunction) => {
   try {
      const sellerId = req.seller?.id;
      if (!sellerId) {
         return next(new ValidationError("You must be logged in as a seller."));
      }

      const { fileName: base64Data } = req.body;
      if (!base64Data) {
         return next(new ValidationError("Image data is required."));
      }

      const shop = await prisma.shops.findUnique({ where: { sellerId } });
      if (!shop) {
         return next(new ValidationError("Shop not found for this seller."));
      }

      const base64String = base64Data.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64String, "base64");

      const uploadResponse = await imagekit.files.upload({
         file: await toFile(buffer, `shop-avatar-${Date.now()}.jpg`),
         fileName: `shop-avatar-${Date.now()}.jpg`,
         folder: "/shops/avatars",
      });

      //remove old avatar image records for this shop, then create new one
      await prisma.images.deleteMany({ where: { shopId: shop.id } });

      const newImage = await prisma.images.create({
         data: {
            url: uploadResponse.url ?? "",
            file_id: uploadResponse.fileId ?? "",
            shopId: shop.id,
         },
      });

      return res.status(200).json({ success: true, avatar: newImage.url });
   }
   catch (error) {
      return next(error);
   }
};

//update shop cover banner
export const updateShopCover = async (req: any, res: Response, next: NextFunction) => {
   try {
      const sellerId = req.seller?.id;
      if (!sellerId) {
         return next(new ValidationError("You must be logged in as a seller."));
      }

      const { fileName: base64Data } = req.body;
      if (!base64Data) {
         return next(new ValidationError("Image data is required."));
      }

      const shop = await prisma.shops.findUnique({ where: { sellerId } });
      if (!shop) {
         return next(new ValidationError("Shop not found for this seller."));
      }

      const base64String = base64Data.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64String, "base64");

      const uploadResponse = await imagekit.files.upload({
         file: await toFile(buffer, `shop-cover-${Date.now()}.jpg`),
         fileName: `shop-cover-${Date.now()}.jpg`,
         folder: "/shops/covers",
      });

      const updatedShop = await prisma.shops.update({
         where: { id: shop.id },
         data: { coverBanner: uploadResponse.url },
      });

      return res.status(200).json({ success: true, coverBanner: updatedShop.coverBanner });
   }
   catch (error) {
      return next(error);
   }
};