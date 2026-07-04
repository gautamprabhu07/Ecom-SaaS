import { NextFunction } from "express";
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

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
            discountValue,
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