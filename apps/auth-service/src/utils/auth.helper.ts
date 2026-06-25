import crypto from "crypto";
import { ValidationError } from "@packages/error-handler";
import { sendEmail } from "./sendMail";
import redis from "@packages/libs/redis";
import { NextFunction } from "express";

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
   }

   export const verifyOtp = async (email: string, otp: string, next: NextFunction) => {
      const storedOtp = await redis.get(`otp:${email}`);
      if (!storedOtp) {
         return next(new ValidationError("OTP has expired or is invalid. Please request a new one."));
      }
      const failedAttemptsKey = `otp_failed_attempts:${email}`;
      const failedAttempts = parseInt(await redis.get(failedAttemptsKey) || "0");

      if(storedOtp !== otp) {
         if (failedAttempts >= 2) {
            await redis.set(`otp_lock:${email}`, "locked", "EX", 1800);
            await redis.del(`otp:${email}`, failedAttemptsKey); // Clear the OTP since the account is now locked
            return next(new ValidationError("Account is temporarily locked due to multiple failed OTP attempts! Please try again later after 30 minutes."));
         }
         await redis.set(failedAttemptsKey, (failedAttempts + 1), "EX", 300); 
         return next(new ValidationError("Invalid OTP. ${2-failedAttempts} attempts remaining."));
      }
   };


