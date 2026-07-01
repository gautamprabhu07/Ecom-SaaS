import {NextFunction, Request, Response } from "express";
import {handleforgotPassword, validateRegistrationData, verifyForgotPasswordOtp} from "../utils/auth.helper";
import prisma from "@packages/libs/prisma";
import { AuthError, ValidationError } from "@packages/error-handler";
import { checkOtpRestrictions, sendOtp, trackOtpRequest, verifyOtp } from "../utils/auth.helper";
import bcrypt from "bcryptjs";
import jwt, { JsonWebTokenError } from "jsonwebtoken";
import { setCookie } from "../utils/cookies/setCookie";


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



   

   
   
