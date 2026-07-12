//shopcard.tsx
"use client";
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin, Star, Heart } from "lucide-react";
import axiosInstance from "apps/user-ui/src/utils/axiosInstance";
import useUser from "apps/user-ui/src/hooks/useUser";

interface ShopCardProps {
  shop: {
    id: string;
    name: string;
    description?: string;
    avatar?: { url: string }[];
    coverBanner?: string;
    address?: string;
    followers?: { id: string; userId: string; shopsId: string }[];
    rating?: number;
    category?: string;
  };
}

const ShopCard: React.FC<ShopCardProps> = ({ shop }) => {
  const { user } = useUser();
  const [isFollowing, setIsFollowing] = useState(
    shop.followers?.some((f) => f.userId === user?.id) ?? false,
  );
  const [loading, setLoading] = useState(false);

  const toggleFollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      window.location.href = "/login";
      return;
    }
    setLoading(true);
    try {
      if (isFollowing) {
        await axiosInstance.post("/product/api/unfollow-shop", {
          shopId: shop.id,
        });
      } else {
        await axiosInstance.post("/product/api/follow-shop", {
          shopId: shop.id,
        });
      }
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error("Error toggling follow:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition">
      <div className="relative h-28 bg-gray-100">
        {shop.coverBanner && (
          <Image
            src={shop.coverBanner}
            alt={shop.name}
            layout="fill"
            objectFit="cover"
          />
        )}
        <button
          onClick={toggleFollow}
          disabled={loading}
          className={`absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full shadow transition ${isFollowing ? "bg-red-500 text-white" : "bg-white text-gray-500 hover:text-red-500"}`}
        >
          <Heart size={13} fill={isFollowing ? "white" : "none"} />
        </button>
      </div>

      <div className="relative -mt-8 ml-4">
        <div className="relative w-16 h-16 rounded-full overflow-hidden border-4 border-white shadow">
          {shop.avatar?.[0]?.url && (
            <Image
              src={shop.avatar[0].url}
              alt={shop.name}
              layout="fill"
              objectFit="cover"
            />
          )}
        </div>
      </div>

      <div className="px-4 pt-2 pb-4 space-y-2">
        <div>
          <h3 className="text-base font-semibold text-gray-800">
            {shop?.name}
          </h3>
          <p className="text-xs text-gray-400">
            {shop?.followers?.length ?? 0} followers
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-500">
          {shop.address && (
            <span className="flex items-center gap-1">
              <MapPin size={12} className="text-gray-400" />
              {shop.address}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Star size={12} className="text-amber-400 fill-amber-400" />
            {shop.rating ?? "N/A"}
          </span>
        </div>

        {shop.category && (
          <span className="inline-block text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
            {shop.category}
          </span>
        )}

        <Link
          href={`/shop/${shop.id}`}
          className="flex items-center gap-1.5 text-sm text-blue-600 font-medium hover:underline mt-1"
        >
          Visit Shop <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
};

export default ShopCard;
