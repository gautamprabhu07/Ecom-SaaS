//Path: apps/product-service/src/controllers/product.controller.ts
import { NextFunction } from "express";
import { Request, Response } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { toFile } from "@imagekit/nodejs";
import imagekit from "@packages/libs/imagekit";
import { ValidationError } from "@packages/error-handler";

const prisma = new PrismaClient();

//get product categories
export const getProductCategories = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const config = await prisma.site_config.findFirst();
      if (!config) {
         return res.status(404).json({ error: "Site configuration not found." });
      }
      return res.status(200).json({
         success: true,
         categories: config.categories,
         subCategories: config.subCategories,
      });
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

//create product
export const createProduct = async (req: any, res: Response, next: NextFunction) => {
   try {
      const { title,
   short_description, 
   detailed_description,
   warranty,
   custom_specifications,
   slug,
   tags,
   cashOnDelivery,
   brand,
   video_url,
   category,
   colors=[],
   sizes=[],
   discountCodes=[],
   stock,
   sale_price,
   regular_price,
   subCategory,
   customProperties={},
   images =[],
   starting_date,
  ending_date,
       } = req.body;

       if(!title || !short_description || !slug || !category || !stock || !sale_price || !regular_price) {
         return next(new Error("Missing required fields."));
       }

       if (ending_date && !starting_date) {
         return next(new Error("Starting date is required when an ending date is set."));
      }

      if (starting_date && ending_date && new Date(ending_date) <= new Date(starting_date)) {
         return next(new Error("Ending date must be after the starting date."));
      }

       if(!req.seller.id)
       {
         return next(new Error("Seller ID is required."));
       }

       const slugChecking = await prisma.products.findUnique({
         where: {
            slug,
         },
       });

       if(slugChecking) {
         return next(new ValidationError("Slug already exists."));
       }

       const newProduct = await prisma.products.create({
         data: {
            sellerId: req.seller.id,
            title,
            short_description,
            detailed_description,
            warranty,
            cashOnDelivery,
            slug,
            shopId: req.seller?.shop?.id,
            tags: Array.isArray(tags) ? tags : tags.split(","),
            brand,
            video_url,
            category,
            subCategory,
            colors: colors || [],
            discount_codes: discountCodes.map((codeId: string) => codeId),
            sizes: sizes || [],
            stock: parseInt(stock),
            sale_price: parseFloat(sale_price),
            regular_price: parseFloat(regular_price),
            customProperties: customProperties || {},
            custom_specifications: custom_specifications || {},
            starting_date: starting_date ? new Date(starting_date) : null,
           ending_date: ending_date ? new Date(ending_date) : null,
            images: {
               create: images.filter((img: any) => img && img.file_url && img.fileId).map((img: any) => ({
                url: img.file_url,        
         file_id: img.fileId,
            }))
            }
            ,
         },
         include:
         {
            images: true,
         }
      });
      res.status(201).json({
         success: true,
         newProduct
      });
   } catch (error) {
      return next(error);
   }
};

//get logged in seller products
export const getShopProducts = async (req: any, res: Response, next: NextFunction) => {
   try {
      const products = await prisma.products.findMany({
         where: {
            shopId: req?.seller?.shop?.id
         },
         include: {
            images: true,
         }
      });

      res.status(200).json({
         success: true,
         products
      });
   }
   catch (error) {
      return next(error);
   }
};

//delete product
export const deleteProduct = async (req: any, res: Response, next: NextFunction) => {
   try {
      const { productId } = req.params;
      const sellerId = req.seller?.shop?.id;

      const product = await prisma.products.findUnique({
         where: { id: productId },
         select: { id: true, shopId: true, isDeleted: true }
      });

      if (!product) {
         return next(new Error("Product not found."));
      }

      if (product.shopId !== sellerId) {
         return next(new Error("You are not authorized to delete this product."));
      }

      if (product.isDeleted) {
         return next(new Error("Product is already deleted."));
      }

      const deletedProduct = await prisma.products.update({
         where: { id: productId },
         data: { isDeleted: true,
            deletedAt: new Date(Date.now()*24*60*60*1000) },
      });

      return res.status(200).json({ message: "Product is scheduled for deletion in 24 hours.", deletedAt: deletedProduct.deletedAt });

   }
   catch (error) {
      return next(error);
   }
};

