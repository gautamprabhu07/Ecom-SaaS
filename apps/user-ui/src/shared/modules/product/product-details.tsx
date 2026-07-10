"use client";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  MapPin,
  MessageSquareText,
  Package,
  ShoppingCartIcon,
  WalletMinimal,
} from "lucide-react";
import React, { useState } from "react";
import InnerImageZoom from "react-inner-image-zoom";
import Image from "next/image";
import Ratings from "../../components/ratings";
import Link from "next/link";
import { useStore } from "../../../store";
import useUser from "apps/user-ui/src/hooks/useUser";
import useLocationTracking from "apps/user-ui/src/hooks/useLocationTracking";
import useDeviceTracking from "apps/user-ui/src/hooks/useDeviceTracking";

const ProductDetails = ({ productDetails }: { productDetails: any }) => {
  const { user } = useUser();
  const location = useLocationTracking();
  const deviceInfo = useDeviceTracking();

  const [currentImage, setCurrentImage] = useState(
    productDetails?.images?.[0]?.url,
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSelected, setIsSelected] = useState(
    productDetails?.colors?.[0] || "",
  );
  const [isSizeSelected, setIsSizeSelected] = useState(
    productDetails?.sizes?.[0] || "",
  );
  const [quantity, setQuantity] = useState(1);

  const addToCart = useStore((state: any) => state.addToCart);
  const cart = useStore((state: any) => state.cart);
  const isInCart = cart.some((item: any) => item.id === productDetails?.id);
  const addToWishlist = useStore((state: any) => state.addToWishlist);
  const removeFromWishlist = useStore((state: any) => state.removeFromWishlist);
  const wishlist = useStore((state: any) => state.wishlist);
  const isWishlisted = wishlist.some(
    (item: any) => item.id === productDetails?.id,
  );

  const prevImage = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setCurrentImage(productDetails?.images?.[currentIndex - 1]?.url);
    }
  };
  const nextImage = () => {
    if (currentIndex < (productDetails?.images?.length || 0) - 1) {
      setCurrentIndex(currentIndex + 1);
      setCurrentImage(productDetails?.images?.[currentIndex + 1]?.url);
    }
  };

  const discountPercentage = Math.round(
    ((productDetails?.regular_price - productDetails?.sale_price) /
      productDetails?.regular_price) *
      100,
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex gap-6">
        {/* Left — Images */}
        <div className="w-[380px] shrink-0 space-y-3">
          <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
            <InnerImageZoom
              src={currentImage || ""}
              zoomSrc={currentImage || ""}
              zoomType="hover"
              hideHint
              imgAttributes={{
                alt: productDetails?.title || "",
                className: "rounded-lg object-contain",
              }}
            />
          </div>

          {/* Thumbnails */}
          <div className="flex items-center gap-2">
            {productDetails?.images?.length > 4 && (
              <button
                onClick={prevImage}
                disabled={currentIndex === 0}
                className="p-1 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40 transition"
              >
                <ChevronLeft size={16} />
              </button>
            )}
            <div className="flex gap-2 overflow-hidden">
              {productDetails?.images?.map((image: any, index: number) => (
                <div
                  key={index}
                  onClick={() => {
                    setCurrentIndex(index);
                    setCurrentImage(image.url);
                  }}
                  className={`relative w-14 h-14 rounded-lg overflow-hidden border-2 cursor-pointer transition shrink-0 ${currentIndex === index ? "border-blue-500" : "border-gray-200"}`}
                >
                  <Image
                    src={image.url}
                    alt="Thumbnail"
                    layout="fill"
                    objectFit="cover"
                  />
                </div>
              ))}
            </div>
            {productDetails?.images?.length > 4 && (
              <button
                onClick={nextImage}
                disabled={currentIndex === productDetails?.images?.length - 1}
                className="p-1 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40 transition"
              >
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Middle — Product info */}
        <div className="flex-1 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-xl font-semibold text-gray-800 leading-snug">
              {productDetails?.title}
            </h1>
            <button
              onClick={() =>
                isWishlisted
                  ? removeFromWishlist(
                      productDetails?.id,
                      user,
                      location,
                      deviceInfo,
                    )
                  : addToWishlist(
                      {
                        ...productDetails,
                        quantity,
                        selectedOptions: {
                          color: isSelected,
                          size: isSizeSelected,
                        },
                      },
                      user,
                      location,
                      deviceInfo,
                    )
              }
              className="shrink-0 p-2 rounded-full hover:bg-red-50 transition"
            >
              <Heart
                size={20}
                fill={isWishlisted ? "red" : "transparent"}
                color={isWishlisted ? "red" : "gray"}
              />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Ratings rating={productDetails?.rating} />
            <Link
              href="#reviews"
              className="text-sm text-blue-600 hover:underline"
            >
              (0 Reviews)
            </Link>
          </div>

          <p className="text-sm text-gray-500">
            Brand:{" "}
            <span className="font-medium text-gray-700">
              {productDetails?.brand || "No Brand"}
            </span>
          </p>

          {/* Price */}
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-gray-900">
              ${productDetails?.sale_price}
            </span>
            {productDetails?.regular_price && (
              <>
                <span className="text-sm text-gray-400 line-through">
                  ${productDetails?.regular_price}
                </span>
                <span className="text-sm text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">
                  {discountPercentage}% Off
                </span>
              </>
            )}
          </div>

          {/* Colors */}
          {productDetails?.colors?.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">Color:</span>
              <div className="flex gap-2">
                {productDetails?.colors?.map((color: any, index: number) => (
                  <button
                    key={index}
                    style={{ backgroundColor: color }}
                    onClick={() => setIsSelected(color)}
                    className={`w-7 h-7 rounded-full border-2 transition ${isSelected === color ? "border-blue-500 scale-110" : "border-gray-300"}`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Sizes */}
          {productDetails?.sizes?.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">Size:</span>
              <div className="flex gap-2">
                {productDetails?.sizes?.map((size: any, index: number) => (
                  <button
                    key={index}
                    onClick={() => setIsSizeSelected(size)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium border transition ${isSizeSelected === size ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity + Stock + Cart */}
          <div className="flex items-center gap-4 pt-1">
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setQuantity((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 transition"
              >
                −
              </button>
              <span className="px-4 text-sm font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity((p) => p + 1)}
                className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 transition"
              >
                +
              </button>
            </div>

            {productDetails?.stock > 0 ? (
              <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full">
                In Stock ({productDetails?.stock})
              </span>
            ) : (
              <span className="text-xs text-red-500 font-medium bg-red-50 px-2 py-1 rounded-full">
                Out of Stock
              </span>
            )}
          </div>

          <button
            onClick={() =>
              addToCart(
                {
                  ...productDetails,
                  quantity,
                  selectedOptions: { color: isSelected, size: isSizeSelected },
                },
                user,
                location,
                deviceInfo,
              )
            }
            disabled={isInCart}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium text-white transition ${isInCart ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
          >
            <ShoppingCartIcon size={16} />
            {isInCart ? "Added to Cart" : "Add to Cart"}
          </button>
        </div>

        {/* Right — Seller + Delivery */}
        <div className="w-64 shrink-0 space-y-4">
          {/* Delivery */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
            <p className="text-sm font-semibold text-gray-700">
              Delivery Options
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin size={14} className="text-gray-400" />
              <span>{location?.city + ", " + location?.country}</span>
            </div>
          </div>

          {/* Return & Warranty */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
            <p className="text-sm font-semibold text-gray-700">
              Return & Warranty
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Package size={14} className="text-gray-400" />
              <span>7 days return</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <WalletMinimal size={14} className="text-gray-400" />
              <span>Warranty not available</span>
            </div>
          </div>

          {/* Seller */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Sold by</p>
                <p className="text-sm font-semibold text-gray-800">
                  {productDetails?.shop?.name || "Unknown Shop"}
                </p>
              </div>
              <Link
                href="#"
                className="flex items-center gap-1 text-xs text-blue-600 border border-blue-200 px-2 py-1 rounded-lg hover:bg-blue-50 transition"
              >
                <MessageSquareText size={12} /> Chat
              </Link>
            </div>

            <div className="space-y-1.5 text-xs text-gray-600">
              {[
                { label: "Positive Ratings", value: "88%" },
                { label: "Ships on Time", value: "90%" },
                { label: "Chat Response", value: "95%" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <span>{label}</span>
                  <span className="font-medium text-gray-800">{value}</span>
                </div>
              ))}
            </div>

            <Link
              href={`/shop/${productDetails?.Shop?.id}`}
              className="block text-center text-sm text-blue-600 border border-blue-200 py-1.5 rounded-lg hover:bg-blue-50 transition"
            >
              Go to Store
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
