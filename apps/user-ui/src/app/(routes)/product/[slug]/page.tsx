<<<<<<< HEAD
//path: apps/user-ui/src/app/(routes)/product/[slug]/page.tsx
=======
//path: apps/user-ui/src/app/%28routes%29/product/%5Bslug%5D/page.tsx
>>>>>>> 8e6f03df1bed8880d94459fa06687a3233806394
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
<<<<<<< HEAD
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProductDetails(slug);
=======
  params: { slug: string };
}): Promise<Metadata> {
  const product = await fetchProductDetails(params.slug);
>>>>>>> 8e6f03df1bed8880d94459fa06687a3233806394

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

<<<<<<< HEAD
const Page = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;
  const productDetails = await fetchProductDetails(slug);
=======
const Page = async ({ params }: { params: { slug: string } }) => {
  const productDetails = await fetchProductDetails(params?.slug);
  console.log("Product Details:", productDetails);
>>>>>>> 8e6f03df1bed8880d94459fa06687a3233806394
  return <ProductDetails productDetails={productDetails} />;
};

export default Page;
