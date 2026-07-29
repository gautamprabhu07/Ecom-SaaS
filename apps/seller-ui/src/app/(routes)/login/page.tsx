"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import Link from "next/link";
import axios, { AxiosError } from "axios";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff, XCircle } from "lucide-react";

type FormData = {
  email: string;
  password: string;
};

const Login = () => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  const loginMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/login-seller`,
        data,
        {
          withCredentials: true, // important if your backend sets cookies
        },
      );
      return response.data;
    },
    onSuccess: (data) => {
      setServerError(null);
      router.push("/dashboard");
    },
    onError: (error: AxiosError) => {
      const errorMessage =
        (error.response?.data as { message: string })?.message ||
        "Invalid credentials ";
      setServerError(errorMessage);
    },
  });

  const onsubmit = (data: FormData) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3] font-['Inter']">
      {/* Page Header */}
      <div className="bg-white border-b border-[#E7E5E4] px-6 py-4">
        <h1 className="font-['Nunito'] text-2xl font-extrabold text-[#292524]">
          Login
        </h1>
        <p className="text-sm text-[#78716C] mt-1">Home · Login</p>
      </div>

      {/* Card */}
      <div className="flex items-center justify-center py-12 px-4">
        <div className="bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(120,53,15,0.08)] border border-[#E7E5E4] w-full max-w-md p-8 transition-shadow duration-300 hover:shadow-[0_8px_30px_-8px_rgba(120,53,15,0.14)]">
          <h3 className="font-['Nunito'] text-xl font-bold text-[#292524] mb-1">
            Login to OutSource
          </h3>
          <p className="text-sm text-[#78716C] mb-6">
            Don't have an account?{" "}
            <Link
              href="/signup"
              className="text-[#059669] font-medium hover:text-[#047857] hover:underline transition-colors duration-150"
            >
              Sign up
            </Link>
          </p>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-[#E7E5E4]" />
            <span className="text-xs text-[#78716C]">or sign in with Email</span>
            <div className="flex-1 h-px bg-[#E7E5E4]" />
          </div>

          <form onSubmit={handleSubmit(onsubmit)} className="space-y-4">
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

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-[#78716C] cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                  className="accent-[#059669] cursor-pointer"
                />
                <span className="transition-colors duration-150 group-hover:text-[#292524]">
                  Remember me
                </span>
              </label>
              <Link
                href="/forgot-password"
                className="text-sm text-[#059669] font-medium hover:text-[#047857] hover:underline transition-colors duration-150"
              >
                Forgot password?
              </Link>
            </div>

            {serverError && (
              <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 px-3 py-2 rounded-2xl animate-[dropdown-in_150ms_ease-out]">
                <XCircle size={16} />
                {serverError}
              </div>
            )}

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full bg-[#059669] hover:bg-[#047857] text-white font-medium py-2.5 rounded-full text-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-8px_rgba(5,150,105,0.4)] active:translate-y-0 disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none"
            >
              {loginMutation.isPending ? "Logging In..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