//product restore
export const restoreProduct = async (req: any, res: Response, next: NextFunction) => {
   try {
      const { productId } = req.params;
      const sellerId = req.seller?.shop?.id;

      const product = await prisma.products.findUnique({
         where: { id: productId },
         select: { id: true, shopId: true, isDeleted: true }
      });

      if (!product) {
         return next(new Error("Product not found."));
      }

      if (product.shopId !== sellerId) {
         return next(new Error("You are not authorized to restore this product."));
      }

      if (!product.isDeleted) {
         return res.status(400).json({ message: "Product is not deleted." });
      }

      await prisma.products.update({
         where: { id: productId },
         data: { isDeleted: false, deletedAt: null },
      });

      return res.status(200).json({ message: "Product restored successfully." });
   }
   catch (error) {
      return next(error);
   }
};

//get seller stripe information




//get all products
export const getAllProducts = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;
      const type = req.query.type;

      const baseFilter = {
         OR: [
            { starting_date: { equals: null } },
      { starting_date: { isSet: false } },
         ],
      };

      const orderBy: Prisma.productsOrderByWithRelationInput =
         type === "latest"
            ? { createdAt: "desc" as Prisma.SortOrder }
            : { totalSales: "desc" as Prisma.SortOrder };

      const [products, total, top10Products] = await Promise.all([
         prisma.products.findMany({
            skip,
            take: limit,
            include: {
               images: true,
               Shop: {
                  include: {
                     avatar: true,
                  },
               },
            },
            where: baseFilter,
            orderBy,
         }),
         prisma.products.count({
            where: baseFilter,
         }),
         prisma.products.findMany({
            take: 10,
            include: {
               images: true,
               Shop: {
                  include: {
                     avatar: true,
                  },
               },
            },
            where: baseFilter,
            orderBy: { totalSales: "desc" },
         }),
      ]);

      res.status(200).json({
         products,
         top10By: type === "latest" ? "latest" : "topSales",
         top10Products,
         total,
         currentPage: page,
         totalPages: Math.ceil(total / limit),
      });
   }
   catch (error) {
      next(error);
   }
};

//get all events
export const getAllEvents = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;
      const type = req.query.type;

      const baseFilter = {
         AND: [
            { starting_date: { not: null } },
      { ending_date: { not: null } },
         ],
      };

      const orderBy: Prisma.productsOrderByWithRelationInput =
         type === "latest"
            ? { createdAt: "desc" as Prisma.SortOrder }
            : { totalSales: "desc" as Prisma.SortOrder };

      const [products, total, top10Products] = await Promise.all([
         prisma.products.findMany({
            skip,
            take: limit,
            include: {
               images: true,
               Shop: {
                  include: {
                     avatar: true,
                  },
               },
            },
            where: baseFilter,
            orderBy,
         }),
         prisma.products.count({
            where: baseFilter,
         }),
         prisma.products.findMany({
            take: 10,
            include: {
               images: true,
               Shop: {
                  include: {
                     avatar: true,
                  },
               },
            },
            where: baseFilter,
            orderBy: { totalSales: "desc" },
         }),
      ]);

      res.status(200).json({
         products,
         top10By: type === "latest" ? "latest" : "topSales",
         top10Products,
         total,
         currentPage: page,
         totalPages: Math.ceil(total / limit),
      });
   }
   catch (error) {
      next(error);
   }
};

//get product details
export const getProductDetails = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const slug = req.params.slug as string;
      console.log("Looking up product with slug:", JSON.stringify(slug)); // temp debug

      const product = await prisma.products.findUnique({
         where: { slug },
         include: { images: true, Shop: true },
      });

      if (!product) {
         console.log("No product matched this slug"); // temp debug
         return next(new Error("Product not found."));
      }

      res.status(201).json({ success: true, product });
   }
   catch (error) {
      next(error);
   }
};


