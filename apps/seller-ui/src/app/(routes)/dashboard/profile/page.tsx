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

  if (!seller) {
    return null; // redirect handled in useEffect
  }

  const shop = data?.shop;

  return (
    <div className="min-h-screen bg-[#FAF8F3] font-['Inter']">
      {/* Back to dashboard */}
      <div className="px-6 pt-6">
        <button
          onClick={() => router.push("/dashboard")}
          className="group flex items-center gap-1.5 text-sm font-medium text-[#78716C] hover:text-[#059669] transition-colors duration-200"
        >
          <ArrowLeft
            size={15}
            className="transition-transform duration-200 group-hover:-translate-x-1"
          />
          Back to Dashboard
        </button>
      </div>

      {/* Cover banner */}
      <div className="relative w-full h-56 rounded-2xl mx-auto max-w-5xl bg-linear-to-br from-[#D1FAE5] to-[#FAF8F3] mt-4 overflow-hidden shadow-[0_4px_20px_-4px_rgba(120,53,15,0.08)]">
        {shop?.coverBanner && (
          <Image
            src={shop.coverBanner}
            alt="Cover banner"
            fill
            className="object-cover transition-transform duration-700 ease-out hover:scale-105"
          />
        )}
        <label className="absolute top-4 right-4 flex items-center gap-1.5 bg-white/90 hover:bg-white text-[#292524] text-xs font-medium px-3 py-2 rounded-full shadow-[0_4px_20px_-4px_rgba(120,53,15,0.15)] cursor-pointer transition-all duration-200 hover:-translate-y-0.5">
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
        <div className="flex items-end gap-4 relative">
          <div className="group relative w-24 h-24 -mt-12 rounded-full border-4 border-[#FAF8F3] bg-[#D1FAE5] overflow-hidden shrink-0 shadow-[0_4px_20px_-4px_rgba(120,53,15,0.15)] transition-transform duration-300 hover:scale-105">
            {shop?.avatar && (
              <Image
                src={shop.avatar}
                alt={shop.name}
                fill
                className="object-cover"
              />
            )}
            <label className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer">
              <Camera size={18} />
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={handleAvatarChange}
              />
            </label>
          </div>

          <div className="flex-1 pb-2 pt-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h1 className="text-xl font-extrabold text-[#292524] font-['Nunito']">
                {shop?.name}
              </h1>
              <button
                onClick={() => setShowEditProfile(true)}
                className="flex items-center gap-1.5 text-sm font-semibold text-[#059669] border border-[#059669]/30 px-3.5 py-2 rounded-full transition-all duration-200 hover:bg-[#D1FAE5] hover:-translate-y-0.5"
              >
                <Pencil size={13} />
                Edit Profile
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-2.5 text-sm text-[#78716C]">
              <span className="flex items-center gap-1">
                <Users size={14} />
                {shop?.followersCount ?? 0} followers
              </span>
              <span className="flex items-center gap-1 text-[#292524] font-medium">
                <Star size={14} className="text-[#FDBA74] fill-[#FDBA74]" />
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
                  <div
                    key={product.id}
                    className="group bg-white rounded-2xl border border-[#E7E5E4] shadow-[0_4px_20px_-4px_rgba(120,53,15,0.08)] overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-[#059669]/40 hover:shadow-[0_10px_30px_-6px_rgba(5,150,105,0.18)]"
                  >
                    <div className="relative h-32 bg-[#D1FAE5]/40 overflow-hidden">
                      {product.images?.[0]?.url && (
                        <Image
                          src={product.images[0].url}
                          alt={product.title}
                          fill
                          className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                        />
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium text-[#292524] line-clamp-1 transition-colors duration-200 group-hover:text-[#059669]">
                        {product.title}
                      </p>
                      <p className="text-sm text-[#78716C] mt-0.5">
                        ${product.sale_price}
                      </p>
                    </div>
                  </div>
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
                  <div
                    key={offer.id}
                    className="group bg-white rounded-2xl border border-[#E7E5E4] shadow-[0_4px_20px_-4px_rgba(120,53,15,0.08)] overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-[#059669]/40 hover:shadow-[0_10px_30px_-6px_rgba(5,150,105,0.18)]"
                  >
                    <div className="relative h-32 bg-[#D1FAE5]/40 overflow-hidden">
                      {offer.images?.[0]?.url && (
                        <Image
                          src={offer.images[0].url}
                          alt={offer.title}
                          fill
                          className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                        />
                      )}
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
                  </div>
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

      {/* Edit profile modal */}
      {showEditProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#292524]/40 animate-[fade-in_150ms_ease-out]">
          <div className="bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(120,53,15,0.15)] w-full max-w-md p-6 animate-[dropdown-in_200ms_ease-out]">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-['Nunito'] text-lg font-bold text-[#292524]">
                Edit Shop Profile
              </h3>
              <button
                onClick={() => setShowEditProfile(false)}
                className="text-[#78716C] hover:text-[#292524] hover:rotate-90 transition-all duration-200"
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
                className="w-full border border-[#E7E5E4] rounded-2xl px-3 py-2.5 text-sm text-[#292524] placeholder:text-[#78716C] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-[#059669]"
              />
              <textarea
                placeholder="Bio"
                value={profileForm.bio}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, bio: e.target.value })
                }
                rows={3}
                className="w-full border border-[#E7E5E4] rounded-2xl px-3 py-2.5 text-sm text-[#292524] placeholder:text-[#78716C] resize-none transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-[#059669]"
              />
              <input
                type="text"
                placeholder="Address"
                value={profileForm.address}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, address: e.target.value })
                }
                className="w-full border border-[#E7E5E4] rounded-2xl px-3 py-2.5 text-sm text-[#292524] placeholder:text-[#78716C] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-[#059669]"
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
                className="w-full border border-[#E7E5E4] rounded-2xl px-3 py-2.5 text-sm text-[#292524] placeholder:text-[#78716C] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-[#059669]"
              />
              <input
                type="url"
                placeholder="Website"
                value={profileForm.website}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, website: e.target.value })
                }
                className="w-full border border-[#E7E5E4] rounded-2xl px-3 py-2.5 text-sm text-[#292524] placeholder:text-[#78716C] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-[#059669]"
              />

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditProfile(false)}
                  className="flex-1 border border-[#E7E5E4] text-[#292524] font-medium py-2.5 rounded-full text-sm transition-all duration-200 hover:bg-[#FAF8F3] hover:-translate-y-0.5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="flex-1 bg-[#059669] hover:bg-[#047857] text-white font-medium py-2.5 rounded-full text-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-8px_rgba(5,150,105,0.4)] active:translate-y-0 disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none"
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
