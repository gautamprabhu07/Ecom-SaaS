//Path: apps/product-service/src/controllers/product.controller.ts
import { NextFunction } from "express";
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { toFile } from "@imagekit/nodejs";
import imagekit from "@packages/libs/imagekit";
const prisma = new PrismaClient();





//get product categories
export const getProductCategories = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const config = await prisma.site_config.findFirst();
      if (!config) {
         return res.status(404).json({ error: "Site configuration not found." });
      }
   }
   catch (error) {
      return next(error);
   }
};

//Create discount codes
export const createDiscountCode = async (req: any, res: Response, next: NextFunction) => {
   try {
      const { public_name,discountType,discountValue,  discountCode} = req.body;
      const isDiscountCodeExists = await prisma.discount_codes.findUnique({
         where: {
            discountCode: discountCode,
         },
      });
      if (isDiscountCodeExists) {
         return next(new Error("Discount code already exists."));
      }

      const discountCodeData = await prisma.discount_codes.create({
         data: {
            public_name,
            discountType,
            discountValue: parseFloat(discountValue),
            discountCode,
            sellerId: req.seller.id
         },
      });

      return res.status(201).json(discountCodeData);
   }
   catch (error) {
      return next(error);
   }
};

//get discount codes
export const getDiscountCodes = async (req: any, res: Response, next: NextFunction) => {
   try {
      const discountCodes = await prisma.discount_codes.findMany({
         where: {
            sellerId: req.seller.id
         },
      });

      res.status(201).json({
         success: true,
         discountCodes
      });
   }
   catch (error) {
      return next(error);
   }
};

//delete discount codes
export const deleteDiscountCode = async (req: any, res: Response, next: NextFunction) => {
   try {
      const { id } = req.params;
      const sellerId = req.seller.id;

      const discountCode = await prisma.discount_codes.findUnique({
         where: {id},
         select: { id:true, sellerId: true }
      });

      if (!discountCode) {
         return next(new Error("Discount code not found."));
      }

      if (discountCode.sellerId !== sellerId) {
         return next(new Error("You are not authorized to delete this discount code."));
      }

      await prisma.discount_codes.delete({
         where: { id },
      });

      return res.status(200).json({ message: "Discount code deleted successfully." });
   }
   catch (error) {
      return next(error);
   }
};

//upload product image
export const uploadProductImage = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { fileName: base64Data } = req.body;

    // Strip the data URL prefix (data:image/jpeg;base64,...)
    const base64String = base64Data.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64String, "base64");

    const response = await imagekit.files.upload({
      file: await toFile(buffer, `product-${Date.now()}.jpg`),
      fileName: `product-${Date.now()}.jpg`,
      folder: "/products",
    });

    res.status(200).json({
      file_url: response.url,
      fileId: response.fileId,
    });
  } catch (error) {
    return next(error);
  }
};

//delete product image
export const deleteProductImage = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { fileId } = req.body;

    if (!fileId) {
      return res.status(400).json({ message: "fileId is required" });
    }

    const response = await imagekit.files.delete(fileId);

    res.status(200).json({
      success: true,
      response,
    });
  } catch (error) {
    return next(error);
  }
};