//get filtered products
export const getFilteredProducts = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const {
         priceRange = [0, 10000],
         categories = [],
         colors = [],
         sizes = [],
         page = 1,
         limit = 12,
      } = req.query;

      const parsedPriceRange = typeof priceRange === "string" ? priceRange.split(",").map(Number) : [1, 10000];

      const parsedPage = Number(page);
      const parsedLimit = Number(limit);

      const skip = (parsedPage - 1) * parsedLimit;

      const filters: Record<string, any> = {
   sale_price: {
      gte: parsedPriceRange[0],
      lte: parsedPriceRange[1],
   },
   OR: [
      { starting_date: { equals: null } },
      { starting_date: { isSet: false } },
   ],
};

      if(categories && (categories as string).length > 0) {
         filters.category = { in: Array.isArray(categories) ? categories : (categories as string).split(",") };
      }

      if(colors && (colors as string).length > 0) {
         filters.colors = { hasSome: Array.isArray(colors) ? colors : [colors] };
      }

      if(sizes && (sizes as string).length > 0) {
         filters.sizes = { hasSome: Array.isArray(sizes) ? sizes : [sizes] };
      }

      const [products, total] = await Promise.all([
         prisma.products.findMany({
            where: filters,
            skip,
            take: parsedLimit,
            include: {
               images: true,
               Shop: true,
            },
         }),
         prisma.products.count({
            where: filters,
         }),
      ]);

      const totalPages = Math.ceil(total / parsedLimit);

      res.status(200).json({
         products,
         pagination: {
            total,
            page: parsedPage,
            totalPages,
         },
      });
   }
   catch (error) {
      next(error);
   }
};

//get filtered offers
export const getFilteredEvents = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const {
         priceRange = [0, 10000],
         categories = [],
         colors = [],
         sizes = [],
         page = 1,
         limit = 12,
      } = req.query;

      const parsedPriceRange = typeof priceRange === "string" ? priceRange.split(",").map(Number) : [1, 10000];

      const parsedPage = Number(page);
      const parsedLimit = Number(limit);

      const skip = (parsedPage - 1) * parsedLimit;

      const filters: Record<string, any> = {
         sale_price: {
            gte: parsedPriceRange[0],
            lte: parsedPriceRange[1],
         },
         NOT:{
            starting_date: null
         },
      };

      if(categories && (categories as string).length > 0) {
         filters.category = { in: Array.isArray(categories) ? categories : (categories as string).split(",") };
      }

      if(colors && (colors as string).length > 0) {
         filters.colors = { hasSome: Array.isArray(colors) ? colors : [colors] };
      }

      if(sizes && (sizes as string).length > 0) {
         filters.sizes = { hasSome: Array.isArray(sizes) ? sizes : [sizes] };
      }

      const [products, total] = await Promise.all([
         prisma.products.findMany({
            where: filters,
            skip,
            take: parsedLimit,
            include: {
               images: true,
               Shop: true,
            },
         }),
         prisma.products.count({
            where: filters,
         }),
      ]);

      const totalPages = Math.ceil(total / parsedLimit);

      res.status(200).json({
         products,
         pagination: {
            total,
            page: parsedPage,
            totalPages,
         },
      });
   }
   catch (error) {
      next(error);
   }
};

//get filtered shops
export const getFilteredShops = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const {
         categories = [],
         countries = [],
         page = 1,
         limit = 12,
      } = req.query;

      const parsedPage = Number(page);
      const parsedLimit = Number(limit);
      const skip = (parsedPage - 1) * parsedLimit;

      const filters: Record<string, any> = {};

      if(categories && (categories as string).length > 0) {
         filters.category = { in: Array.isArray(categories) ? categories : (categories as string).split(",") };
      }

      if(countries && (countries as string).length > 0) {
         filters.country = { in: Array.isArray(countries) ? countries : (countries as string).split(",") };
      }

      const [shops, total] = await Promise.all([
         prisma.shops.findMany({
            where: filters,
            skip,
            take: parsedLimit,
            include: {
               sellers: true,
               avatar: true,
               followers: true,
               products: true,
            },
         }),
         prisma.shops.count({
            where: filters,
         }),
      ]);

      const totalPages = Math.ceil(total / parsedLimit);

      res.status(200).json({
         shops,
         pagination: {
            total,
            page: parsedPage,
            totalPages,
         },
      });
   }
   catch (error) {
      next(error);
   }
};

