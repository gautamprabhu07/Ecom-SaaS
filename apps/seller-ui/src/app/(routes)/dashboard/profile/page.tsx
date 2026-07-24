//Path: apps/seller-ui/src/app/(routes)/dashboard/profile/page.tsx
"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../../../../utils/axiosInstance";
import useSeller from "../../../../hooks/useSeller";
import Image from "next/image";
import {
  ArrowLeft,
  Pencil,
  MapPin,
  Clock,
  Users,
  Star,
  Camera,
  X,
} from "lucide-react";

const fetchSellerProfile = async () => {
  const res = await axiosInstance.get("/seller/api/get-seller-profile");
  return res.data;
};

const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

const Page = () => {
  const router = useRouter();
  const { seller, isLoading: sellerLoading } = useSeller();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"products" | "offers" | "reviews">(
    "products",
  );
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    bio: "",
    address: "",
    opening_hours: "",
    website: "",
  });

  useEffect(() => {
    if (!sellerLoading && !seller) {
      router.push("/login");
    }
  }, [sellerLoading, seller, router]);

  const { data, isLoading } = useQuery({
    queryKey: ["seller-profile"],
    queryFn: fetchSellerProfile,
    enabled: !!seller,
    staleTime: 1000 * 60 * 2,
  });

  useEffect(() => {
    if (data?.shop) {
      setProfileForm({
        name: data.shop.name || "",
        bio: data.shop.bio || "",
        address: data.shop.address || "",
        opening_hours: data.shop.opening_hours || "",
        website: data.shop.website || "",
      });
    }
  }, [data]);

  const updateProfileMutation = useMutation({
    mutationFn: async (payload: typeof profileForm) => {
      const res = await axiosInstance.put(
        "/seller/api/update-shop-profile",
        payload,
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-profile"] });
      setShowEditProfile(false);
    },
  });

  const updateCoverMutation = useMutation({
    mutationFn: async (fileName: string) => {
      const res = await axiosInstance.post("/seller/api/update-shop-cover", {
        fileName,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-profile"] });
    },
  });

  const updateAvatarMutation = useMutation({
    mutationFn: async (fileName: string) => {
      const res = await axiosInstance.post("/seller/api/update-shop-avatar", {
        fileName,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-profile"] });
    },
  });

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await convertFileToBase64(file);
    updateCoverMutation.mutate(base64);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await convertFileToBase64(file);
    updateAvatarMutation.mutate(base64);
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileForm);
  };

  if (sellerLoading || (seller && isLoading)) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-gray-400">Loading profile...</p>
      </div>
    );
  }

  if (!seller) {
    return null; // redirect handled in useEffect
  }

  const shop = data?.shop;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back to dashboard */}
      <div className="px-6 pt-6">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition"
        >
          <ArrowLeft size={15} />
          Back to Dashboard
        </button>
      </div>

      {/* Cover banner */}
      <div className="relative w-full h-56 bg-gray-200 mt-4 overflow-hidden">
        {shop?.coverBanner && (
          <Image
            src={shop.coverBanner}
            alt="Cover banner"
            fill
            className="object-cover"
          />
        )}
        <label className="absolute top-4 right-4 flex items-center gap-1.5 bg-white/90 hover:bg-white text-gray-700 text-xs font-medium px-3 py-2 rounded-lg shadow cursor-pointer transition">
          <Camera size={14} />
          {updateCoverMutation.isPending ? "Uploading..." : "Edit Cover"}
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={handleCoverChange}
          />
        </label>
      </div>

      {/* Shop details */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex items-end gap-4 -mt-12 relative">
          <div className="relative w-24 h-24 rounded-full border-4 border-white bg-gray-100 overflow-hidden shrink-0">
            {shop?.avatar && (
              <Image
                src={shop.avatar}
                alt={shop.name}
                fill
                className="object-cover"
              />
            )}
            <label className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/40 text-white opacity-0 hover:opacity-100 transition cursor-pointer">
              <Camera size={18} />
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={handleAvatarChange}
              />
            </label>
          </div>

          <div className="flex-1 pb-2">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold text-gray-800">
                {shop?.name}
              </h1>
              <button
                onClick={() => setShowEditProfile(true)}
                className="flex items-center gap-1.5 text-sm text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition"
              >
                <Pencil size={13} />
                Edit Profile
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Users size={14} />
                {shop?.followersCount ?? 0} followers
              </span>
              <span className="flex items-center gap-1">
                <Star size={14} className="text-amber-400 fill-amber-400" />
                {shop?.ratings?.toFixed(1) ?? "N/A"}
              </span>
              {shop?.opening_hours && (
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  {shop.opening_hours}
                </span>
              )}
              {shop?.address && (
                <span className="flex items-center gap-1">
                  <MapPin size={14} />
                  {shop.address}
                </span>
              )}
            </div>

            {shop?.bio && (
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
                  <div
                    key={product.id}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden"
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
                  </div>
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
                  <div
                    key={offer.id}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden"
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
                  </div>
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

      {/* Edit profile modal */}
      {showEditProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-800">
                Edit Shop Profile
              </h3>
              <button
                onClick={() => setShowEditProfile(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="Shop name"
                value={profileForm.name}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, name: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                placeholder="Bio"
                value={profileForm.bio}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, bio: e.target.value })
                }
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Address"
                value={profileForm.address}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, address: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Opening hours (e.g. 9 AM - 9 PM)"
                value={profileForm.opening_hours}
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    opening_hours: e.target.value,
                  })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="url"
                placeholder="Website"
                value={profileForm.website}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, website: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditProfile(false)}
                  className="flex-1 border border-gray-300 text-gray-700 font-medium py-2.5 rounded-lg text-sm hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition disabled:opacity-60"
                >
                  {updateProfileMutation.isPending ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Page;
