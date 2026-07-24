//Path: packages/middleware/isOptionalAuth.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../libs/prisma";

const isOptionalAuth = async (req: any, res: Response, next: NextFunction) => {
   try {
      const token =
         req.cookies["access_token"] ||
         req.cookies["seller_access_token"] ||
         req.headers.authorization?.split(" ")[1];

      if (!token) {
         return next();
      }

      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as {
         id: string;
         role: string;
      };

      if (decoded?.role === "user") {
         const account = await prisma.users.findUnique({ where: { id: decoded.id } });
         req.user = account || undefined;
      }

      return next();
   }
   catch (error) {
      // invalid/expired token — proceed as a logged-out visitor rather than blocking
      return next();
   }
};

export default isOptionalAuth;