//search products
export const searchProducts = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const query = req.query.q as string;

      if(!query || query.trim() === "") {
         return res.status(400).json({ message: "Search query cannot be empty." });
      }

      const products = await prisma.products.findMany({
         where: {
            OR: [
               { title: { contains: query, mode: "insensitive" } },
               { short_description: { contains: query, mode: "insensitive" } },
            ],
         },
         select: {
            id: true,
            title: true,
            slug: true,
         },
         take: 10,
         orderBy: {
            createdAt: "desc",
         },
      });

      return res.status(200).json({products});
   }catch (error) {
      return next(error);
   }
};  

//top 
export const topShops = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const topShopsData = await prisma.orders.groupBy({
         by: ['shopId'],
         _sum: {
            total : true,
         },
         orderBy: {
            _sum: {
               total: 'desc',
            },
         },
         take: 10,
      });
      const shopIds = topShopsData
         .map((shop) => shop.shopId)
         .filter((id): id is string => id !== null);
      const shops = await prisma.shops.findMany({
         where: {
            id: { in: shopIds },
         },
         select: {
            id: true,
            name: true,
            avatar: true,
            coverBanner: true,
            address: true,
            ratings: true,
            followers: true,
            category: true,
         },
      });
      
      const enrichedShops = shops.map((shop) => {
         const salesData = topShopsData.find((s) => s.shopId === shop.id);
         return {
            ...shop,
            totalSales: salesData?._sum.total || 0,
         };
      });

      const top10Shops = enrichedShops.sort((a, b) => b.totalSales - a.totalSales).slice(0, 10);

      res.status(200).json({shops: top10Shops });
   }
   catch (error) {
      return next(error);
   }
};

//follow a shop
export const followShop = async (req: any, res: Response, next: NextFunction) => {
   try {
      const { shopId } = req.body;
      const userId = req.user?.id;

      if (!userId) {
         return next(new ValidationError("You must be logged in to follow a shop."));
      }
      if (!shopId) {
         return next(new ValidationError("shopId is required."));
      }

      const shop = await prisma.shops.findUnique({ where: { id: shopId } });
      if (!shop) {
         return next(new Error("Shop not found."));
      }

       const existing = await prisma.followers.findUnique({
        where: {
           userId_shopsId: { userId, shopsId: shopId },
        },
     });

     if (existing) {
        return res.status(200).json({ success: true, message: "Already following this shop." });
     }

     await prisma.followers.create({
        data: { userId, shopsId: shopId },
     });

      return res.status(200).json({ success: true, message: "Shop followed successfully." });
   }
   catch (error) {
      return next(error);
   }
};

//unfollow a shop
export const unfollowShop = async (req: any, res: Response, next: NextFunction) => {
   try {
      const { shopId } = req.body;
      const userId = req.user?.id;

      if (!userId) {
         return next(new ValidationError("You must be logged in to unfollow a shop."));
      }
      if (!shopId) {
         return next(new ValidationError("shopId is required."));
      }

       await prisma.followers.deleteMany({
        where: { userId, shopsId: shopId },
     });

      return res.status(200).json({ success: true, message: "Shop unfollowed successfully." });
   }
   catch (error) {
      return next(error);
   }
};

//get logged in seller events
export const getShopEvents = async (req: any, res: Response, next: NextFunction) => {
   try {
      const events = await prisma.products.findMany({
         where: {
            shopId: req?.seller?.shop?.id,
            AND: [
               { starting_date: { not: null } },
               { ending_date: { not: null } },
            ],
         },
         include: {
            images: true,
         },
         orderBy: { createdAt: "desc" },
      });

      res.status(200).json({
         success: true,
         events,
      });
   }
   catch (error) {
      return next(error);
   }
};

