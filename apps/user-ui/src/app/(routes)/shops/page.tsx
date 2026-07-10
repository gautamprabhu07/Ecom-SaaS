//Path: apps/user-ui/src/app/%28routes%29/products/page.tsx
"use client";
import axiosInstance from "apps/user-ui/src/utils/axiosInstance";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { categories } from "apps/user-ui/src/configs/categories";
import { countries } from "apps/user-ui/src/utils/countries";
import ShopCard from "apps/user-ui/src/shared/components/section/cards/shop.card";

const Page = () => {
  const router = useRouter();
  const [isShopLoading, setIsShopLoading] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [shops, setShops] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);

  const updateURL = () => {
    const params = new URLSearchParams();
    if (selectedCategories.length > 0) {
      params.set("categories", selectedCategories.join(","));
    }
    if (selectedCountries.length > 0) {
      params.set("countries", selectedCountries.join(","));
    }
    params.set("page", page.toString());
    router.replace(`/shops?${decodeURIComponent(params.toString())}`);
  };

  const fetchFilteredShops = async () => {
    setIsShopLoading(true);
    try {
      const query = new URLSearchParams();
      if (selectedCategories.length > 0) {
        query.set("categories", selectedCategories.join(","));
      }
      if (selectedCountries.length > 0) {
        query.set("countries", selectedCountries.join(","));
      }
      query.set("page", page.toString());
      query.set("limit", "12");
      const res = await axiosInstance.get(
        `/product/api/get-filtered-shops?${query.toString()}`,
      );
      setShops(res.data.shops);
      setTotalPages(res.data.pagination.totalPages);
    } catch (error) {
      console.error("Error fetching filtered shops:", error);
    } finally {
      setIsShopLoading(false);
    }
  };

  useEffect(() => {
    updateURL();
    fetchFilteredShops();
  }, [selectedCategories, page]);

  const toggleCategory = (label: string) => {
    setSelectedCategories((prev) =>
      prev.includes(label)
        ? prev.filter((cat) => cat !== label)
        : [...prev, label],
    );
  };

  const toggleCountry = (label: string) => {
    setSelectedCountries((prev) =>
      prev.includes(label)
        ? prev.filter((country) => country !== label)
        : [...prev, label],
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 mb-1">All Shops</h1>
        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <Link href="/" className="hover:text-blue-600 transition">
            Home
          </Link>
          <span>/</span>
          <span className="text-gray-700">All Shops</span>
        </div>
      </div>

      <div className="flex gap-8 items-start">
        {/* Sidebar */}
        <aside className="w-64 shrink-0 bg-white border border-gray-200 rounded-xl p-5 space-y-6">
          {/* Categories Filter */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Categories
            </h3>
            <ul className="space-y-2">
              {categories.map((category: any) => (
                <li key={category.label}>
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category.value)}
                      onChange={() => toggleCategory(category.value)}
                      className="accent-blue-600 w-3.5 h-3.5"
                    />
                    {category.value}
                  </label>
                </li>
              ))}
            </ul>

            {/* Countries Filter */}
            <h3>Countries</h3>
            <ul>
              {countries.map((country: any) => (
                <li key={country}>
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                    <input
                      type="checkbox"
                      checked={selectedCountries.includes(country)}
                      onChange={() => toggleCountry(country)}
                      className="accent-blue-600 w-3.5 h-3.5"
                    />
                    {country}
                  </label>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Shops Grid */}
        <div className="flex-1">
          {isShopLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 12 }).map((_, index) => (
                <div
                  key={index}
                  className="aspect-square rounded-xl bg-gray-100 animate-pulse"
                ></div>
              ))}
            </div>
          ) : shops.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {shops.map((shop) => (
                <ShopCard key={shop.id} shop={shop} />
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500 text-center py-16">
              No shops found.
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setPage(i + 1)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium border transition ${page === i + 1 ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Page;
