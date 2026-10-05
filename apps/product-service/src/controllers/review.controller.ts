//Path: apps/product-service/src/controllers/review.controller.ts
//shop reviews: only a user who has bought from the shop may review it, once. The shop's average lives on shops.ratings.
import { NextFunction, Request, Response } from "express";
import prisma from "@packages/libs/prisma";
import { ForbiddenError, NotFoundError, ValidationError } from "@packages/error-handler";

const requireUser = (req: any): string => {
  if (!req.user?.id) throw new ForbiddenError("Only customers can review shops.");
  return req.user.id;
};

const requireShopId = (req: Request): string => {
  const id = String(req.params.shopId ?? "");
  if (!/^[0-9a-f]{24}$/i.test(id)) throw new ValidationError("Invalid shop id.");
  return id;
};

const parseReview = (body: any): { rating: number; text: string } => {
  const rating = Number(body?.rating);
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new ValidationError("Rating must be a whole number from 1 to 5.");
  if (text.length < 10 || text.length > 1000) throw new ValidationError("Review text must be 10 to 1000 characters.");
  return { rating, text };
};

//recompute from the reviews themselves, so the stored average can never drift
const refreshShopRating = async (shopId: string) => {
  const { _avg } = await prisma.shopReviews.aggregate({ where: { shopsId: shopId }, _avg: { rating: true } });
  const average = Math.round((_avg.rating ?? 0) * 10) / 10;
  await prisma.shops.update({ where: { id: shopId }, data: { ratings: average } });
  return average;
};

const hasBoughtFrom = async (userId: string, shopId: string) =>
  (await prisma.orders.count({ where: { userId, shopId, status: "Paid" } })) > 0;

export const createReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = requireUser(req);
    const shopId = requireShopId(req);
    const { rating, text } = parseReview(req.body);

    const shop = await prisma.shops.findUnique({ where: { id: shopId }, select: { id: true, name: true, sellerId: true } });
    if (!shop) throw new NotFoundError("Shop not found.");
    if (!(await hasBoughtFrom(userId, shopId))) throw new ForbiddenError("You can only review shops you have ordered from.");

    //the schema has no unique (user, shop) pair, so check first
    const existing = await prisma.shopReviews.findFirst({ where: { userId, shopsId: shopId }, select: { id: true } });
    if (existing) throw new ValidationError("You have already reviewed this shop. Edit your review instead.");

    const review = await prisma.shopReviews.create({ data: { userId, shopsId: shopId, rating, reviews: text } });
    const average = await refreshShopRating(shopId);

    //tell the seller; a failed notification must never fail the review
    try {
      await prisma.notifications.create({
        data: {
          title: "New Review Received",
          message: `${req.user?.name ?? "A customer"} left a ${rating}-star review on ${shop.name}.`,
          creatorId: userId,
          recieverId: shop.sellerId,
          redirect_link: "/dashboard",
        },
      });
    } catch (err) {
      console.error("Review notification failed:", err);
    }

    res.status(201).json({ success: true, review, average });
  } catch (err) {
    next(err);
  }
};

export const updateReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = requireUser(req);
    const shopId = requireShopId(req);
    const { rating, text } = parseReview(req.body);
    const existing = await prisma.shopReviews.findFirst({ where: { userId, shopsId: shopId }, select: { id: true } });
    if (!existing) throw new NotFoundError("You haven't reviewed this shop yet.");
    const review = await prisma.shopReviews.update({ where: { id: existing.id }, data: { rating, reviews: text } });
    const average = await refreshShopRating(shopId);
    res.status(200).json({ success: true, review, average });
  } catch (err) {
    next(err);
  }
};

export const deleteReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = requireUser(req);
    const shopId = requireShopId(req);
    const existing = await prisma.shopReviews.findFirst({ where: { userId, shopsId: shopId }, select: { id: true } });
    if (!existing) throw new NotFoundError("You haven't reviewed this shop yet.");
    await prisma.shopReviews.delete({ where: { id: existing.id } });
    const average = await refreshShopRating(shopId);
    res.status(200).json({ success: true, average });
  } catch (err) {
    next(err);
  }
};

//public; if the caller is signed in, also says whether they may review and what their own review is
export const getShopReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const shopId = requireShopId(req);
    const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? "10"), 10) || 10));

    const [reviews, total, grouped, aggregate] = await Promise.all([
      prisma.shopReviews.findMany({
        where: { shopsId: shopId },
        include: { user: { select: { id: true, name: true, avatar: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.shopReviews.count({ where: { shopsId: shopId } }),
      prisma.shopReviews.groupBy({ by: ["rating"], where: { shopsId: shopId }, _count: { _all: true } }),
      prisma.shopReviews.aggregate({ where: { shopsId: shopId }, _avg: { rating: true } }),
    ]);

    const distribution: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
    for (const g of grouped) distribution[String(Math.round(g.rating))] = g._count._all;

    const userId = (req as any).user?.id as string | undefined;
    let viewer = { canReview: false, myReview: null as any };
    if (userId) {
      const mine = await prisma.shopReviews.findFirst({ where: { userId, shopsId: shopId } });
      viewer = { myReview: mine, canReview: !mine && (await hasBoughtFrom(userId, shopId)) };
    }

    res.status(200).json({
      success: true,
      reviews,
      pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
      average: Math.round((aggregate._avg.rating ?? 0) * 10) / 10,
      distribution,
      viewer,
    });
  } catch (err) {
    next(err);
  }
};
