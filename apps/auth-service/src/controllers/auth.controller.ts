//Path: apps/auth-service/src/controllers/auth.controller.ts
import {NextFunction, Request, Response } from "express";
import {handleforgotPassword, validateRegistrationData, verifyForgotPasswordOtp} from "../utils/auth.helper";
import prisma from "@packages/libs/prisma";
import { AuthError, ValidationError } from "@packages/error-handler";
import { checkOtpRestrictions, sendOtp, trackOtpRequest, verifyOtp } from "../utils/auth.helper";
import bcrypt from "bcryptjs";
import jwt, { JsonWebTokenError } from "jsonwebtoken";
import { setCookie } from "../utils/cookies/setCookie";
import Stripe from "stripe";
import { sendLog } from "@packages/utils/logs/index";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
   apiVersion: "2026-06-24.dahlia",
});

export const userRegistration = async (req: Request, res: Response, next: NextFunction) => {
   
   try {
      validateRegistrationData(req.body, "user");
   const {name, email} = req.body;

   const existingUser = await prisma.users.findUnique({where: {email}});

   if(existingUser) {
      return next(new ValidationError("User with this email already exists"));
   }


await checkOtpRestrictions(email, next);

await trackOtpRequest(email, next);

await sendOtp(name, email, "user-activation-mail");

res.status(200).json({message: "OTP sent to your email for verification. Please check your inbox."});
   }
   catch (error) {
      return next(error);
   }



};

//verify user with otp
export const verifyUser = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const {email, otp, password, name} = req.body;
      if(!email || !otp || !password || !name) {
         return next(new ValidationError("Missing required fields for verification"));
      }
      const existingUser = await prisma.users.findUnique({where: {email}});

      if(existingUser) {
         return next(new ValidationError("User with this email already exists"));
      }

      await verifyOtp(email, otp, next);
      const hashedPassword = await bcrypt.hash(password, 10);

      await prisma.users.create({
         data: {
            name,email,password: hashedPassword
         }
      });

      res.status(201).json({
         success: true,
         message: "User verified and registered successfully"});
   }
   catch (error) {
      return next(error);
   }
};

export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const {email, password} = req.body;
      if(!email || !password) {
         return next(new ValidationError("Missing required fields for login"));
      }
      const user = await prisma.users.findUnique({where: {email}});

      if(!user) {
         return next(new AuthError("User with this email does not exist"));
      }

      const isMatch = await bcrypt.compare(password, user.password!);

      if(!isMatch) {
         return next(new AuthError("Invalid password"));
      }

      res.clearCookie("seller_access_token");
      res.clearCookie("seller_refresh_token");

      const accessToken=jwt.sign({id: user.id, role:"user"}, process.env.ACCESS_TOKEN_SECRET as string, {expiresIn: "15m"});

      const refreshToken=jwt.sign({id: user.id, role:"user"}, process.env.REFRESH_TOKEN_SECRET as string, {expiresIn: "7d"});

      setCookie(res, "refresh_token", refreshToken);
      setCookie(res, "access_token", accessToken);

      res.status(200).json({
         message: "User logged in successfully",
         user: {id: user.id, name: user.name, email: user.email}
      });
   }
   catch (error) {
      return next(error);
   }
};

//refresh token user
export const refreshToken = async (req: any, res: Response, next: NextFunction) => {
   try {
      const refreshToken = req.cookies["refresh_token"] || 
      req.cookies["seller_refresh_token"]
      || req.headers.authorization?.split(" ")[1];
      if(!refreshToken) {
         return new ValidationError("Refresh token not found");
      }

      const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET as string) as {id: string, role: string};

      if(!decoded || !decoded.id || !decoded.role) { return new JsonWebTokenError("Invalid refresh token"); }

      let account;
      if(decoded.role === "user") {
         account = await prisma.users.findUnique({where: {id: decoded.id}});
      }
      else if(decoded.role === "seller") {
         account = await prisma.sellers.findUnique({where: {id: decoded.id},
            include: {
               shop: true,
            }});
      }

      if(!account) {
         return new AuthError("User not found");
      }

      const newAccessToken=jwt.sign({id: decoded.id, role:decoded.role}, process.env.ACCESS_TOKEN_SECRET as string, {expiresIn: "15m"});

      if(decoded.role === "user") {
         setCookie(res, "access_token", newAccessToken);
      }else if(decoded.role === "seller") {
         setCookie(res, "seller_access_token", newAccessToken);
      }

      req.role = decoded.role;
      return res.status(200).json({success:true, message: "Access token refreshed successfully"});

   }
   catch (error) {
      return next(error);
   }
};

//get logged in user details
export const getUser = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const user=req.user;
      res.status(200).json({success:true, user});
   }
   catch (error) {
      return next(error);
   }
};


//user forgot password
export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
   const {email} = req.body;
   await handleforgotPassword(req, res, next, "user");
};

