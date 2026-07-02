import { Request, Response, NextFunction } from "express";
import { AuthError } from "@packages/error-handler";

export const isSeller = (req: Request, res: Response, next: NextFunction) => {
  if (req.role !== "seller") {
    return next(new AuthError("Access denied. Only sellers are allowed."));
  }
};

export const isUser = (req: Request, res: Response, next: NextFunction) => {
  if (req.role !== "user") {
    return next(new AuthError("Access denied. Only users are allowed."));
  }   
};

