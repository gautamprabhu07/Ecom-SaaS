//Path: packages/middleware/authorizeRoles.ts
import { Request, Response, NextFunction } from "express";
import { AuthError } from "../error-handler";

export const isSeller = (req: Request, res: Response, next: NextFunction) => {
  if (req.role !== "seller") {
    return next(new AuthError("Access denied. Only sellers are allowed."));
  }
  next();
};

export const isUser = (req: Request, res: Response, next: NextFunction) => {
  if (req.role !== "user") {
    return next(new AuthError("Access denied. Only users are allowed."));
  }   
  next();
};

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.role !== "admin") {
    return next(new AuthError("Access denied. Only admins are allowed."));
  }
  next();
};