//verify forgot password otp
export const verifyUserForgotPassword = async (req: Request, res: Response, next: NextFunction) => {
   await verifyForgotPasswordOtp(req, res, next);
};

//reset user password
export const resetUserPassword = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const{email, newPassword} = req.body;

      if(!email || !newPassword) {
         return next(new ValidationError("Email and new password are required for password reset"));
      }
      const user = await prisma.users.findUnique({where: {email}});

      if(!user) {
         return next(new ValidationError("User with this email does not exist"));
      }

      //compare new password with old password
      const isSamePassword = await bcrypt.compare(newPassword, user.password!);

      if(isSamePassword) {
         return next(new ValidationError("New password cannot be the same as the old password"));
      }

      //hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await prisma.users.update({
         where: {email},
         data: {password: hashedPassword}
      });

      res.status(200).json({message: "Password reset successfully"});
   }
   catch (error) {
      next(error);
   }
};

//register a new seller
export const registerSeller = async (req: Request, res: Response, next: NextFunction) => {
   try {
      validateRegistrationData(req.body, "seller");
      const {name, email} = req.body;

      const existingSeller = await prisma.sellers.findUnique({where:{email}});

      if(existingSeller) {
         throw new ValidationError("Seller with this email already exists");
      }

      await checkOtpRestrictions(email, next);

      await trackOtpRequest(email, next);
      await sendOtp(name, email, "seller-activation");
      res.status(200).json({message: "OTP sent to your email for verification. Please check your inbox."});
   }
   catch (error) {
      next(error);
   }
};

//verify seller with otp
export const verifySeller = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const {email, otp, password, name, phone_number, country} = req.body;

      if(!email || !otp || !password || !name || !phone_number || !country) {
         return next(new ValidationError("Missing required fields for verification"));
      }

      const existingSeller = await prisma.sellers.findUnique({where: {email}});

      if(existingSeller) {
         return next(new ValidationError("Seller with this email already exists"));
      }

      await verifyOtp(email, otp, next);
      const hashedPassword = await bcrypt.hash(password, 10);

      const seller = await prisma.sellers.create({
         data: {
            name,email, phone_number, country,password: hashedPassword
         }
      });

      res.status(201).json({
         seller,
         message: "Seller verified and registered successfully",
      });
   }
   catch (error) {
      next(error);
   }
};

//create a new shop
export const createShop = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const {name, bio, address, opening_hours, website, category, sellerId} = req.body;

      if(!name || !bio || !address || !opening_hours || !website || !category || !sellerId) {
         return next(new ValidationError("Missing required fields for shop creation"));
      }

      const shopData:any={
         name, bio, address, opening_hours, website, category, sellerId
      };

      if(website && website.trim() !== "") {
         shopData.website = website;
      }

      const shop = await prisma.shops.create({
         data: shopData
      });

      res.status(201).json({
         sucess:true,
         shop,
      });
   }
   catch (error) {
      next(error);
   }
};


//create stripe connect account link
export const createStripeConnectLink = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const {sellerId} = req.body;
      if(!sellerId) {
         return next(new ValidationError("Missing required field: sellerId"));
      }

      const seller = await prisma.sellers.findUnique({where: {id: sellerId}});

      if(!seller) {
         return next(new ValidationError("Seller not found"));
      }

      const account = await stripe.accounts.create({
         type: "express",
         country: "US",
         email: seller?.email,
         capabilities: {
            card_payments: {requested: true},
            transfers: {requested: true},
         },
      });

      await prisma.sellers.update({
         where: {id: sellerId},
         data: {stripeId: account.id}
      });

      const accountLink = await stripe.accountLinks.create({
         account: account.id,
         refresh_url: `http://localhost:3000/pending`,
         return_url: `http://localhost:3000/success`,
         type: "account_onboarding",
      });

      res.json({
         url: accountLink.url,
      });
   }
   catch (error) {
      return next(error);
   }
}; 

//login seller
export const loginSeller = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const {email, password} = req.body;

      if(!email || !password) {
         return next(new ValidationError("Missing required fields for login"));
      }

      const seller = await prisma.sellers.findUnique({where: {email}});

      if(!seller) {
         return next(new AuthError("Seller with this email does not exist"));
      }

      const isMatch= await bcrypt.compare(password, seller.password!);

      if(!isMatch) {
         return next(new AuthError("Invalid password"));
      }

      res.clearCookie("access_token");
      res.clearCookie("refresh_token");

      const accessToken=jwt.sign({id: seller.id, role:"seller"}, process.env.ACCESS_TOKEN_SECRET as string, {expiresIn: "15m"});

      const refreshToken=jwt.sign({id: seller.id, role:"seller"}, process.env.REFRESH_TOKEN_SECRET as string, {expiresIn: "7d"});

      setCookie(res, "seller_refresh_token", refreshToken);
      setCookie(res, "seller_access_token", accessToken);

      res.status(200).json({
         message: "Seller logged in successfully",
         seller: {id: seller.id, name: seller.name, email: seller.email}
      });
   }
   catch (error) {
      next(error);
   }
};

