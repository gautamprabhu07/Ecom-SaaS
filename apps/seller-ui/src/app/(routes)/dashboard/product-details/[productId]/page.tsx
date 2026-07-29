"use client";
import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Pencil } from "lucide-react";
import axiosInstance from "apps/seller-ui/src/utils/axiosInstance";

const Page = () => {
  const { productId } = useParams<{ productId: string }>();
  const router = useRouter();

  const {
    data: product,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["seller-product", productId],
    queryFn: async () => {
      const res = await axiosInstance.get(
        `/product/api/get-seller-product/${productId}`,
      );
      return res.data.product;
    },
    enabled: !!productId,
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto animate-pulse space-y-4">
        <div className="h-4 w-64 bg-[#E7E5E4] rounded-full" />
        <div className="h-7 w-80 bg-[#E7E5E4] rounded-full" />
        <div className="flex gap-6">
          <div className="w-64 shrink-0 h-40 bg-[#E7E5E4] rounded-2xl" />
          <div className="flex-1 h-64 bg-[#E7E5E4] rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="p-6 text-sm text-red-500">
        Product not found or you don't have access to it.
      </div>
    );
  }

  return (
    <div className="p-6 font-['Inter']">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-[#78716C] mb-4">
        <Link
          href="/dashboard"
          className="hover:text-[#059669] transition-colors duration-150"
        >
          Dashboard
        </Link>
        <ChevronRight size={14} className="text-[#A8A29E]" />
        <Link
          href="/dashboard/all-products"
          className="hover:text-[#059669] transition-colors duration-150"
        >
          All Products
        </Link>
        <ChevronRight size={14} className="text-[#A8A29E]" />
        <span className="text-[#292524] font-medium">{product.title}</span>
      </div>

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="font-['Nunito'] text-xl font-extrabold text-[#292524]">
          {product.title}
        </h2>
        <button
          onClick={() => router.push(`/dashboard/edit-product/${product.id}`)}
          className="flex items-center gap-1.5 bg-[#059669] hover:bg-[#047857] text-white text-sm font-medium px-4 py-2 rounded-full transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-8px_rgba(5,150,105,0.4)] active:translate-y-0"
        >
          <Pencil size={14} /> Edit Product
        </button>
      </div>

      <div className="flex gap-6">
        {/* Images */}
        <div className="w-64 shrink-0 space-y-2">
          {product.images?.length > 0 ? (
            product.images.map((img: any, i: number) => (
              <div
                key={i}
                className="relative h-40 rounded-2xl overflow-hidden border border-[#E7E5E4] bg-[#FAF8F3] transition-all duration-300 hover:border-[#059669]/40 hover:shadow-[0_8px_24px_-8px_rgba(120,53,15,0.14)]"
              >
                <Image
                  src={img.url}
                  alt={product.title}
                  fill
                  className="object-contain transition-transform duration-500 ease-out hover:scale-105"
                />
              </div>
            ))
          ) : (
            <div className="h-40 rounded-2xl border border-[#E7E5E4] bg-[#FAF8F3] flex items-center justify-center text-xs text-[#78716C]">
              No images
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 bg-white border border-[#E7E5E4] rounded-2xl shadow-[0_4px_20px_-4px_rgba(120,53,15,0.08)] p-6 space-y-3 transition-shadow duration-300 hover:shadow-[0_8px_30px_-8px_rgba(120,53,15,0.14)]">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-[#292524]">
              ${product.sale_price}
            </span>
            <span className="text-sm text-[#A8A29E] line-through">
              ${product.regular_price}
            </span>
          </div>
          <p className="text-sm text-[#78716C]">{product.short_description}</p>

          <div className="grid grid-cols-2 gap-y-2 text-sm pt-2">
            <span className="text-[#78716C]">Category</span>
            <span className="text-[#292524]">
              {product.category} / {product.subCategory}
            </span>
            <span className="text-[#78716C]">Stock</span>
            <span className="text-[#292524]">{product.stock}</span>
            <span className="text-[#78716C]">Brand</span>
            <span className="text-[#292524]">{product.brand || "—"}</span>
            <span className="text-[#78716C]">Warranty</span>
            <span className="text-[#292524]">{product.warranty || "—"}</span>
            <span className="text-[#78716C]">Slug</span>
            <span className="text-[#292524]">{product.slug}</span>
            <span className="text-[#78716C]">Status</span>
            <span className="text-[#292524]">
              {product.status}
              {product.isDeleted ? " (Deleted)" : ""}
            </span>
          </div>

          {product.detailed_description && (
            <div className="pt-4 border-t border-[#E7E5E4]">
              <h3 className="font-['Nunito'] text-sm font-bold text-[#292524] mb-2">
                Detailed Description
              </h3>
              <div
                className="prose prose-sm max-w-none text-[#78716C]"
                dangerouslySetInnerHTML={{
                  __html: product.detailed_description,
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Page;
