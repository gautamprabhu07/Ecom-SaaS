import { useForm } from "react-hook-form";
import React, { useState } from "react";
import axiosInstance from "apps/user-ui/src/utils/axiosInstance";

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
    <div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label>Current Password</label>
        </div>
      </form>
    </div>
  );
};

export default ChangePassword;
