import {NextFunction, Request, Response } from "express";
import {handleforgotPassword, validateRegistrationData, verifyForgotPasswordOtp} from "../utils/auth.helper";
import prisma from "@packages/libs/prisma";
import { AuthError, ValidationError } from "@packages/error-handler";
import { checkOtpRestrictions, sendOtp, trackOtpRequest, verifyOtp } from "../utils/auth.helper";
import bcrypt from "bcryptjs";
import jwt, { JsonWebTokenError } from "jsonwebtoken";
import { setCookie } from "../utils/cookies/setCookie";
import Stripe from "stripe";

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

      const accessToken=jwt.sign({id: user.id, role:"user"}, process.env.ACCESS_TOKEN_SECRET as string, {expiresIn: "15m"});

      const refreshToken=jwt.sign({id: user.id, role:"user"}, process.env.REFRESH_TOKEN_SECRET as string, {expiresIn: "7d"});

      setCookie(res, "refresh_Token", refreshToken);
      setCookie(res, "access_Token", accessToken);

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
export const refreshTokenUser = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const refreshToken = req.cookies.refresh_Token;
      if(!refreshToken) {
         return new ValidationError("Refresh token not found");
      }

      const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET as string) as {id: string, role: string};

      if(!decoded || !decoded.id || !decoded.role) { return new JsonWebTokenError("Invalid refresh token"); }

      const user= await prisma.users.findUnique({where: {id: decoded.id}});
      
      if(!user) {
         return next(new AuthError("User not found"));
      }

      const newAccessToken=jwt.sign({id: decoded.id, role:decoded.role}, process.env.ACCESS_TOKEN_SECRET as string, {expiresIn: "15m"});

      setCookie(res, "access_Token", newAccessToken);
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
      return next(error);
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
            name,email,password: hashedPassword, phone_number, country
         }
      });

      res.status(201).json({
         seller,
         message: "Seller verified and registered successfully",
      });
   }
   catch (error) {
      return next(error);
   }
};

//create a new shop
export const createShop = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const {name, bio, address, opening_hours, website, category, sellerId} = req.body;

      if(!name || !bio || !address || !opening_hours || !website || !category || !sellerId) {
         return next(new ValidationError("Missing required fields for shop creation"));
      }

      const shopData={
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
         message: "Shop created successfully",
      });
   }
   catch (error) {
      return next(error);
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
         country: "IN",
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
         refresh_url: `${process.env.CLIENT_URL}/pending`,
         return_url: `${process.env.CLIENT_URL}/success`,
         type: "account_onboarding",
      });

      res.json({
         success: true,
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
      return next(error);
   }
};

//get logged in seller details
export const getSeller = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const seller=req.seller;
      res.status(200).json({success:true, seller});
   }
   catch (error) {
      return next(error);
   }
};