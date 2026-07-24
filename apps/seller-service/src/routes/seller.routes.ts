//Path: apps/seller-service/src/routes/seller.routes.ts
import express, { Router } from "express";
import {
   getSellerProfile,
   updateShopProfile,
   updateShopAvatar,
   updateShopCover,
} from "../controllers/seller.controller";
import isAuthenticated from "@packages/middleware/isAuthenticated";
import { isSeller } from "@packages/middleware/authorizeRoles";

const router: Router = express.Router();

router.get("/get-seller-profile", isAuthenticated, isSeller, getSellerProfile);
router.put("/update-shop-profile", isAuthenticated, isSeller, updateShopProfile);
router.post("/update-shop-avatar", isAuthenticated, isSeller, updateShopAvatar);
router.post("/update-shop-cover", isAuthenticated, isSeller, updateShopCover);

export default router;