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
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-gray-400">Loading shop...</p>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-gray-400">Shop not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back */}
      <div className="px-6 pt-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition"
        >
          <ArrowLeft size={15} />
          Back
        </button>
      </div>

      {/* Cover banner */}
      <div className="relative w-full h-56 bg-gray-200 mt-4 overflow-hidden">
        {shop.coverBanner && (
          <Image
            src={shop.coverBanner}
            alt="Cover banner"
            fill
            className="object-cover"
          />
        )}
      </div>

      {/* Shop details */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex items-end gap-4 -mt-12 relative">
          <div className="relative w-24 h-24 rounded-full border-4 border-white bg-gray-100 overflow-hidden shrink-0">
            {shop.avatar && (
              <Image
                src={shop.avatar}
                alt={shop.name}
                fill
                className="object-cover"
              />
            )}
          </div>

          <div className="flex-1 pb-2">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold text-gray-800">
                {shop.name}
              </h1>
              <button
                onClick={handleFollowToggle}
                disabled={
                  followMutation.isPending || unfollowMutation.isPending
                }
                className={`flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-60 ${
                  shop.isFollowing
                    ? "bg-red-50 text-red-600 hover:bg-red-100"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                <Heart
                  size={14}
                  fill={shop.isFollowing ? "currentColor" : "none"}
                />
                {shop.isFollowing ? "Following" : "Follow"}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Users size={14} />
                {shop.followersCount ?? 0} followers
              </span>
              <span className="flex items-center gap-1">
                <Star size={14} className="text-amber-400 fill-amber-400" />
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
              <p className="text-sm text-gray-600 mt-2 max-w-2xl">{shop.bio}</p>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-gray-200 mt-8">
          {(["products", "offers", "reviews"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium capitalize border-b-2 transition ${
                activeTab === tab
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab}
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
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition"
                  >
                    <div className="relative h-32 bg-gray-50">
                      {product.images?.[0]?.url && (
                        <Image
                          src={product.images[0].url}
                          alt={product.title}
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium text-gray-800 line-clamp-1">
                        {product.title}
                      </p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        ${product.sale_price}
                      </p>
                    </div>
                  </a>
                ))
              ) : (
                <p className="text-sm text-gray-400 col-span-full text-center py-10">
                  No products yet.
                </p>
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
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition"
                  >
                    <div className="relative h-32 bg-gray-50">
                      {offer.images?.[0]?.url && (
                        <Image
                          src={offer.images[0].url}
                          alt={offer.title}
                          fill
                          className="object-cover"
                        />
                      )}
                      <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded">
                        OFFER
                      </span>
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium text-gray-800 line-clamp-1">
                        {offer.title}
                      </p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        ${offer.sale_price}
                      </p>
                    </div>
                  </a>
                ))
              ) : (
                <p className="text-sm text-gray-400 col-span-full text-center py-10">
                  No active offers.
                </p>
              )}
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="space-y-4">
              {data?.reviews?.length ? (
                data.reviews.map((review: any) => (
                  <div
                    key={review.id}
                    className="bg-white rounded-xl border border-gray-200 p-4"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-gray-800">
                        {review.user?.name ?? "Anonymous"}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-amber-500">
                        <Star size={12} className="fill-amber-400" />
                        {review.rating}
                      </span>
                    </div>
                    {review.reviews && (
                      <p className="text-sm text-gray-600">{review.reviews}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1.5">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 text-center py-10">
                  No reviews yet.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Page;
