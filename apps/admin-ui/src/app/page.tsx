//Path: apps/admin-ui/src/app/page.tsx
"use client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import Input from "../../../../packages/components/input/index";

type FormData = {
  email: string;
  password: string;
};

const Page = () => {
  const { register, handleSubmit } = useForm<FormData>();
  const [serverError, setServerError] = useState<string | null>(null);
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
      <div className="w-full max-w-sm bg-white rounded-2xl border border-[#E7E5E4] shadow-[0_4px_20px_-4px_rgba(120,53,15,0.08)] p-8">
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
          <Input
            label="Password"
            type="password"
            {...register("password", { required: "password is required" })}
          />
          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full bg-[#059669] hover:bg-[#047857] disabled:bg-[#78716C] text-white font-semibold py-2.5 rounded-full text-sm transition shadow-[0_4px_20px_-4px_rgba(120,53,15,0.08)]"
          >
            {loginMutation.isPending ? "Logging in..." : "Login"}
          </button>
          {serverError && (
            <p className="text-red-500 text-xs text-center">{serverError}</p>
          )}
        </form>
      </div>
    </div>
  );
};

export default Page;
