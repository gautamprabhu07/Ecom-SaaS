import express, {Router} from "express";
import { loginUser, userRegistration, verifyUser, verifyUserForgotPassword, resetUserPassword, forgotPassword } from "../controllers/auth.controller";

const router: Router = express.Router();

router.post("/user-registration", userRegistration);
router.post("/verify-user", verifyUser);
router.post("/login-user", loginUser);
router.post("/forgot-password-user", forgotPassword);
router.post("/reset-password-user", resetUserPassword);
router.post("/verify-forgot-password-user", verifyUserForgotPassword);


export default router;
