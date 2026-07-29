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
    mutationFn: async (data: FormData) => {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/create-shop`,
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      setActiveStep(3);
    },
  });

  const onSubmit = async (data: any) => {
    const shopData = { ...data, sellerId };
    console.log("Shop Data:", shopData);
    shopCreateMutation.mutate(shopData);
  };

  const countWords = (text: string) => text.trim().split(/\s+/).length;

  const inputClass =
    "w-full border border-[#E7E5E4] rounded-2xl px-3 py-2.5 text-sm text-[#292524] placeholder:text-[#78716C] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-[#059669]";
  const labelClass = "block text-sm font-medium text-[#292524] mb-1";
  const errorClass = "text-red-500 text-xs mt-1 animate-[dropdown-in_150ms_ease-out]";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h3 className="font-['Nunito'] text-xl font-bold text-[#292524] mb-2">
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
        className="w-full bg-[#059669] hover:bg-[#047857] text-white font-medium py-2.5 rounded-full text-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-8px_rgba(5,150,105,0.4)] active:translate-y-0 disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none"
      >
        {shopCreateMutation.isPending ? "Creating..." : "Create"}
      </button>
    </form>
  );
};

export default CreateShop;
