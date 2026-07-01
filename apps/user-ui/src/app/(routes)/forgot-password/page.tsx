"use client";
import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import Link from 'next/link'
import axios, {AxiosError} from 'axios'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'react-hot-toast';

type FormData = {
  email: string;
  password: string;
}

const ForgotPassword = () => {
   const [step, setStep] = useState<"email" | "otp" | "reset">("email");
   const [canResend, setCanResend] = useState(true);
   const [timer, setTimer] = useState(60);
   const [userEmail, setUserEmail] = useState<string | null>(null);
   const [otp, setOtp] = useState(["", "", "", ""]);
   const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

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

  const requestOtpMutation = useMutation({
    mutationFn: async ({email}:{email: string}) => {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/forgot-password-user`, { email });
      return response.data;
    },
    onSuccess: (_, {email}) => {
      setUserEmail(email);
      setStep("otp"); 
      setServerError(null);
      setCanResend(false);
      startResendTimer();
    },
    onError: (error: AxiosError) => {
      const errorMessage = (error.response?.data as { message: string })?.message || "Invalid otp. Please try again.";
      setServerError(errorMessage);
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async () => {
      if(!userEmail) return;
      const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/verify-forgot-password-user`, {email: userEmail, otp: otp.join("")});
      return response.data;
    },
    onSuccess: () => {
      setStep("reset");
      setServerError(null);
    },
    onError: (error: AxiosError) => {
      const errorMessage = (error.response?.data as { message: string })?.message || "Invalid otp. Please try again.";
      setServerError(errorMessage);
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({password}:{password: string}) => {
      if(!password) return;
      const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/reset-password-user`, {email: userEmail, newPassword: password});
      return response.data;
    },
    onSuccess: () => {
      setStep("email");
      toast.success("Password reset successful. Please log in with your new password.");
      setServerError(null);
      router.push("/login");
    },
    onError: (error: AxiosError) => {
      const errorMessage = (error.response?.data as { message: string })?.message || "Invalid otp. Please try again.";
      setServerError(errorMessage);
    },
  });
  const handleOtpChange = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    };

    const onSubmitEmail = ({email}: {email: string}) => {
      requestOtpMutation.mutate({email});
    };

   const onSubmitPassword = ({password}: {password: string}) => {
    resetPasswordMutation.mutate({password});
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-800">Forgot Password</h1>
        <p className="text-sm text-gray-500 mt-1">Home · Forgot-Password</p>
      </div>

      {/* Card */}
      <div className="flex items-center justify-center py-12 px-4">
        <div className="bg-white rounded-2xl shadow-md w-full max-w-md p-8">
          {step === "email" && (<>
          <h3 className="text-xl font-semibold text-gray-800 mb-1">Login to Eshop</h3>
          <p className="text-sm text-gray-500 mb-6">
            Go back to?{" "}
            <Link href="/signup" className="text-blue-600 hover:underline">Login</Link>
          </p>

         

          

          <form onSubmit={handleSubmit(onSubmitEmail)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                placeholder="support@gautam.com"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register("email", {
                  required: "Email is required",
                  pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: "Invalid email address" }
                })}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{String(errors.email.message)}</p>}
            </div>

            <button
              type="submit"
              disabled={requestOtpMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition"
            >
             {requestOtpMutation.isPending ? "Sending OTP..." : "Send OTP"}
            </button>
            {serverError && <p className="text-red-500 text-xs mt-1">{serverError}</p>}
          </form></>
            )}

            {step === "otp" && (
              <>
              <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Enter OTP</h3>
              <div className="flex justify-center gap-3 mb-6">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    type="text"
                    ref={(el) => { inputRefs.current[index] = el; }}
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
                {canResend
                  ? <button  onClick={() => {
    if (userEmail) {
      requestOtpMutation.mutate({ email: userEmail });
    }
  }} className="text-blue-600 hover:underline">Resend OTP</button>
                  : `Resend OTP in ${timer}s`
                }
              </p>
              {serverError && <p className="text-red-500 text-xs mt-1">{serverError}</p>}
              </div></>
            )}

            {step==="reset" && (
              <>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Reset Password</h3>
              <form onSubmit={handleSubmit(onSubmitPassword)} className="space-y-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input type="password" placeholder="Enter your new password" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" {...register("password", { required: "Password is required", minLength: { value: 6, message: "Password must be at least 6 characters long" }, })} />
                {errors.password && <p className="text-red-500 text-xs mt-1">{String(errors.password.message)}</p>}

                <button
                  type="submit"
                  disabled={resetPasswordMutation.isPending} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition">
                    {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
                  </button>
                  {serverError && <p className="text-red-500 text-xs mt-1">{serverError}</p>}
                </form>
                
              </>
            )}
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;