//get single product for the logged-in seller (for view + edit pages)
export const getSellerProductById = async (req: any, res: Response, next: NextFunction) => {
   try {
      const { productId } = req.params;
      const sellerShopId = req.seller?.shop?.id;

      const product = await prisma.products.findUnique({
         where: { id: productId },
         include: { images: true },
      });

      if (!product) {
         return next(new Error("Product not found."));
      }

      if (product.shopId !== sellerShopId) {
         return next(new Error("You are not authorized to view this product."));
      }

      res.status(200).json({ success: true, product });
   }
   catch (error) {
      return next(error);
   }
};

//update product
export const updateProduct = async (req: any, res: Response, next: NextFunction) => {
   try {
      const { productId } = req.params;
      const sellerShopId = req.seller?.shop?.id;

      const existingProduct = await prisma.products.findUnique({
         where: { id: productId },
         select: { id: true, shopId: true, slug: true },
      });

      if (!existingProduct) {
         return next(new Error("Product not found."));
      }

      if (existingProduct.shopId !== sellerShopId) {
         return next(new Error("You are not authorized to update this product."));
      }

      const {
         title,
         short_description,
         detailed_description,
         warranty,
         custom_specifications,
         slug,
         tags,
         cashOnDelivery,
         brand,
         video_url,
         category,
         colors,
         sizes,
         discountCodes,
         stock,
         sale_price,
         regular_price,
         subCategory,
         customProperties,
         images,
         starting_date,
         ending_date,
      } = req.body;

      // if slug is being changed, make sure it isn't already taken by a different product
      if (slug && slug !== existingProduct.slug) {
         const slugTaken = await prisma.products.findUnique({ where: { slug } });
         if (slugTaken) {
            return next(new ValidationError("Slug already exists."));
         }
      }

      const updatedProduct = await prisma.products.update({
         where: { id: productId },
         data: {
            ...(title !== undefined && { title }),
            ...(short_description !== undefined && { short_description }),
            ...(detailed_description !== undefined && { detailed_description }),
            ...(warranty !== undefined && { warranty }),
            ...(cashOnDelivery !== undefined && { cashOnDelivery }),
            ...(slug !== undefined && { slug }),
            ...(tags !== undefined && {
               tags: Array.isArray(tags) ? tags : tags.split(","),
            }),
            ...(brand !== undefined && { brand }),
            ...(video_url !== undefined && { video_url }),
            ...(category !== undefined && { category }),
            ...(subCategory !== undefined && { subCategory }),
            ...(colors !== undefined && { colors }),
            ...(discountCodes !== undefined && {
               discount_codes: discountCodes.map((codeId: string) => codeId),
            }),
            ...(sizes !== undefined && { sizes }),
            ...(stock !== undefined && { stock: parseInt(stock) }),
            ...(sale_price !== undefined && { sale_price: parseFloat(sale_price) }),
            ...(regular_price !== undefined && { regular_price: parseFloat(regular_price) }),
            ...(customProperties !== undefined && { customProperties }),
            ...(custom_specifications !== undefined && { custom_specifications }),
            ...(starting_date !== undefined && {
               starting_date: starting_date ? new Date(starting_date) : null,
            }),
            ...(ending_date !== undefined && {
               ending_date: ending_date ? new Date(ending_date) : null,
            }),
            ...(images !== undefined && {
               images: {
                  deleteMany: {}, // clear existing image records, replace with the new set
                  create: images
                     .filter((img: any) => img && img.file_url && img.fileId)
                     .map((img: any) => ({
                        url: img.file_url,
                        file_id: img.fileId,
                     })),
               },
            }),
         },
         include: { images: true },
      });

      res.status(200).json({ success: true, product: updatedProduct });
   }
   catch (error) {
      return next(error);
   }
};

//get shop details by id (public)
export const getShopDetails = async (req: any, res: Response, next: NextFunction) => {
   try {
      const { id } = req.params;

      const shop = await prisma.shops.findUnique({
         where: { id },
         include: {
            avatar: true,
            followers: true,
         },
      });

      if (!shop) {
         return next(new Error("Shop not found."));
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
               user: { select: { id: true, name: true, avatar: true } },
            },
            orderBy: { createdAt: "desc" },
         }),
      ]);

      const userId = req.user?.id;
      const isFollowing = userId
         ? shop.followers.some((f) => f.userId === userId)
         : false;

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
            isFollowing,
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