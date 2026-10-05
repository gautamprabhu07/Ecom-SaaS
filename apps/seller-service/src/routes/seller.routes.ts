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
import { createAnalyticsHandlers, ownShopScope } from "@packages/libs/analytics/handlers";

const router: Router = express.Router();

router.get("/get-seller-profile", isAuthenticated, isSeller, getSellerProfile);
router.put("/update-shop-profile", isAuthenticated, isSeller, updateShopProfile);
router.post("/update-shop-avatar", isAuthenticated, isSeller, updateShopAvatar);
router.post("/update-shop-cover", isAuthenticated, isSeller, updateShopCover);

//dashboard analytics, always scoped to the authenticated seller's own shop (see ownShopScope)
const analytics = createAnalyticsHandlers(ownShopScope);
router.get("/analytics/summary", isAuthenticated, isSeller, analytics.summary);
router.get("/analytics/revenue", isAuthenticated, isSeller, analytics.revenue);
router.get("/analytics/devices", isAuthenticated, isSeller, analytics.devices);
router.get("/analytics/geography", isAuthenticated, isSeller, analytics.geography);
router.get("/analytics/funnel", isAuthenticated, isSeller, analytics.funnel);
router.get("/analytics/top-products", isAuthenticated, isSeller, analytics.topProducts);
router.get("/analytics/recent-orders", isAuthenticated, isSeller, analytics.recentOrders);

export default router;