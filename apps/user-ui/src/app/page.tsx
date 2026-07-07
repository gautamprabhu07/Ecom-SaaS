// Path: apps/user-ui/src/app/page.tsx
"use client";
import React from "react";
import Header from "../shared/widgets/header";
import Hero from "../shared/modules/hero";
import { useQuery } from "@tanstack/react-query";
import SectionTitle from "../shared/components/section/section-title";
import axiosInstance from "../utils/axiosInstance";
import ProductCard from "../shared/components/section/cards/product-card";

const Page = () => {
  const {
    data: products,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await axiosInstance.get(
        "/product/api/get-all-products?page=1&limit=10",
      );
      return response.data;
    },
    staleTime: 1000 * 60 * 2,
  });

  const { data: latestProducts } = useQuery({
    queryKey: ["latest-products"],
    queryFn: async () => {
      const response = await axiosInstance.get(
        "/product/api/get-all-products?page=1&limit=10&type=latest",
      );
      return response.data.products;
    },
    staleTime: 1000 * 60 * 2,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Hero />

      {/* Featured Products */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        <SectionTitle title="Featured Products" />

        {/* Skeleton */}
        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-6">
            {Array.from({ length: 10 }).map((_, index) => (
              <div
                key={index}
                className="bg-white rounded-xl border border-gray-200 h-64 animate-pulse"
              />
            ))}
          </div>
        )}

        {!isLoading && !isError && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-6">
            {products?.products?.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;
