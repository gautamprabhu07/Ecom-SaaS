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
  "w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
const labelClass = "block text-sm font-medium text-gray-700 mb-1";
const errorClass = "text-red-500 text-xs mt-1";

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
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-semibold text-gray-800">Discount Codes</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition"
        >
          <Plus size={16} /> Create Discount Code
        </button>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-sm text-gray-500 mb-6">
        <Link href="/dashboard" className="hover:text-gray-700">
          Dashboard
        </Link>
        <ChevronRight size={14} />
        <span className="text-gray-700">Discount Codes</span>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4">
          Your Discount Codes
        </h3>

        {isLoading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : discountCodes?.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            No discount codes available
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500 text-left">
                <th className="pb-3 font-medium">Title</th>
                <th className="pb-3 font-medium">Type</th>
                <th className="pb-3 font-medium">Value</th>
                <th className="pb-3 font-medium">Code</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {discountCodes?.map((discount: any) => (
                <tr key={discount?.id} className="text-gray-700">
                  <td className="py-3">{discount?.public_name}</td>
                  <td className="py-3 capitalize">{discount?.discountType}</td>
                  <td className="py-3">
                    {discount.discountType === "percentage"
                      ? `${discount.discountValue}%`
                      : `$${discount.discountValue}`}
                  </td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 bg-gray-100 rounded font-mono text-xs">
                      {discount?.discountCode}
                    </span>
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() => handleDeleteClick(discount)}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition rounded-lg hover:bg-red-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-800">
                Create Discount Code
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition"
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
                className="w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition disabled:opacity-60"
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
