//Path: apps/recommendation-service/src/routes/reccomendation.routes.ts
import express, { Router } from "express";
import { getRecommendedProducts } from "../controllers/reccomendation-controller";
import isAuthenticated from "@packages/middleware/isAuthenticated";

const router: Router = express.Router();

router.get("/get-recommendations", isAuthenticated, getRecommendedProducts);

export default router;