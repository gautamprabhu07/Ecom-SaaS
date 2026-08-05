<<<<<<< HEAD
//Path: apps/user-ui/src/shared/modules/product/product-details.tsx
=======
>>>>>>> 8e6f03df1bed8880d94459fa06687a3233806394
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
<<<<<<< HEAD
import React, { useState, useEffect } from "react";
import InnerImageZoom from "react-inner-image-zoom";
import "react-inner-image-zoom/lib/styles.min.css";
=======
import React, { useState } from "react";
import ReactImageMagnify from "react-image-magnify";
>>>>>>> 8e6f03df1bed8880d94459fa06687a3233806394
import Image from "next/image";
import Ratings from "../../components/ratings";
import Link from "next/link";
import { useStore } from "../../../store";
import useUser from "apps/user-ui/src/hooks/useUser";
import useLocationTracking from "apps/user-ui/src/hooks/useLocationTracking";
import useDeviceTracking from "apps/user-ui/src/hooks/useDeviceTracking";
<<<<<<< HEAD
import ProductCard from "../../components/section/cards/product-card";
import axiosInstance from "apps/user-ui/src/utils/axiosInstance";

const ProductDetails = ({ productDetails }: { productDetails: any }) => {
  const { user } = useUser();
=======

const ProductDetails = ({ productDetails }: { productDetails: any }) => {
  const { user, isLoading } = useUser();
>>>>>>> 8e6f03df1bed8880d94459fa06687a3233806394
  const location = useLocationTracking();
  const deviceInfo = useDeviceTracking();

  const [currentImage, setCurrentImage] = useState(
<<<<<<< HEAD
    productDetails?.images?.[0]?.url || "/product-backup.jpg",
=======
    productDetails?.images?.[0]?.url,
>>>>>>> 8e6f03df1bed8880d94459fa06687a3233806394
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSelected, setIsSelected] = useState(
    productDetails?.colors?.[0] || "",
  );
  const [isSizeSelected, setIsSizeSelected] = useState(
    productDetails?.sizes?.[0] || "",
  );
  const [quantity, setQuantity] = useState(1);
<<<<<<< HEAD

=======
  const [priceRange, setPriceRange] = useState([
    productDetails?.sale_price,
    1199,
  ]);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
>>>>>>> 8e6f03df1bed8880d94459fa06687a3233806394
  const addToCart = useStore((state: any) => state.addToCart);
  const cart = useStore((state: any) => state.cart);
  const isInCart = cart.some((item: any) => item.id === productDetails?.id);
  const addToWishlist = useStore((state: any) => state.addToWishlist);
  const removeFromWishlist = useStore((state: any) => state.removeFromWishlist);
  const wishlist = useStore((state: any) => state.wishlist);
  const isWishlisted = wishlist.some(
    (item: any) => item.id === productDetails?.id,
  );

<<<<<<< HEAD
  const [priceRange, setPriceRange] = useState([
    productDetails?.sale_price,
    1199,
  ]);

  const [reccommendedProducts, setReccommendedProducts] = useState([]);

  const prevImage = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setCurrentImage(
        productDetails?.images?.[currentIndex - 1]?.url ||
          "/product-backup.jpg",
      );
    }
  };
  const nextImage = () => {
    if (currentIndex < (productDetails?.images?.length || 0) - 1) {
      setCurrentIndex(currentIndex + 1);
      setCurrentImage(
        productDetails?.images?.[currentIndex + 1]?.url ||
          "/product-backup.jpg",
      );
    }
  };

  //hides the thumbnail strip when the product has no real images, so the
  //backup placeholder isn't shown twice (once as the main image, once as
  //the only "thumbnail")
  const hasImages = productDetails?.images?.some((img: any) => img?.url);
=======
  const prevImage = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setCurrentImage(productDetails?.images?.[currentIndex - 1]);
    }
  };

  const nextImage = () => {
    if (currentIndex < (productDetails?.images?.length || 0) - 1) {
      setCurrentIndex(currentIndex + 1);
      setCurrentImage(productDetails?.images?.[currentIndex + 1]);
    }
  };
