//path: apps/user-ui/src/app/%28routes%29/signup/page.tsx
"use client";
import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import Link from "next/link";
import GoogleIcon from "../googleicon";
import axios, { AxiosError } from "axios";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff, XCircle } from "lucide-react";

type FormData = {
  name: string;
  email: string;
  password: string;
};

const SignUp = () => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [canResend, setCanResend] = useState(true);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [timer, setTimer] = useState(60);
  const [showOtp, setShowOtp] = useState(false);
  const [userData, setUserData] = useState<FormData | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  const startResendTimer = () => {
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };
  console.log("NEXT_PUBLIC_SERVER_URL", process.env.NEXT_PUBLIC_SERVER_URL);

  const signupMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/user-registration`,
        data,
      );
      return response.data;
    },
    onSuccess: (_, formData) => {
      setUserData(formData);
      setShowOtp(true);
      setCanResend(false);
      setTimer(60);
      startResendTimer();
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async () => {
      if (!userData) return;
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/verify-user`,
        {
          ...userData,
          otp: otp.join(""),
        },
      );
      return response.data;
    },
    onSuccess: () => {
      router.push("/login");
    },
  });

  const onsubmit = (data: FormData) => {
    signupMutation.mutate(data);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const resendOtp = () => {
    if (userData) {
      signupMutation.mutate(userData);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3] font-['Inter']">
      {/* Page Header */}
      <div className="bg-white border-b border-[#E7E5E4] px-6 py-4">
        <h1 className="font-['Nunito'] text-2xl font-extrabold text-[#292524]">
          Sign Up
        </h1>
        <p className="text-sm text-[#78716C] mt-1">Home · Sign Up</p>
      </div>

      {/* Card */}
      <div className="flex items-center justify-center py-12 px-4">
        <div className="bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(120,53,15,0.08)] border border-[#E7E5E4] w-full max-w-md p-8 transition-shadow duration-300 hover:shadow-[0_8px_30px_-8px_rgba(120,53,15,0.14)]">
          <h3 className="font-['Nunito'] text-xl font-bold text-[#292524] mb-1">
            Sign Up to OutSource
          </h3>
          <p className="text-sm text-[#78716C] mb-6">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-[#059669] font-medium hover:text-[#047857] hover:underline transition-colors duration-150"
            >
              Login
            </Link>
          </p>

          {/* Google */}
          <button className="w-full flex items-center justify-center gap-2 border border-[#E7E5E4] rounded-full py-2.5 text-sm font-medium text-[#292524] transition-all duration-200 hover:bg-[#FAF8F3] hover:border-[#059669]/40 hover:-translate-y-0.5 mb-5">
            <GoogleIcon />
            <span>Sign in with Google</span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-[#E7E5E4]" />
            <span className="text-xs text-[#78716C]">or sign in with Email</span>
            <div className="flex-1 h-px bg-[#E7E5E4]" />
          </div>

          {!showOtp ? (
            <form onSubmit={handleSubmit(onsubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#292524] mb-1">
                  Name
                </label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  className="w-full border border-[#E7E5E4] rounded-2xl px-3 py-2.5 text-sm text-[#292524] placeholder:text-[#78716C] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-[#059669]"
                  {...register("name", { required: "Name is required" })}
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1 animate-[dropdown-in_150ms_ease-out]">
                    {String(errors.name.message)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#292524] mb-1">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="support@gautam.com"
                  className="w-full border border-[#E7E5E4] rounded-2xl px-3 py-2.5 text-sm text-[#292524] placeholder:text-[#78716C] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-[#059669]"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address",
                    },
                  })}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1 animate-[dropdown-in_150ms_ease-out]">
                    {String(errors.email.message)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#292524] mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={passwordVisible ? "text" : "password"}
                    placeholder="Enter your password"
                    className="w-full border border-[#E7E5E4] rounded-2xl px-3 py-2.5 text-sm text-[#292524] placeholder:text-[#78716C] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-[#059669] pr-10"
                    {...register("password", {
                      required: "Password is required",
                      minLength: {
                        value: 6,
                        message: "Password must be at least 6 characters long",
                      },
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordVisible(!passwordVisible)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#78716C] hover:text-[#059669] transition-colors duration-150"
                  >
                    {passwordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1 animate-[dropdown-in_150ms_ease-out]">
                    {String(errors.password.message)}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={signupMutation.isPending}
                className="w-full bg-[#059669] hover:bg-[#047857] text-white font-medium py-2.5 rounded-full text-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-8px_rgba(5,150,105,0.4)] active:translate-y-0 disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none"
              >
                {signupMutation.isPending ? "Signing Up..." : "Sign Up"}
              </button>
            </form>
          ) : (
            <div className="text-center">
              <h3 className="font-['Nunito'] text-lg font-bold text-[#292524] mb-4">
                Enter OTP
              </h3>
              <div className="flex justify-center gap-3 mb-6">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    type="text"
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-12 h-12 text-center text-xl text-[#292524] border border-[#E7E5E4] rounded-2xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-[#059669] focus:scale-105"
                  />
                ))}
              </div>
              <button
                onClick={() => verifyOtpMutation.mutate()}
                disabled={verifyOtpMutation.isPending}
                className="w-full bg-[#059669] hover:bg-[#047857] text-white font-medium py-2.5 rounded-full text-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-8px_rgba(5,150,105,0.4)] active:translate-y-0 disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none mb-3"
              >
                {verifyOtpMutation.isPending ? "Verifying..." : "Verify OTP"}
              </button>
              <p className="text-sm text-[#78716C]">
                {canResend ? (
                  <button
                    onClick={resendOtp}
                    className="text-[#059669] font-medium hover:text-[#047857] hover:underline transition-colors duration-150"
                  >
                    Resend OTP
                  </button>
                ) : (
                  `Resend OTP in ${timer}s`
                )}
              </p>
              {verifyOtpMutation?.isError &&
                verifyOtpMutation.error instanceof AxiosError && (
                  <div className="flex items-center justify-center gap-2 text-sm text-red-500 bg-red-50 px-3 py-2 rounded-2xl mt-3 animate-[dropdown-in_150ms_ease-out]">
                    <XCircle size={16} />
                    {verifyOtpMutation.error.response?.data?.message ||
                      verifyOtpMutation.error.message}
                  </div>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignUp;
