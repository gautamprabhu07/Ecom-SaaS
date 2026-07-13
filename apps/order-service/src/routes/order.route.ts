//Path: apps/order-service/src/routes/order.route.ts
import express, {Router} from 'express';
import { createPayment, createPaymentSession, verifyPaymentSession, getSellerOrders, getOrderDetails, updateDeliveryStatus, verifyCouponCode, getUserOrders } from '../controllers/order.controller';
import isAuthenticated  from '@packages/middleware/isAuthenticated';
import { isSeller } from '@packages/middleware/authorizeRoles';

const router:Router = express.Router();

router.post("/create-payment-intent", isAuthenticated, createPayment);
router.post("/create-payment-session", isAuthenticated, createPaymentSession);
router.get("/verify-payment-session", isAuthenticated, verifyPaymentSession);
router.get("/get-seller-orders", isAuthenticated,isSeller,  getSellerOrders);
router.get("/get-order-details/:id", isAuthenticated, getOrderDetails);
router.put("/update-status/:id", isAuthenticated, isSeller, updateDeliveryStatus);
router.post("/verify-coupon", isAuthenticated, verifyCouponCode);
router.get("/get-user-orders", isAuthenticated, getUserOrders);
export default router;