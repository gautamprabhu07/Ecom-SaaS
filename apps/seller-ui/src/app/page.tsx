//Path: apps/seller-ui/src/app/page.tsx
"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import useSeller from "../hooks/useSeller";

const Page = () => {
  const { seller, isLoading } = useSeller();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (seller) {
        router.replace("/dashboard/profile");
      } else {
        router.replace("/login");
      }
    }
  }, [seller, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-sm text-gray-400">Loading...</p>
    </div>
  );
};

export default Page;
