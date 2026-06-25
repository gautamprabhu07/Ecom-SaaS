import {NextFunction, Request, Response } from "express";
import {validateRegistrationData} from "../utils/auth.helper";
import prisma from "@packages/libs/prisma";
import { ValidationError } from "@packages/error-handler";
import { checkOtpRestrictions, sendOtp, trackOtpRequest } from "../utils/auth.helper";


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

      await verifyOtp();
   }
   catch (error) {
      return next(error);
   }
}


   

   
   
