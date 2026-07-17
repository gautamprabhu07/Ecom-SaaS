//Path: apps/auth-service/src/routes/auth.router.ts
import express, {Router} from "express";
import { loginUser, userRegistration, verifyUser, verifyUserForgotPassword,refreshToken, resetUserPassword, forgotPassword, getUser, registerSeller, verifySeller, createShop, createStripeConnectLink, loginSeller, getSeller, getUserAddresses, addUserAddress, deleteUserAddress, loginAdmin, updateUserPassword, getAdmin } from "../controllers/auth.controller";
import isAuthenticated from "@packages/middleware/isAuthenticated";
import { isSeller, isAdmin } from "@packages/middleware/authorizeRoles";

const router: Router = express.Router();

router.post("/user-registration", userRegistration);
router.post("/verify-user", verifyUser);
router.post("/login-user", loginUser);
router.post("/refresh-token", refreshToken);
router.get("/logged-in-user",isAuthenticated, getUser);
router.post("/forgot-password-user", forgotPassword);
router.post("/reset-password-user", resetUserPassword);
router.post("/verify-forgot-password-user", verifyUserForgotPassword);
router.post("/seller-registration", registerSeller);
router.post("/verify-seller", verifySeller);
router.post("/create-shop", createShop);
router.post("/create-stripe-link",createStripeConnectLink);
router.post("/login-seller", loginSeller);
router.get("/logged-in-seller",isAuthenticated, isSeller, getSeller);
router.get("/shipping-addresses", isAuthenticated, getUserAddresses);
router.post("/add-address", isAuthenticated, addUserAddress);
router.delete("/delete-address/:addressId", isAuthenticated, deleteUserAddress);
router.post("/login-admin", loginAdmin);
router.post("/change-password", isAuthenticated, updateUserPassword);
router.get("/logged-in-admin", isAuthenticated, isAdmin, getAdmin);


export default router;
