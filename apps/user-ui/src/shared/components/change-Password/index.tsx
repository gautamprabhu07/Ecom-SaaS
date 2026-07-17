//Path: apps/user-ui/src/shared/components/change-Password/index.tsx
"use client";
import { useForm } from "react-hook-form";
import React, { useState } from "react";
import axiosInstance from "apps/user-ui/src/utils/axiosInstance";
import { Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";

const inputClass =
  "w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
const labelClass = "block text-sm font-medium text-gray-700 mb-1";
const errorClass = "text-red-500 text-xs mt-1";

const ChangePassword = () => {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const newPassword = watch("newPassword");

  const onSubmit = async (data: any) => {
    setError("");
    setMessage("");
    try {
      await axiosInstance.post("/api/change-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data?.confirmPassword,
      });
      setMessage("Password changed successfully");
      reset();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className="max-w-md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Current password */}
        <div>
          <label className={labelClass}>Current Password</label>
          <div className="relative">
            <input
              type={showCurrent ? "text" : "password"}
              className={`${inputClass} pr-10`}
              {...register("currentPassword", {
                required: "Current password is required",
              })}
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.currentPassword && (
            <p className={errorClass}>
              {String(errors.currentPassword.message)}
            </p>
          )}
        </div>

        {/* New password */}
        <div>
          <label className={labelClass}>New Password</label>
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              className={`${inputClass} pr-10`}
              {...register("newPassword", {
                required: "New password is required",
                minLength: {
                  value: 6,
                  message: "Password must be at least 6 characters long",
                },
              })}
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.newPassword && (
            <p className={errorClass}>{String(errors.newPassword.message)}</p>
          )}
        </div>

        {/* Confirm password */}
        <div>
          <label className={labelClass}>Confirm New Password</label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              className={`${inputClass} pr-10`}
              {...register("confirmPassword", {
                required: "Please confirm your new password",
                validate: (value) =>
                  value === newPassword || "Passwords do not match",
              })}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className={errorClass}>
              {String(errors.confirmPassword.message)}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition disabled:opacity-60"
        >
          {isSubmitting ? "Updating..." : "Update Password"}
        </button>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">
            <XCircle size={16} />
            {error}
          </div>
        )}
        {message && (
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
            <CheckCircle2 size={16} />
            {message}
          </div>
        )}
      </form>
    </div>
  );
};

export default ChangePassword;
