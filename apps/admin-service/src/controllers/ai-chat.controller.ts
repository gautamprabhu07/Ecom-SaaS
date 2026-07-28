//Path: apps/admin-service/src/controllers/ai-chat.controller.ts
import { Request, Response, NextFunction } from "express";
import { ValidationError } from "@packages/error-handler";
import { askAnalyticsAssistant } from "../services/ai-chat.service";

//admin-facing analytics chatbot: answers questions grounded in shop/user/product analytics
export const chatWithAnalyticsAssistant = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const { message } = req.body;

      if (!message || typeof message !== "string" || !message.trim()) {
         return next(new ValidationError("message is required"));
      }

      const reply = await askAnalyticsAssistant(message.trim());

      return res.status(200).json({
         success: true,
         reply,
      });
   }
   catch (error) {
      return next(error);
   }
};
