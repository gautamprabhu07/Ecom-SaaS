import { sellers, users } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: users;
      seller?: sellers;
       role?: "user" | "seller";
    }
  }
}

export {};