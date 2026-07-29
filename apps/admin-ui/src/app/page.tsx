//Path: apps/admin-ui/src/app/page.tsx
"use client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import Input from "../../../../packages/components/input/index";
import { Eye, EyeOff, XCircle } from "lucide-react";

type FormData = {
  email: string;
  password: string;
};

const Page = () => {
  const { register, handleSubmit } = useForm<FormData>();
  const [serverError, setServerError] = useState<string | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const router = useRouter();

  const loginMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/login-admin`,
        data,
        { withCredentials: true },
      );
      return response.data;
    },
    onSuccess: () => {
      setServerError(null);
      router.push("/dashboard");
    },
    onError: (error: AxiosError) => {
      const errormessage =
        (error.response?.data as { message?: string })?.message ||
        "An error occurred";
      setServerError(errormessage);
    },
  });

  const onSubmit = (data: FormData) => {
    loginMutation.mutate(data);
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF8F3] px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-[#E7E5E4] shadow-[0_4px_20px_-4px_rgba(120,53,15,0.08)] p-8 transition-shadow duration-300 hover:shadow-[0_8px_30px_-8px_rgba(120,53,15,0.14)]">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <h1 className="font-heading text-2xl font-extrabold text-[#292524] text-center mb-2">
            Welcome Admin
          </h1>

          <Input
            label="Email"
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                message: "Invalid email address",
              },
            })}
          />
          <div>
            <label className="block text-sm font-medium text-[#292524] mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={passwordVisible ? "text" : "password"}
                className="w-full border border-[#E7E5E4] rounded-2xl px-3 py-2.5 text-sm text-[#292524] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-[#059669] pr-10"
                {...register("password", { required: "password is required" })}
              />
              <button
                type="button"
                onClick={() => setPasswordVisible(!passwordVisible)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#78716C] hover:text-[#059669] transition-colors duration-150"
              >
                {passwordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full bg-[#059669] hover:bg-[#047857] disabled:bg-[#78716C] text-white font-semibold py-2.5 rounded-full text-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-8px_rgba(5,150,105,0.4)] active:translate-y-0 disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none shadow-[0_4px_20px_-4px_rgba(120,53,15,0.08)]"
          >
            {loginMutation.isPending ? "Logging in..." : "Login"}
          </button>
          {serverError && (
            <div className="flex items-center justify-center gap-2 text-sm text-red-500 bg-red-50 px-3 py-2 rounded-2xl animate-[dropdown-in_150ms_ease-out]">
              <XCircle size={16} />
              {serverError}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Page;
