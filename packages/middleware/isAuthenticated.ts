import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "@packages/libs/prisma";

const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const token = req.cookies.access_Token || req.headers.authorization?.split(" ")[1];

      if (!token) {
         return res.status(401).json({ message: "Access token not found" });
      }

      // Verify the token
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as { id: string, role: "user"|"seller" };

      if (!decoded) {
         return res.status(401).json({ message: "Invalid access token" });
      }

      const account = await prisma.users.findUnique({ where: { id: decoded.id } });

      

      if (!account) {
         return res.status(401).json({ message: "User not found" });
      }
      
      return next();

   }
   catch (error) {
      return res.status(401).json({ message: "Authentication failed"});
   }
};

export default isAuthenticated;