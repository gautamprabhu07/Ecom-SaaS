//path: apps/user-ui/src/app/(routes)/product/[slug]/page.tsx
import React from "react";
import { Metadata } from "next";
import axiosInstance from "../../../../utils/axiosInstance";
import ProductDetails from "apps/user-ui/src/shared/modules/product/product-details";

async function fetchProductDetails(slug: string) {
  const res = await axiosInstance.get(`/product/api/get-product/${slug}`);
  return res.data.product;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProductDetails(slug);

  return {
    title: `${product?.title} | E-Shop`,
    description:
      product?.description ||
      "Discover the latest products on E-Shop. Shop now for the best deals and offers.",
    openGraph: {
      title: product?.title,
      description: product?.description || "",
      images: [product?.images?.[0]?.url || ""],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: product?.title,
      description: product?.short_description || "",
      images: [product?.images?.[0]?.url || ""],
    },
  };
}

const Page = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;
  const productDetails = await fetchProductDetails(slug);
  return <ProductDetails productDetails={productDetails} />;
};

export default Page;
