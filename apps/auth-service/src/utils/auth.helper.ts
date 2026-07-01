import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import { ValidationError } from "@packages/error-handler";
import { sendEmail } from "./sendMail";
import redis from "@packages/libs/redis";
import prisma from "@packages/libs/prisma";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateRegistrationData = (data: any, userType: "user" | "seller") => {
   const{ name, email, password, phone_number, country } = data;

   if(!name || !email || !password || (userType ==="seller" && (!phone_number || !country))) {
      throw new ValidationError("Missing required fields for registration");
   }

   if(!emailRegex.test(email)) {
      throw new ValidationError("Invalid email format");
   }

};

export const checkOtpRestrictions = async(email: string, next: NextFunction) => {
      if(await redis.get(`otp_lock:${email}`)) {
         return next(new ValidationError("Account is temporarily locked due to multiple failed OTP attempts! Please try again later after 30 minutes."));
      }
      if(await redis.get(`otp_spam_lock:${email}`)) {
         return next(new ValidationError("You have exceeded the maximum number of OTP requests! Please try again later after an hour."));
      }
      if (await redis.get(`otp_cooldown:${email}`)) {
         return next(new ValidationError("You can only request an OTP once every minute. Please wait before requesting again."));
      }
   };

export const trackOtpRequest = async(email: string, next: NextFunction) => {
   const otpRequestKey = `otp_request_count:${email}`;
   let otpRequests = parseInt(await redis.get(otpRequestKey) || "0");

   if (otpRequests >= 2) {
      await redis.set(`otp_spam_lock:${email}`, "locked", "EX", 3600); // Lock for 1 hour
      return next(new ValidationError("You have exceeded the maximum number of OTP requests! Please try again later after an hour."));
   }
   await redis.set(otpRequestKey, (otpRequests + 1), "EX", 3600); // Increment count and set expiry to 1 hour
};

export const sendOtp = async (name: string, email: string, template: string) => {
   const otp = crypto.randomInt(1000, 9999).toString();
   await sendEmail(email, "Verify your email", template, { name, otp });
   await redis.set(`otp:${email}`, otp, "EX", 300); // Store OTP in Redis for 5 minutes
   await redis.set(`otp_cooldown:${email}`, "true", "EX", 60); // Set a cooldown of 1 minute
};

export const verifyOtp = async (email: string, otp: string, next: NextFunction) => {
   const storedOtp = await redis.get(`otp:${email}`);
   if (!storedOtp) {
      throw new ValidationError("OTP has expired or is invalid. Please request a new one.");
   }
   const failedAttemptsKey = `otp_failed_attempts:${email}`;
   const failedAttempts = parseInt(await redis.get(failedAttemptsKey) || "0");

   if(storedOtp !== otp) {
      if (failedAttempts >= 2) {
         await redis.set(`otp_lock:${email}`, "locked", "EX", 1800);
         await redis.del(`otp:${email}`, failedAttemptsKey); // Clear the OTP since the account is now locked
         throw new ValidationError("Account is temporarily locked due to multiple failed OTP attempts! Please try again later after 30 minutes.");
      }
      await redis.set(failedAttemptsKey, (failedAttempts + 1), "EX", 300);
      //throw validation error and show attemps remaining
      throw new ValidationError(`Invalid OTP. You have ${2 - failedAttempts} attempts remaining before your account is locked.`); 
      
   }

   await redis.del(`otp:${email}`, failedAttemptsKey); // Clear OTP and failed attempts on successful verification
};

export const handleforgotPassword = async (req: Request, res: Response, next: NextFunction, userType: "user" | "seller") => {
   try {
      const { email } = req.body;
      if(!email) {
         throw new ValidationError("Email is required for password reset");
      }

      const user =userType==="user" &&  await prisma.users.findUnique({ where: { email } });

      if (!user) {
         throw new ValidationError(`No ${userType} found with this email`);
      }

      await checkOtpRestrictions(email, next);
      await trackOtpRequest(email, next);

      await sendOtp(user.name, email,"forgot-password-user-mail");

      return res.status(200).json({
  success: true,
  message: "OTP sent successfully",
});
   }
   catch (error) {
      next(error);
   }
};

export const verifyForgotPasswordOtp = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const { email, otp } = req.body;
      if(!email || !otp) {
         throw new ValidationError("Email and OTP are required for verification");
      }
      await verifyOtp(email, otp, next);

      res.status(200).json({ message: "OTP verified successfully. You can now reset your password." });
   }
   catch (error) {
      next(error);
   }
};
  


