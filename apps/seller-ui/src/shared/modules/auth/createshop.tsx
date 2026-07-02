import React from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { shopCategories } from "apps/seller-ui/src/utils/categories";

const CreateShop = ({
  sellerId,
  setActiveStep,
}: {
  sellerId: string;
  setActiveStep: (step: number) => void;
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const shopCreateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/create-shop`,
        data,
        {
          withCredentials: true,
        },
      );
      return response.data;
    },
    onSuccess: () => setActiveStep(3),
  });

  const onSubmit = async (data: any) =>
    shopCreateMutation.mutate({ ...data, sellerId });

  const countWords = (text: string) => text.trim().split(/\s+/).length;

  const inputClass =
    "w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";
  const errorClass = "text-red-500 text-xs mt-1";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-800 mb-2">
        Setup new shop
      </h3>

      <div>
        <label className={labelClass}>Name *</label>
        <input
          type="text"
          className={inputClass}
          {...register("name", { required: "Name is required" })}
        />
        {errors.name && (
          <p className={errorClass}>{String(errors.name.message)}</p>
        )}
      </div>

      <div>
        <label className={labelClass}>Bio (Max 100 words) *</label>
        <input
          type="text"
          placeholder="Shop bio"
          className={inputClass}
          {...register("bio", {
            required: "Bio is required",
            validate: (v) =>
              countWords(v) <= 100 || "Bio must be 100 words or less",
          })}
        />
        {errors.bio && (
          <p className={errorClass}>{String(errors.bio.message)}</p>
        )}
      </div>

      <div>
        <label className={labelClass}>Address *</label>
        <input
          type="text"
          className={inputClass}
          {...register("address", { required: "Address is required" })}
        />
        {errors.address && (
          <p className={errorClass}>{String(errors.address.message)}</p>
        )}
      </div>

      <div>
        <label className={labelClass}>Opening Hours *</label>
        <input
          type="text"
          className={inputClass}
          {...register("opening_hours", {
            required: "Opening hours is required",
          })}
        />
        {errors.openingHours && (
          <p className={errorClass}>{String(errors.openingHours.message)}</p>
        )}
      </div>

      <div>
        <label className={labelClass}>Website *</label>
        <input
          type="url"
          placeholder="https://example.com"
          className={inputClass}
          {...register("website", { required: "Website is required" })}
        />
        {errors.website && (
          <p className={errorClass}>{String(errors.website.message)}</p>
        )}
      </div>

      <div>
        <label className={labelClass}>Category *</label>
        <select
          className={inputClass}
          {...register("category", { required: "Category is required" })}
        >
          <option value="">Select a category</option>
          {shopCategories.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
        {errors.category && (
          <p className={errorClass}>{String(errors.category.message)}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={shopCreateMutation.isPending}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition"
      >
        {shopCreateMutation.isPending ? "Creating Shop..." : "Create Shop"}
      </button>
    </form>
  );
};

export default CreateShop;
