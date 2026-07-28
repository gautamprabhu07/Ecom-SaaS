//Path: apps/recommendation-service/src/controllers/reccomendation-controller.ts
import { Request, Response, NextFunction } from "express";
import { ValidationError } from "@packages/error-handler";
import { generateRecommendations, getCachedRecommendations } from "../services/reccomendationService";

export const getRecommendedProducts = async (req: any, res: Response, next: NextFunction) => {
   try {
      const userId = req.user?.id;
      if (!userId) {
         return next(new ValidationError("You must be logged in to get recommendations."));
      }

      const limit = parseInt(req.query.limit as string) || 10;

      //prefer the cached snapshot written by the retrain cron job; only compute on-demand
      //when nothing has been cached for this user yet (e.g. brand new user)
      const cached = await getCachedRecommendations(userId, limit);
      const products = cached ?? (await generateRecommendations(userId, limit));

      return res.status(200).json({
         success: true,
         products,
      });
   }
   catch (error) {
      return next(error);
   }
};