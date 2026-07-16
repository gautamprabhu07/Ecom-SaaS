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
    <div>
      <div>
        <form onSubmit={handleSubmit(onSubmit)}>
          <h1>Welcome Admin</h1>
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
          <button type="submit" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? "Logging in..." : "Login"}
          </button>
          {serverError && <p>{serverError}</p>}
        </form>
      </div>
    </div>
  );
};

export default Page;
