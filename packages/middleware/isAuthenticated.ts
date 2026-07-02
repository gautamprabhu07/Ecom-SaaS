import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "@packages/libs/prisma";

const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
   try {
      console.log("Cookies:", req.cookies);
console.log("Authorization:", req.headers.authorization);

      const token = req.cookies["access_token"] || 
      req.cookies["seller_access_token"]
      || req.headers.authorization?.split(" ")[1];

      

      if (!token) {
         return res.status(401).json({ message: "Access token not found" });
      }

      // Verify the token
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as { id: string, role: "user"|"seller" };

      if (!decoded) {
         return res.status(401).json({ message: "Invalid access token" });
      }

      let account;
      if(decoded.role === "user") {
         account = await prisma.users.findUnique({
            where: { id: decoded.id },
         });
         req.user = account || undefined;
      }else if(decoded.role === "seller") {
         account = await prisma.sellers.findUnique({
            where: { id: decoded.id },
            include: {
               shop: true,
            },
         });
         req.seller = account || undefined;
      }


      if (!account) {
         return res.status(401).json({ message: "User not found" });
      }

      req.role=decoded.role;

      return next();

   }
   catch (error) {
      return res.status(401).json({ message: "Authentication failed"});
   }
};

export default isAuthenticated;