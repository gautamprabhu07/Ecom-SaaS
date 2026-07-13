//Path: apps/order-service/src/routes/order.route.ts
import express, {Router} from 'express';
import { createPayment, createPaymentSession, verifyPaymentSession, getSellerOrders, getOrderDetails } from '../controllers/order.controller';
import isAuthenticated  from '@packages/middleware/isAuthenticated';
import { isSeller } from '@packages/middleware/authorizeRoles';

const router:Router = express.Router();

router.post("/create-payment-intent", isAuthenticated, createPayment);
router.post("/create-payment-session", isAuthenticated, createPaymentSession);
router.post("/verify-payment-session", isAuthenticated, verifyPaymentSession);
router.get("/get-seller-orders", isAuthenticated,isSeller,  getSellerOrders);
router.get("/get-order-details/:id", isAuthenticated, getOrderDetails);


export default router;