import express, {Router} from "express";
import { loginUser, userRegistration, verifyUser, verifyUserForgotPassword,refreshTokenUser, resetUserPassword, forgotPassword, getUser, registerSeller, verifySeller, createShop, createStripeConnectLink, loginSeller, getSeller } from "../controllers/auth.controller";
import isAuthenticated from "@packages/middleware/isAuthenticated";
import { isSeller } from "@packages/middleware/authorizeRoles";

const router: Router = express.Router();

router.post("/user-registration", userRegistration);
router.post("/verify-user", verifyUser);
router.post("/login-user", loginUser);
router.post("/refresh-token-user", refreshTokenUser);
router.get("/logged-in-user",isAuthenticated, getUser);
router.post("/forgot-password-user", forgotPassword);
router.post("/reset-password-user", resetUserPassword);
router.post("/verify-forgot-password-user", verifyUserForgotPassword);
router.post("/seller-registration", registerSeller);
router.post("/verify-seller", verifySeller);
router.post("/create-shop", isAuthenticated, isSeller, createShop);
router.post("/create-stripe-link",createStripeConnectLink);
router.post("/login-seller", loginSeller);
router.get("/logged-in-seller",isAuthenticated, isSeller,  getSeller);


export default router;
