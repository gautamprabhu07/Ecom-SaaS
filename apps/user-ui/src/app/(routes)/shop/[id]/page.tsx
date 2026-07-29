//Path: apps/user-ui/src/app/(routes)/shop/[id]/page.tsx
"use client";
import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../../../../utils/axiosInstance";
import useUser from "../../../../hooks/useUser";
import Image from "next/image";
import { ArrowLeft, MapPin, Clock, Users, Star, Heart } from "lucide-react";
import { useEffect } from "react";
import useLocationTracking from "../../../../hooks/useLocationTracking";
import useDeviceTracking from "../../../../hooks/useDeviceTracking";
import { sendKafkaEvent } from "../../../../actions/track-user";

const fetchShopDetails = async (shopId: string) => {
  const res = await axiosInstance.get(`/product/api/get-shop/${shopId}`);
  return res.data;
};

const Page = () => {
  const params = useParams();
  const shopId = params.id as string;
  const router = useRouter();
  const { user, isLoading: userLoading } = useUser();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"products" | "offers" | "reviews">(
    "products",
  );

  const { data, isLoading } = useQuery({
    queryKey: ["shop-details", shopId],
    queryFn: () => fetchShopDetails(shopId),
    enabled: !!shopId,
    staleTime: 1000 * 60 * 2,
  });

  const location = useLocationTracking();
  const deviceInfo = useDeviceTracking();

  const shop = data?.shop;

  useEffect(() => {
    if (userLoading) return;
    if (!location || !deviceInfo || !user?.id || !shop?.id) return;

    sendKafkaEvent({
      userId: user.id,
      shopId: shop.id,
      action: "shop_visit",
      country: location.country || "Unknown",
      city: location.city || "Unknown",
      device: deviceInfo || "Unknown Device",
    });
  }, [location, deviceInfo, userLoading, user?.id, shop?.id]);

  const followMutation = useMutation({
    mutationFn: async () => {
      const res = await axiosInstance.post("/product/api/follow-shop", {
        shopId,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-details", shopId] });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async () => {
      const res = await axiosInstance.post("/product/api/unfollow-shop", {
        shopId,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-details", shopId] });
    },
  });

  const handleFollowToggle = () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (shop?.isFollowing) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF8F3]">
        <div className="max-w-5xl mx-auto px-6 pt-10 animate-pulse">
          <div className="h-56 rounded-2xl bg-[#E7E5E4]" />
          <div className="flex items-end gap-4 -mt-12 px-2">
            <div className="w-24 h-24 rounded-full border-4 border-[#FAF8F3] bg-[#E7E5E4]" />
            <div className="flex-1 pb-2 space-y-2">
              <div className="h-5 w-40 bg-[#E7E5E4] rounded-full" />
              <div className="h-3.5 w-64 bg-[#E7E5E4] rounded-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-[#FAF8F3] flex flex-col items-center justify-center gap-3">
        <div className="w-16 h-16 rounded-full bg-white border border-[#E7E5E4] flex items-center justify-center shadow-[0_4px_20px_-4px_rgba(120,53,15,0.08)]">
          <span className="text-2xl">🏬</span>
        </div>
        <p className="text-sm text-[#78716C] font-['Inter']">Shop not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F3] font-['Inter']">
      {/* Back */}
      <div className="px-6 pt-6">
        <button
          onClick={() => router.back()}
          className="group flex items-center gap-1.5 text-sm font-medium text-[#78716C] hover:text-[#059669] transition-colors duration-200"
        >
          <ArrowLeft
            size={15}
            className="transition-transform duration-200 group-hover:-translate-x-1"
          />
          Back
        </button>
      </div>

      {/* Cover banner */}
      <div className="relative w-full h-56 rounded-2xl mx-auto max-w-5xl bg-linear-to-br from-[#D1FAE5] to-[#FAF8F3] mt-4 overflow-hidden shadow-[0_4px_20px_-4px_rgba(120,53,15,0.08)]">
        <Image
          src={shop.coverBanner || "/product-backup.jpg"}
          alt="Cover banner"
          fill
          className="object-cover transition-transform duration-700 ease-out hover:scale-105"
        />
      </div>

      {/* Shop details */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex items-end gap-4 relative">
          <div className="relative w-24 h-24 -mt-12 rounded-full border-4 border-[#FAF8F3] bg-[#D1FAE5] overflow-hidden shrink-0 shadow-[0_4px_20px_-4px_rgba(120,53,15,0.15)] transition-transform duration-300 hover:scale-105">
            <Image
              src={shop.avatar || "/profile-backup.jpg"}
              alt={shop.name}
              fill
              className="object-cover"
            />
          </div>

          <div className="flex-1 pb-2 pt-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h1 className="text-xl font-extrabold text-[#292524] font-['Nunito']">
                {shop.name}
              </h1>
              <button
                onClick={handleFollowToggle}
                disabled={
                  followMutation.isPending || unfollowMutation.isPending
                }
                className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:hover:translate-y-0 ${
                  shop.isFollowing
                    ? "bg-[#D1FAE5] text-[#047857] hover:bg-[#a7f3d0]"
                    : "bg-[#059669] text-white hover:bg-[#047857] hover:shadow-[0_10px_30px_-8px_rgba(5,150,105,0.45)]"
                }`}
              >
                <Heart
                  size={14}
                  fill={shop.isFollowing ? "currentColor" : "none"}
                  className="transition-transform duration-200"
                />
                {shop.isFollowing ? "Following" : "Follow"}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-2.5 text-sm text-[#78716C]">
              <span className="flex items-center gap-1">
                <Users size={14} />
                {shop.followersCount ?? 0} followers
              </span>
              <span className="flex items-center gap-1 text-[#292524] font-medium">
                <Star size={14} className="text-[#FDBA74] fill-[#FDBA74]" />
                {shop.ratings?.toFixed(1) ?? "N/A"}
              </span>
              {shop.opening_hours && (
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  {shop.opening_hours}
                </span>
              )}
              {shop.address && (
                <span className="flex items-center gap-1">
                  <MapPin size={14} />
                  {shop.address}
                </span>
              )}
            </div>

            {shop.bio && (
              <p className="text-sm text-[#78716C] mt-2.5 max-w-2xl leading-relaxed">
                {shop.bio}
              </p>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-[#E7E5E4] mt-8">
          {(["products", "offers", "reviews"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative px-4 py-2.5 text-sm font-semibold capitalize transition-colors duration-200 ${
                activeTab === tab
                  ? "text-[#059669]"
                  : "text-[#78716C] hover:text-[#292524]"
              }`}
            >
              {tab}
              <span
                className={`absolute left-0 right-0 -bottom-px h-0.5 bg-[#059669] rounded-full transition-transform duration-300 origin-center ${
                  activeTab === tab ? "scale-x-100" : "scale-x-0"
                }`}
              />
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="py-6">
          {activeTab === "products" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {data?.products?.length ? (
                data.products.map((product: any) => (
                  <a
                    key={product.id}
                    href={`/product/${product.slug}`}
                    className="group bg-white rounded-2xl border border-[#E7E5E4] shadow-[0_4px_20px_-4px_rgba(120,53,15,0.08)] overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-[#059669]/40 hover:shadow-[0_10px_30px_-6px_rgba(5,150,105,0.18)]"
                  >
                    <div className="relative h-32 bg-[#D1FAE5]/40 overflow-hidden">
                      <Image
                        src={product.images?.[0]?.url || "/product-backup.jpg"}
                        alt={product.title}
                        fill
                        className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                      />
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium text-[#292524] line-clamp-1 transition-colors duration-200 group-hover:text-[#059669]">
                        {product.title}
                      </p>
                      <p className="text-sm text-[#78716C] mt-0.5">
                        ${product.sale_price}
                      </p>
                    </div>
                  </a>
                ))
              ) : (
                <div className="col-span-full flex flex-col items-center py-12 text-center">
                  <div className="mb-3 w-14 h-14 rounded-full bg-[#D1FAE5] flex items-center justify-center">
                    <span className="text-xl">📦</span>
                  </div>
                  <p className="text-sm text-[#78716C]">No products yet.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "offers" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {data?.offers?.length ? (
                data.offers.map((offer: any) => (
                  <a
                    key={offer.id}
                    href={`/product/${offer.slug}`}
                    className="group bg-white rounded-2xl border border-[#E7E5E4] shadow-[0_4px_20px_-4px_rgba(120,53,15,0.08)] overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-[#059669]/40 hover:shadow-[0_10px_30px_-6px_rgba(5,150,105,0.18)]"
                  >
                    <div className="relative h-32 bg-[#D1FAE5]/40 overflow-hidden">
                      <Image
                        src={offer.images?.[0]?.url || "/product-backup.jpg"}
                        alt={offer.title}
                        fill
                        className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                      />
                      <span className="absolute top-2 left-2 bg-[#FDBA74] text-[#292524] text-[10px] font-bold px-2 py-0.5 rounded-full shadow-[0_4px_12px_-2px_rgba(120,53,15,0.25)]">
                        OFFER
                      </span>
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium text-[#292524] line-clamp-1 transition-colors duration-200 group-hover:text-[#059669]">
                        {offer.title}
                      </p>
                      <p className="text-sm text-[#78716C] mt-0.5">
                        ${offer.sale_price}
                      </p>
                    </div>
                  </a>
                ))
              ) : (
                <div className="col-span-full flex flex-col items-center py-12 text-center">
                  <div className="mb-3 w-14 h-14 rounded-full bg-[#D1FAE5] flex items-center justify-center">
                    <span className="text-xl">🏷️</span>
                  </div>
                  <p className="text-sm text-[#78716C]">No active offers.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="space-y-4">
              {data?.reviews?.length ? (
                data.reviews.map((review: any) => (
                  <div
                    key={review.id}
                    className="bg-white rounded-2xl border border-[#E7E5E4] p-4 transition-all duration-300 hover:shadow-[0_10px_30px_-6px_rgba(120,53,15,0.12)] hover:border-[#059669]/30"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-semibold text-[#292524]">
                        {review.user?.name ?? "Anonymous"}
                      </span>
                      <span className="flex items-center gap-1 text-xs font-medium text-[#78716C] bg-[#FDBA74]/20 px-2 py-0.5 rounded-full">
                        <Star
                          size={12}
                          className="fill-[#FDBA74] text-[#FDBA74]"
                        />
                        {review.rating}
                      </span>
                    </div>
                    {review.reviews && (
                      <p className="text-sm text-[#78716C] leading-relaxed">
                        {review.reviews}
                      </p>
                    )}
                    <p className="text-xs text-[#A8A29E] mt-1.5">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center py-12 text-center">
                  <div className="mb-3 w-14 h-14 rounded-full bg-[#D1FAE5] flex items-center justify-center">
                    <span className="text-xl">⭐</span>
                  </div>
                  <p className="text-sm text-[#78716C]">No reviews yet.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Page;
