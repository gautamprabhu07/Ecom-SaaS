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
    return <div className="p-6 text-sm text-gray-500">Loading product...</div>;
  }

  if (isError || !product) {
    return (
      <div className="p-6 text-sm text-red-500">
        Product not found or you don't have access to it.
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-sm text-gray-500 mb-4">
        <Link href="/dashboard" className="hover:text-blue-600">
          Dashboard
        </Link>
        <ChevronRight size={14} />
        <Link href="/dashboard/all-products" className="hover:text-blue-600">
          All Products
        </Link>
        <ChevronRight size={14} />
        <span className="text-gray-700">{product.title}</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">{product.title}</h2>
        <button
          onClick={() => router.push(`/dashboard/edit-product/${product.id}`)}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
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
                className="relative h-40 rounded-xl overflow-hidden border border-gray-200 bg-gray-50"
              >
                <Image
                  src={img.url}
                  alt={product.title}
                  fill
                  className="object-contain"
                />
              </div>
            ))
          ) : (
            <div className="h-40 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center text-xs text-gray-400">
              No images
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 bg-white border border-gray-200 rounded-xl p-6 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-gray-900">
              ${product.sale_price}
            </span>
            <span className="text-sm text-gray-400 line-through">
              ${product.regular_price}
            </span>
          </div>
          <p className="text-sm text-gray-600">{product.short_description}</p>

          <div className="grid grid-cols-2 gap-y-2 text-sm pt-2">
            <span className="text-gray-500">Category</span>
            <span className="text-gray-800">
              {product.category} / {product.subCategory}
            </span>
            <span className="text-gray-500">Stock</span>
            <span className="text-gray-800">{product.stock}</span>
            <span className="text-gray-500">Brand</span>
            <span className="text-gray-800">{product.brand || "—"}</span>
            <span className="text-gray-500">Warranty</span>
            <span className="text-gray-800">{product.warranty || "—"}</span>
            <span className="text-gray-500">Slug</span>
            <span className="text-gray-800">{product.slug}</span>
            <span className="text-gray-500">Status</span>
            <span className="text-gray-800">
              {product.status}
              {product.isDeleted ? " (Deleted)" : ""}
            </span>
          </div>

          {product.detailed_description && (
            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Detailed Description
              </h3>
              <div
                className="prose prose-sm max-w-none text-gray-600"
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
