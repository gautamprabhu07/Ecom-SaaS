//Path: apps/user-ui/src/app/%28routes%29/login/page.tsx
"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import Link from "next/link";
import GoogleIcon from "../googleicon";
import axios, { AxiosError } from "axios";
import { useMutation } from "@tanstack/react-query";

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
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/login-user`,
        data,
        {
          withCredentials: true, // important if your backend sets cookies
        },
      );
      return response.data;
    },
    onSuccess: (data) => {
      setServerError(null);
      router.push("/");
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
    <div className="min-h-screen bg-[#FAF8F3]">
      {/* Page Header */}
      <div className="bg-white border-b border-neutral-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-neutral-900">Login</h1>
        <p className="text-sm text-neutral-500 mt-1">Home · Login</p>
      </div>

      {/* Card */}
      <div className="flex items-center justify-center py-12 px-4">
        <div className="bg-white rounded-2xl shadow-lg shadow-neutral-200/50 w-full max-w-md p-8">
          <h3 className="text-xl font-semibold text-neutral-900 mb-1">
            Login to OutSource
          </h3>
          <p className="text-sm text-neutral-500 mb-6">
            Don't have an account?{" "}
            <Link
              href="/signup"
              className="text-emerald-600 font-medium hover:underline"
            >
              Sign up
            </Link>
          </p>

          {/* Google */}
          <button className="w-full flex items-center justify-center gap-2 border border-neutral-300 rounded-full py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition mb-5">
            <GoogleIcon />
            <span>Sign in with Google</span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-neutral-200" />
            <span className="text-xs text-neutral-400">
              or sign in with Email
            </span>
            <div className="flex-1 h-px bg-neutral-200" />
          </div>

          <form onSubmit={handleSubmit(onsubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Email
              </label>
              <input
                type="email"
                placeholder="support@gautam.com"
                className="w-full border border-neutral-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address",
                  },
                })}
              />
              {errors.email && (
                <p className="text-rose-500 text-xs mt-1">
                  {String(errors.email.message)}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={passwordVisible ? "text" : "password"}
                  placeholder="Enter your password"
                  className="w-full border border-neutral-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-16"
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 text-xs"
                >
                  {passwordVisible ? "Hide" : "Show"}
                </button>
              </div>
              {errors.password && (
                <p className="text-rose-500 text-xs mt-1">
                  {String(errors.password.message)}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-neutral-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                  className="accent-emerald-600"
                />
                Remember me
              </label>
              <Link
                href="/forgot-password"
                className="text-sm text-emerald-600 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            {serverError && (
              <p className="text-rose-500 text-sm">{serverError}</p>
            )}

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-full text-sm transition"
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