//get logged in seller details
export const getSeller = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const seller=req.seller;
      res.status(200).json({success:true, seller});
   }
   catch (error) {
      next(error);
   }
};

//add new address
export const addUserAddress = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const userId = req.user?.id;
      if (!userId) {
         return next(new ValidationError("You must be logged in to add an address."));
      }
      const {label, name, street, city, zip, country, isDefault} = req.body;

      if(!label || !name || !street || !city || !zip || !country) {
         return next(new ValidationError("Missing required fields for adding address"));
      }

      if(isDefault === true) {
         await prisma.address.updateMany({
            where: { userId, isDefault: true },
            data: { isDefault: false },
         });
      }

      const newAddress = await prisma.address.create({
         data: {
            userId,
            label,
            name,
            street,
            city,
            zip,
            country,
            isDefault,
         }
      });

      res.status(201).json({success:true, message: "Address added successfully", address: newAddress});
   }
   catch (error) {
      return next(error);
   }
};

//delete user address
export const deleteUserAddress = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const userId = req.user?.id;
      if (!userId) {
         return next(new ValidationError("You must be logged in to delete an address."));
      }

      const addressId = req.params.addressId as string;

      if(!addressId) {
         return next(new ValidationError("Missing required field: addressId"));
      }

      const existingAddress = await prisma.address.findFirst({
         where: {id: addressId, userId}
      });

      if(!existingAddress) {
         return next(new ValidationError("Address not found"));
      }

      await prisma.address.delete({
         where: {id: addressId}
      });

      res.status(200).json({success:true, message: "Address deleted successfully"});
   }
   catch (error) {
      return next(error);
   }
};

//get user addresses
export const getUserAddresses = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const userId = req.user?.id;
      if (!userId) {
         return next(new ValidationError("You must be logged in to view addresses."));
      }

      const addresses = await prisma.address.findMany({
         where: {userId},
         orderBy: {createdAt: "desc"}
      });

      res.status(200).json({success:true, addresses});
   }
   catch (error) {
      return next(error);
   }
};

//update user password
export const updateUserPassword = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const userId = req.user?.id;
      const {currentPassword, newPassword, confirmPassword} = req.body;

      if(!currentPassword || !newPassword || !confirmPassword) {
         return next(new ValidationError("Missing required fields for password update"));
      }

      if(newPassword !== confirmPassword) {
         return next(new ValidationError("New password and confirm password do not match"));
      }

      if(currentPassword === newPassword) {
         return next(new ValidationError("New password cannot be the same as the current password"));
      }

      const user = await prisma.users.findUnique({where: {id: userId}});

      if(!user || !user.password) {
         return next(new AuthError("User not found"));
      }

      const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
      if(!isPasswordCorrect) {
         return next(new AuthError("Current password is incorrect"));
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 12);

      await prisma.users.update({
         where: {id: userId},
         data: {password: hashedNewPassword}
      });

      res.status(200).json({success:true, message: "Password updated successfully"});
   }
   catch (error) {
      return next(error);
   }
};

//login admin
export const loginAdmin = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const {email, password} = req.body;

      if(!email || !password) {
         return next(new ValidationError("Missing required fields for login"));
      }

      const user = await prisma.users.findUnique({where: {email}});

      if(!user) {
         return next(new AuthError("Admin with this email does not exist"));
      }

      const isMatch = await bcrypt.compare(password, user.password!);

      if(!isMatch) {
         return next(new AuthError("Invalid password"));
      }

      const isAdmin = user.role === "admin";

      if(!isAdmin) {
         sendLog({
            type: "error",
            message: `Unauthorized admin login attempt for email: ${email}`,
            source: "auth-service",
         });
         return next(new AuthError("You are not authorized to access this resource"));
      }

      sendLog({
         type: "success",
         message: `Admin logged in successfully for email: ${email}`,
         source: "auth-service",
      })

      res.clearCookie("seller_access_token");
      res.clearCookie("seller_refresh_token");
      
      const accessToken=jwt.sign({id: user.id, role:"admin"}, process.env.ACCESS_TOKEN_SECRET as string, {expiresIn: "15m"});

      const refreshToken=jwt.sign({id: user.id, role:"admin"}, process.env.REFRESH_TOKEN_SECRET as string, {expiresIn: "7d"});

      setCookie(res, "refresh_token", refreshToken);
      setCookie(res, "access_token", accessToken);

      res.status(200).json({
         message: "Admin logged in successfully",
         user: {id: user.id, name: user.name, email: user.email}
      });
   }
   catch (error) {
      return next(error);
   }
};
      
//get logged in admin details
export const getAdmin = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const user = req.user;
      res.status(200).json({success: true, user});
   }
   catch (error) {
      return next(error);
   }
};