>>>>>>> 8e6f03df1bed8880d94459fa06687a3233806394

  const discountPercentage = Math.round(
    ((productDetails?.regular_price - productDetails?.sale_price) /
      productDetails?.regular_price) *
      100,
  );

<<<<<<< HEAD
  const fetchFilteredProducts = async () => {
    try {
      const query = new URLSearchParams();

      query.set("priceRange", priceRange.join(","));
      query.set("page", "1");
      query.set("limit", "5");

      const res = await axiosInstance.get(
        `/product/api/get-filtered-products?${query.toString()}`,
      );
      setReccommendedProducts(res.data.products);
    } catch (error) {
      console.error("Error fetching filtered products:", error);
    }
  };

  useEffect(() => {
    fetchFilteredProducts();
  }, [priceRange]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 bg-[#FAF8F3]">
      <div className="flex gap-6">
        {/* Left — Images */}
        <div className="w-[380px] shrink-0 space-y-3">
          <div className="rounded-2xl overflow-hidden border border-[#E7E5E4] bg-white shadow-[0_4px_20px_-4px_rgba(120,53,15,0.08)] transition-shadow duration-300 hover:shadow-[0_8px_30px_-8px_rgba(120,53,15,0.16)]">
            <InnerImageZoom
              src={currentImage}
              zoomSrc={currentImage}
              zoomType="hover"
              hideHint
              imgAttributes={{
                alt: productDetails?.title || "",
                className: "rounded-lg object-contain",
              }}
            />
          </div>

          {/* Thumbnails */}
          {hasImages && (
            <div className="flex items-center gap-2">
              {productDetails?.images?.length > 4 && (
                <button
                  onClick={prevImage}
                  disabled={currentIndex === 0}
                  className="p-1.5 rounded-full border border-[#E7E5E4] transition-all duration-200 hover:bg-[#D1FAE5] hover:-translate-x-0.5 disabled:opacity-40 disabled:hover:translate-x-0"
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
                      setCurrentImage(image?.url || "/product-backup.jpg");
                    }}
                    className={`relative w-14 h-14 rounded-xl overflow-hidden border-2 cursor-pointer transition-all duration-200 hover:scale-105 shrink-0 ${currentIndex === index ? "border-[#059669]" : "border-[#E7E5E4] hover:border-[#059669]/50"}`}
                  >
                    <Image
                      src={image?.url || "/product-backup.jpg"}
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
                  disabled={
                    currentIndex === productDetails?.images?.length - 1
                  }
                  className="p-1.5 rounded-full border border-[#E7E5E4] transition-all duration-200 hover:bg-[#D1FAE5] hover:translate-x-0.5 disabled:opacity-40 disabled:hover:translate-x-0"
                >
                  <ChevronRight size={16} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Middle — Product info */}
        <div className="flex-1 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <h1 className="font-heading text-xl font-extrabold text-[#292524] leading-snug">
              {productDetails?.title}
            </h1>
            <button
=======
  return (
    <div>
      <div>
        {/*left column product images*/}
        <div>
          <div>
            {/*Main image with zoom*/}
            <ReactImageMagnify
              {...{
                smallImage: {
                  alt: productDetails?.title,
                  isFluidWidth: true,
                  src: currentImage || "",
                },
                largeImage: {
                  src: currentImage,
                  width: 1200,
                  height: 1800,
                },
                enlargedImageContainerDimensions: {
                  width: "200%",
                  height: "200%",
                },
                enlargedImageStyle: { border: "none", boxShadow: "none" },
                enlargedImagePosition: "right",
              }}
            />
          </div>
          {/* Thumbnail images array */}
          <div>
            {productDetails?.images?.length > 4 && (
              <button onClick={prevImage} disabled={currentIndex === 0}>
                <ChevronLeft />
              </button>
            )}
            <div>
              {productDetails?.images?.map((image: any, index: number) => (
                <Image
                  key={index}
                  src={image.url}
                  alt="Thumbnail"
                  width={60}
                  height={60}
                  onClick={() => {
                    setCurrentIndex(index);
                    setCurrentImage(image);
                  }}
                />
              ))}
            </div>
            {productDetails?.images?.length > 4 && (
              <button
                onClick={nextImage}
                disabled={currentIndex === productDetails?.images?.length - 1}
              >
                <ChevronRight />
              </button>
            )}
          </div>
        </div>

        {/*Middle column product details*/}
        <div>
          <h1>{productDetails?.title}</h1>
          <div>
            <div>
              <Ratings rating={productDetails?.rating} />
              <Link href={"#reviews"}>(0 Reviews)</Link>
            </div>
          </div>
          <div>
            <Heart
              fill={isWishlisted ? "red" : "transparent"}
              color={isWishlisted ? "red" : "transparent"}
>>>>>>> 8e6f03df1bed8880d94459fa06687a3233806394
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
<<<<<<< HEAD
              className="shrink-0 p-2 rounded-full transition-all duration-200 hover:bg-[#FDBA74]/20 hover:scale-110"
            >
              <Heart
                size={20}
                fill={isWishlisted ? "#FDBA74" : "transparent"}
                color={isWishlisted ? "#FDBA74" : "#78716C"}
                className="transition-colors duration-200"
              />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Ratings rating={productDetails?.rating} />
            <Link
              href="#reviews"
              className="text-sm text-[#059669] hover:text-[#047857] hover:underline transition-colors duration-150"
            >
              (0 Reviews)
            </Link>
          </div>

          <p className="text-sm text-[#78716C]">
            Brand:{" "}
            <span className="font-medium text-[#292524]">
              {productDetails?.brand || "No Brand"}
            </span>
          </p>

          {/* Price */}
          <div className="flex items-center gap-3">
            <span className="font-heading text-2xl font-extrabold text-[#292524]">
              ${productDetails?.sale_price}
            </span>
            {productDetails?.regular_price && (
              <>
                <span className="text-sm text-[#78716C] line-through">
                  ${productDetails?.regular_price}
                </span>
                <span className="text-sm text-[#059669] font-semibold bg-[#D1FAE5] px-2.5 py-0.5 rounded-full">
                  {discountPercentage}% Off
                </span>
              </>
            )}
          </div>

          {/* Colors */}
          {productDetails?.colors?.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-[#292524]">Color:</span>
              <div className="flex gap-2">
                {productDetails?.colors?.map((color: any, index: number) => (
                  <button
                    key={index}
                    style={{ backgroundColor: color }}
                    onClick={() => setIsSelected(color)}
                    className={`w-7 h-7 rounded-full border-2 transition-all duration-200 hover:scale-110 ${isSelected === color ? "border-[#059669] scale-110" : "border-[#E7E5E4]"}`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Sizes */}
          {productDetails?.sizes?.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-[#292524]">Size:</span>
              <div className="flex gap-2">
                {productDetails?.sizes?.map((size: any, index: number) => (
                  <button
                    key={index}
                    onClick={() => setIsSizeSelected(size)}
                    className={`px-3 py-1 rounded-full text-sm font-medium border transition-all duration-200 hover:-translate-y-0.5 ${isSizeSelected === size ? "bg-[#059669] text-white border-[#059669] shadow-[0_4px_14px_-4px_rgba(5,150,105,0.4)]" : "bg-white text-[#78716C] border-[#E7E5E4] hover:border-[#059669]"}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity + Stock + Cart */}
          <div className="flex items-center gap-4 pt-1">
            <div className="flex items-center border border-[#E7E5E4] rounded-full overflow-hidden transition-colors duration-200 hover:border-[#059669]/40">
              <button
                onClick={() => setQuantity((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 text-[#78716C] hover:bg-[#D1FAE5] hover:text-[#059669] transition-colors duration-150"
              >
                −
              </button>
              <span className="px-4 text-sm font-medium text-[#292524]">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((p) => p + 1)}
                className="px-3 py-1.5 text-[#78716C] hover:bg-[#D1FAE5] hover:text-[#059669] transition-colors duration-150"
              >
                +
              </button>
            </div>

            {productDetails?.stock > 0 ? (
              <span className="text-xs text-[#059669] font-semibold bg-[#D1FAE5] px-2.5 py-1 rounded-full">
                In Stock ({productDetails?.stock})
              </span>
            ) : (
              <span className="text-xs text-red-500 font-semibold bg-red-50 px-2.5 py-1 rounded-full">
                Out of Stock
              </span>
            )}
          </div>

          <button
=======
            />
          </div>
        </div>
        <div>
          <span>
            Brand: <span>{productDetails?.brand || "No Brand"}</span>
          </span>
        </div>

        <div>
          <span>${productDetails?.sale_price}</span>
        </div>
        <div>
          <span>{productDetails?.regular_price}</span>
          <span>{discountPercentage}% Off</span>
        </div>
        <div>
          <div>
            {/*Color options*/}
            {productDetails?.colors?.length > 0 && (
              <div>
                <span>Color:</span>
                <div>
                  {productDetails?.colors?.map((color: any, index: number) => (
                    <button
                      key={index}
                      style={{ backgroundColor: color }}
                      className={`${isSelected === color ? " " : " "}`}
                      onClick={() => setIsSelected(color)}
                    ></button>
                  ))}
                </div>
              </div>
            )}

            {/*Size options*/}
            {productDetails?.sizes?.length > 0 && (
              <div>
                <span>Size:</span>
                <div>
                  {productDetails?.sizes?.map((size: any, index: number) => (
                    <button
                      key={index}
                      className={`${isSizeSelected === size ? " " : " "}`}
                      onClick={() => setIsSelected(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <div>
            <div>
              <button
                onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
              >
                -
              </button>
              <span>{quantity}</span>
              <button onClick={() => setQuantity((prev) => prev + 1)}>+</button>
            </div>
          </div>
          <div>
            {productDetails?.stock > 0 ? (
              <>
                <span>In Stock</span>
                <span>(Stock {productDetails?.stock})</span>
              </>
            ) : (
              <span>Out of Stock</span>
            )}
          </div>
          <button
            className={`${isInCart ? "bg-gray-500 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-700"}`}
>>>>>>> 8e6f03df1bed8880d94459fa06687a3233806394
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
<<<<<<< HEAD
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-white transition-all duration-200 shadow-[0_4px_20px_-4px_rgba(120,53,15,0.08)] ${isInCart ? "bg-[#78716C] cursor-not-allowed" : "bg-[#059669] hover:bg-[#047857] hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-8px_rgba(5,150,105,0.4)] active:translate-y-0"}`}
          >
            <ShoppingCartIcon size={16} />
=======
          >
            <ShoppingCartIcon />
>>>>>>> 8e6f03df1bed8880d94459fa06687a3233806394
            {isInCart ? "Added to Cart" : "Add to Cart"}
          </button>
        </div>

<<<<<<< HEAD
        {/* Right — Seller + Delivery */}
        <div className="w-64 shrink-0 space-y-4">
          {/* Delivery */}
          <div className="bg-white border border-[#E7E5E4] rounded-2xl p-4 space-y-2 shadow-[0_4px_20px_-4px_rgba(120,53,15,0.08)] transition-shadow duration-300 hover:shadow-[0_8px_30px_-8px_rgba(120,53,15,0.14)]">
            <p className="text-sm font-semibold text-[#292524]">
              Delivery Options
            </p>
            <div className="flex items-center gap-2 text-sm text-[#78716C]">
              <MapPin size={14} className="text-[#059669]" />
              <span>{location?.city + ", " + location?.country}</span>
            </div>
          </div>

          {/* Return & Warranty */}
          <div className="bg-white border border-[#E7E5E4] rounded-2xl p-4 space-y-2 shadow-[0_4px_20px_-4px_rgba(120,53,15,0.08)] transition-shadow duration-300 hover:shadow-[0_8px_30px_-8px_rgba(120,53,15,0.14)]">
            <p className="text-sm font-semibold text-[#292524]">
              Return & Warranty
            </p>
            <div className="flex items-center gap-2 text-sm text-[#78716C]">
              <Package size={14} className="text-[#059669]" />
              <span>7 days return</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-[#78716C]">
              <WalletMinimal size={14} className="text-[#059669]" />
              <span>Warranty not available</span>
            </div>
          </div>

          {/* Seller */}
          <div className="bg-white border border-[#E7E5E4] rounded-2xl p-4 space-y-3 shadow-[0_4px_20px_-4px_rgba(120,53,15,0.08)] transition-shadow duration-300 hover:shadow-[0_8px_30px_-8px_rgba(120,53,15,0.14)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#78716C]">Sold by</p>
                <p className="font-heading text-sm font-bold text-[#292524]">
                  {productDetails?.shop?.name || "Unknown Shop"}
                </p>
              </div>
              <Link
                href="#"
                className="flex items-center gap-1 text-xs text-[#059669] border border-[#059669]/30 px-2.5 py-1 rounded-full transition-all duration-200 hover:bg-[#D1FAE5] hover:-translate-y-0.5"
              >
                <MessageSquareText size={12} /> Chat
              </Link>
            </div>

            <div className="space-y-1.5 text-xs text-[#78716C]">
              {[
                { label: "Positive Ratings", value: "88%" },
                { label: "Ships on Time", value: "90%" },
                { label: "Chat Response", value: "95%" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <span>{label}</span>
                  <span className="font-medium text-[#292524]">{value}</span>
                </div>
              ))}
            </div>

            <Link
              href={`/shop/${productDetails?.Shop?.id}`}
              className="block text-center text-sm text-[#059669] border border-[#059669]/30 py-1.5 rounded-full transition-all duration-200 hover:bg-[#D1FAE5] hover:-translate-y-0.5"
            >
              Go to Store
            </Link>
          </div>
        </div>
      </div>

      {/* Description + Reviews */}
      <div className="mt-10 grid grid-cols-1 gap-6">
        <div className="bg-white border border-[#E7E5E4] rounded-2xl p-6 shadow-[0_4px_20px_-4px_rgba(120,53,15,0.08)] transition-shadow duration-300 hover:shadow-[0_8px_30px_-8px_rgba(120,53,15,0.14)]">
          <h3 className="font-heading text-lg font-bold text-[#292524] mb-3">
            Product details of {productDetails?.title}
          </h3>
          <div
            className="prose prose-sm max-w-none text-[#78716C]"
            dangerouslySetInnerHTML={{
              __html: productDetails?.detailed_description,
            }}
          ></div>
        </div>

        <div
          id="reviews"
          className="bg-white border border-[#E7E5E4] rounded-2xl p-6 shadow-[0_4px_20px_-4px_rgba(120,53,15,0.08)] transition-shadow duration-300 hover:shadow-[0_8px_30px_-8px_rgba(120,53,15,0.14)]"
        >
          <h3 className="font-heading text-lg font-bold text-[#292524] mb-2">
            Rating and Reviews
          </h3>
          <p className="text-sm text-[#78716C]">No Reviews available yet</p>
        </div>
      </div>

      {/* You may also like */}
      <div className="mt-10">
        <h3 className="font-heading text-lg font-bold text-[#292524] mb-4">
          You may also like...
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {reccommendedProducts?.map((i: any) => (
            <ProductCard key={i.id} product={i} />
          ))}
        </div>
      </div>
=======
        {/*right column + seller information*/}
        <div>
          <div>
            <span>Delivery options</span>
            <div>
              <MapPin />
              <span> {location?.city + ", " + location?.country}</span>
            </div>
          </div>

          <div>
            <span>Return & warranty</span>
            <div>
              <Package />
              <span>7 days return</span>
            </div>

            <div>
              <WalletMinimal />
              <span>Warranty not available</span>
            </div>
          </div>
          <div>
            <div>
              {/*Sold by section*/}
              <div>
                <div>
                  <span>Sold by</span>
                  <span>{productDetails?.shop?.name || "Unknown Shop"}</span>
                </div>
                <Link href={"#"}>
                  <MessageSquareText />
                  Chat Now
                </Link>
              </div>

              {/*Seller performance stats*/}
              <div>
                <div>
                  <p>Positive Seller Ratings</p>
                  <p>88%</p>
                </div>
              </div>
              <div>
                <p>Ship on Time</p>
                <p>90%</p>
              </div>
              <div>
                <p>Chat Response Rate</p>
                <p>95%</p>
              </div>
            </div>
            {/*Go to store*/}
            <Link href={`/shop/${productDetails?.Shop?.id}`}>Go to Store</Link>
          </div>
        </div>
      </div>
>>>>>>> 8e6f03df1bed8880d94459fa06687a3233806394
    </div>
  );
};

export default ProductDetails;
