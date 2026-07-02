"use client";
import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import Link from "next/link";
import axios, { AxiosError } from "axios";
import { useMutation } from "@tanstack/react-query";
import { countries } from "../../../utils/countries";

const SignUp = () => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [canResend, setCanResend] = useState(true);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [timer, setTimer] = useState(60);
  const [showOtp, setShowOtp] = useState(false);
  const [sellerData, setSellerData] = useState<FormData | null>(null);
  const [sellerId, setSellerId] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

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
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/seller-registration`,
        data,
      );
      return response.data;
    },
    onSuccess: (_, formData) => {
      setSellerData(formData);
      setShowOtp(true);
      setCanResend(false);
      setTimer(60);
      startResendTimer();
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async () => {
      if (!sellerData) return;
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/verify-seller`,
        {
          ...sellerData,
          otp: otp.join(""),
        },
      );
      return response.data;
    },
    onSuccess: (data) => {
      setSellerId(data?.seller?._id);
      setActiveStep(2);
    },
  });

  const onsubmit = (data: any) => {
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
    if (sellerData) {
      signupMutation.mutate(sellerData);
    }
  };

  return (
    <div>
      {/*Stepper*/}
      <div>
        <div />
        {[1, 2, 3].map((step) => (
          <div key={step}>
            <div
              className={`${activeStep === step ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-600"}`}
            >
              {step}
            </div>
            <span />
            {step === 1
              ? "Create Account"
              : step === 2
                ? "Setup Shop"
                : "Connect Bank"}
          </div>
        ))}
      </div>
      {/* Steps content*/}
      <div>
        {activeStep === 1 && (
          <>
            {!showOtp ? (
              <form onSubmit={handleSubmit(onsubmit)} className="space-y-4">
                <h3>Create Account</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your name"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    {...register("name", { required: "Name is required" })}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1">
                      {String(errors.name.message)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="support@gautam.com"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address",
                      },
                    })}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">
                      {String(errors.email.message)}
                    </p>
                  )}
                </div>

                <label>Phone number</label>
                <input
                  type="tel"
                  placeholder="80738*****"
                  {...register("phone_number", {
                    required: "Phone number is required",
                    pattern: {
                      value: /^[0-9]{10}$/,
                      message: "Invalid phone number",
                    },
                    minLength: {
                      value: 10,
                      message: "Phone number must be 10 digits",
                    },
                  })}
                />
                {errors.phone_number && (
                  <p className="text-red-500 text-xs mt-1">
                    {String(errors.phone_number.message)}
                  </p>
                )}

                <label>Country</label>
                <select
                  {...register("country", { required: "Country is required" })}
                >
                  <option value="">Select your country</option>
                  {countries.map((country) => (
                    <option key={country.code} value={country.name}>
                      {country.name}
                    </option>
                  ))}
                </select>
                {errors.country && (
                  <p className="text-red-500 text-xs mt-1">
                    {String(errors.country.message)}
                  </p>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={passwordVisible ? "text" : "password"}
                      placeholder="Enter your password"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                      {...register("password", {
                        required: "Password is required",
                        minLength: {
                          value: 6,
                          message:
                            "Password must be at least 6 characters long",
                        },
                      })}
                    />
                    <button
                      type="button"
                      onClick={() => setPasswordVisible(!passwordVisible)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                    >
                      {passwordVisible ? "Hide" : "Show"}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-xs mt-1">
                      {String(errors.password.message)}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={signupMutation.isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition"
                >
                  {signupMutation.isPending ? "Signing Up..." : "Sign Up"}
                </button>
                {signupMutation?.isError &&
                  signupMutation.error instanceof AxiosError && (
                    <p>
                      {signupMutation.error.response?.data?.message ||
                        signupMutation.error.message}
                    </p>
                  )}
                <p>
                  Already have an account?{" "}
                  <Link href="/login" className="text-blue-600 hover:underline">
                    Login
                  </Link>
                </p>
              </form>
            ) : (
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
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
                      className="w-12 h-12 text-center text-xl border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ))}
                </div>
                <button
                  onClick={() => verifyOtpMutation.mutate()}
                  disabled={verifyOtpMutation.isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition mb-3"
                >
                  {verifyOtpMutation.isPending ? "Verifying..." : "Verify OTP"}
                </button>
                <p className="text-sm text-gray-500">
                  {canResend ? (
                    <button
                      onClick={resendOtp}
                      className="text-blue-600 hover:underline"
                    >
                      Resend OTP
                    </button>
                  ) : (
                    `Resend OTP in ${timer}s`
                  )}
                </p>
                {verifyOtpMutation?.isError &&
                  verifyOtpMutation.error instanceof AxiosError && (
                    <p>
                      {verifyOtpMutation.error.response?.data?.message ||
                        verifyOtpMutation.error.message}
                    </p>
                  )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SignUp;
