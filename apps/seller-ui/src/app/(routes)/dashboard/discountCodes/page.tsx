//Path : apps/seller-ui/src/app/%28routes%29/dashboard/discountCodes/page.tsx
"use client";
import axiosInstance from "apps/seller-ui/src/utils/axiosInstance";
import { AxiosError } from "axios";
import { ChevronRight, Plus, Trash, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import Input from "packages/components/input";
import React, { useState } from "react";
import { toast } from "react-hot-toast";
import Link from "next/link";
import DeleteDiscountCodeModal from "../../../../shared/components/modals/delete-discount-codes";

const selectClass =
  "w-full border border-[#E7E5E4] rounded-2xl px-3 py-2.5 text-sm text-[#292524] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-[#059669]";
const labelClass = "block text-sm font-medium text-[#292524] mb-1";
const errorClass = "text-red-500 text-xs mt-1 animate-[dropdown-in_150ms_ease-out]";

const Page = () => {
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState<any>(null);

  const { data: discountCodes = [], isLoading } = useQuery({
    queryKey: ["shop-discounts"],
    queryFn: async () => {
      const res = await axiosInstance.get("/product/api/get-discount-codes");
      return res?.data?.discountCodes || [];
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      public_name: "",
      discountType: "percentage",
      discountValue: "",
      discountCode: "",
    },
  });

  const queryClient = useQueryClient();

  const createDiscountCodeMutation = useMutation({
    mutationFn: async (data: any) => {
      await axiosInstance.post("/product/api/create-discount-code", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-discounts"] });
      reset();
      setShowModal(false);
    },
  });

  const deleteDiscountCodeMutation = useMutation({
    mutationFn: async (discountId) => {
      await axiosInstance.delete(
        `/product/api/delete-discount-code/${discountId}`,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-discounts"] });
      setShowDeleteModal(false);
    },
    onError: (error: any) => {
      console.error("Delete discount code failed:", error);
      toast.error(
        error?.response?.data?.message || "Failed to delete discount code.",
      );
    },
  });

  const handleDeleteClick = async (discount: any) => {
    setSelectedDiscount(discount);
    setShowDeleteModal(true);
  };

  const onSubmit = (data: any) => {
    if (discountCodes.length >= 8) {
      toast.error("You can only create up to 8 discount codes.");
      return;
    }
    createDiscountCodeMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3] p-6 font-['Inter']">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-['Nunito'] text-2xl font-extrabold text-[#292524]">
          Discount Codes
        </h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 bg-[#059669] hover:bg-[#047857] text-white text-sm font-medium px-4 py-2.5 rounded-full transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-8px_rgba(5,150,105,0.4)]"
        >
          <Plus size={16} /> Create Discount Code
        </button>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-[#78716C] mb-6">
        <Link
          href="/dashboard"
          className="hover:text-[#059669] transition-colors duration-150"
        >
          Dashboard
        </Link>
        <ChevronRight size={14} className="text-[#A8A29E]" />
        <span className="text-[#292524] font-medium">Discount Codes</span>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl border border-[#E7E5E4] shadow-[0_4px_20px_-4px_rgba(120,53,15,0.08)] p-6 transition-shadow duration-300 hover:shadow-[0_8px_30px_-8px_rgba(120,53,15,0.14)]">
        <h3 className="font-['Nunito'] text-base font-bold text-[#292524] mb-4">
          Your Discount Codes
        </h3>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-10 bg-[#FAF8F3] rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : discountCodes?.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="mb-3 w-14 h-14 rounded-full bg-[#D1FAE5] flex items-center justify-center">
              <span className="text-xl">🏷️</span>
            </div>
            <p className="text-sm text-[#78716C]">
              No discount codes available
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E7E5E4] text-[#78716C] text-left">
                <th className="pb-3 font-medium">Title</th>
                <th className="pb-3 font-medium">Type</th>
                <th className="pb-3 font-medium">Value</th>
                <th className="pb-3 font-medium">Code</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F5F4]">
              {discountCodes?.map((discount: any) => (
                <tr
                  key={discount?.id}
                  className="text-[#292524] transition-colors duration-150 hover:bg-[#FAF8F3]"
                >
                  <td className="py-3">{discount?.public_name}</td>
                  <td className="py-3 capitalize">{discount?.discountType}</td>
                  <td className="py-3 font-medium">
                    {discount.discountType === "percentage"
                      ? `${discount.discountValue}%`
                      : `$${discount.discountValue}`}
                  </td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 bg-[#D1FAE5] text-[#047857] rounded-full font-mono text-xs">
                      {discount?.discountCode}
                    </span>
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() => handleDeleteClick(discount)}
                      className="p-1.5 text-[#78716C] hover:text-red-500 hover:bg-red-50 hover:scale-110 transition-all duration-200 rounded-full"
                    >
                      <Trash size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#292524]/40 animate-[fade-in_150ms_ease-out]">
          <div className="bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(120,53,15,0.15)] w-full max-w-md p-6 animate-[dropdown-in_200ms_ease-out]">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-['Nunito'] text-lg font-bold text-[#292524]">
                Create Discount Code
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-[#78716C] hover:text-[#292524] hover:rotate-90 transition-all duration-200"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Input
                  label="Title (Public name)"
                  {...register("public_name", {
                    required: "Title is required",
                  })}
                />
                {errors.public_name && (
                  <p className={errorClass}>{errors.public_name.message}</p>
                )}
              </div>

              <div>
                <label className={labelClass}>Discount Type</label>
                <Controller
                  control={control}
                  name="discountType"
                  render={({ field }) => (
                    <select {...field} className={selectClass}>
                      <option value="percentage">Percentage (%)</option>
                      <option value="flat">Flat Amount ($)</option>
                    </select>
                  )}
                />
              </div>

              <div>
                <Input
                  label="Discount Value"
                  type="number"
                  {...register("discountValue", {
                    required: "Discount value is required",
                    valueAsNumber: true,
                  })}
                />
                {errors.discountValue && (
                  <p className={errorClass}>{errors.discountValue.message}</p>
                )}
              </div>

              <div>
                <Input
                  label="Discount Code"
                  {...register("discountCode", {
                    required: "Discount code is required",
                  })}
                />
                {errors.discountCode && (
                  <p className={errorClass}>{errors.discountCode.message}</p>
                )}
              </div>

              {createDiscountCodeMutation.isError && (
                <p className={errorClass}>
                  {(
                    createDiscountCodeMutation.error as AxiosError<{
                      message: string;
                    }>
                  )?.response?.data?.message || "Something went wrong"}
                </p>
              )}

              <button
                type="submit"
                disabled={createDiscountCodeMutation.isPending}
                className="w-full flex items-center justify-center gap-1.5 bg-[#059669] hover:bg-[#047857] text-white font-medium py-2.5 rounded-full text-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-8px_rgba(5,150,105,0.4)] active:translate-y-0 disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none"
              >
                <Plus size={16} />
                {createDiscountCodeMutation.isPending
                  ? "Creating..."
                  : "Create"}
              </button>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && selectedDiscount && (
        <DeleteDiscountCodeModal
          discount={selectedDiscount}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={() =>
            deleteDiscountCodeMutation.mutate(selectedDiscount?.id)
          }
        />
      )}
    </div>
  );
};

export default Page;
