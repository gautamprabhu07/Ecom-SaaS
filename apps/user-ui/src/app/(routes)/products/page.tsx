//Path: apps/user-ui/src/app/%28routes%29/products/page.tsx
"use client";
import axiosInstance from "apps/user-ui/src/utils/axiosInstance";
import { useQuery } from "@tanstack/react-query";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Range } from "react-range";
import ProductCard from "apps/user-ui/src/shared/components/section/cards/product-card";

const MIN = 0;
const MAX = 1199;

const Page = () => {
  const router = useRouter();
  const [isProductLoading, setProductLoading] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 1199]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [tempPriceRange, setTempPriceRange] = useState([0, 1199]);

  const colors = [
    { name: "Red", hex: "#FF0000" },
    { name: "Green", hex: "#00FF00" },
    { name: "Blue", hex: "#0000FF" },
    { name: "Yellow", hex: "#FFFF00" },
    { name: "Black", hex: "#000000" },
    { name: "White", hex: "#FFFFFF" },
    { name: "Purple", hex: "#800080" },
    { name: "Orange", hex: "#FFA500" },
    { name: "Pink", hex: "#FFC0CB" },
    { name: "Gray", hex: "#808080" },
  ];

  const sizes = ["XS", "S", "M", "L", "XL", "XXL"];

  const updateURL = () => {
    const params = new URLSearchParams();
    params.set("priceRange", priceRange.join(","));
    if (selectedCategories.length > 0) {
      params.set("categories", selectedCategories.join(","));
    }
    if (selectedColors.length > 0) {
      params.set("colors", selectedColors.join(","));
    }
    if (selectedSizes.length > 0) {
      params.set("sizes", selectedSizes.join(","));
    }
    params.set("page", page.toString());
    router.replace(`/products?${decodeURIComponent(params.toString())}`);
  };

  const fetchFilteredProducts = async () => {
    setProductLoading(true);
    try {
      const query = new URLSearchParams();
      query.set("priceRange", priceRange.join(","));
      if (selectedCategories.length > 0) {
        query.set("categories", selectedCategories.join(","));
      }
      if (selectedColors.length > 0) {
        query.set("colors", selectedColors.join(","));
      }
      if (selectedSizes.length > 0) {
        query.set("sizes", selectedSizes.join(","));
      }
      query.set("page", page.toString());
      query.set("limit", "12");
      const res = await axiosInstance.get(
        `/product/api/get-filtered-products?${query.toString()}`,
      );
      setProducts(res.data.products);
      setTotalPages(res.data.pagination.totalPages);
    } catch (error) {
      console.error("Error fetching filtered products:", error);
    } finally {
      setProductLoading(false);
    }
  };

  useEffect(() => {
    updateURL();
    fetchFilteredProducts();
  }, [priceRange, selectedCategories, selectedColors, selectedSizes, page]);

  const { data, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await axiosInstance.get("/product/api/get-categories");
      return res.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const toggleCategory = (label: string) => {
    setSelectedCategories((prev) =>
      prev.includes(label)
        ? prev.filter((cat) => cat !== label)
        : [...prev, label],
    );
  };

  const toggleColor = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color],
    );
  };

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size],
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 bg-[#FAF8F3]">
      {/* Breadcrumb */}
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-extrabold text-[#292524] mb-1">
          All Products
        </h1>
        <div className="flex items-center gap-1.5 text-sm text-[#78716C]">
          <Link href="/" className="hover:text-[#059669] transition">
            Home
          </Link>
          <span>/</span>
          <span className="text-[#292524]">All Products</span>
        </div>
      </div>

      <div className="flex gap-8 items-start">
        {/* Sidebar */}
        <aside className="w-64 shrink-0 bg-white border border-[#E7E5E4] rounded-2xl p-5 space-y-6 shadow-[0_4px_20px_-4px_rgba(120,53,15,0.08)]">
          {/* Price Filter */}
          <div>
            <h3 className="font-heading text-sm font-bold text-[#292524] mb-3">
              Price Filter
            </h3>
            <Range
              step={1}
              min={MIN}
              max={MAX}
              values={tempPriceRange}
              onChange={(values) => setTempPriceRange(values)}
              renderTrack={({ props, children }) => {
                const [min, max] = tempPriceRange;
                const percentageLeft = ((min - MIN) / (MAX - MIN)) * 100;
                const percentageRight = ((max - MIN) / (MAX - MIN)) * 100;
                return (
                  <div
                    {...props}
                    className="h-1.5 w-full rounded-full bg-[#E7E5E4] relative"
                    style={{ ...props.style }}
                  >
                    <div
                      className="absolute h-1.5 rounded-full bg-[#059669]"
                      style={{
                        left: `${percentageLeft}%`,
                        width: `${percentageRight - percentageLeft}%`,
                      }}
                    />
                    {children}
                  </div>
                );
              }}
              renderThumb={({ props }) => {
                const { key, ...rest } = props;
                return (
                  <div
                    key={key}
                    {...rest}
                    className="w-4 h-4 rounded-full bg-[#059669] border-2 border-white shadow-[0_4px_20px_-4px_rgba(120,53,15,0.08)]"
                  />
                );
              }}
            />
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-[#78716C]">
                ${tempPriceRange[0]} - ${tempPriceRange[1]}
              </span>
              <button
                onClick={() => {
                  setPriceRange(tempPriceRange);
                  setPage(1);
                }}
                className="text-xs font-semibold text-[#059669] border border-[#059669]/30 px-2.5 py-1 rounded-full hover:bg-[#D1FAE5] transition"
              >
                Apply
              </button>
            </div>
          </div>

          {/* Categories Filter */}
          <div>
            <h3 className="font-heading text-sm font-bold text-[#292524] mb-3">
              Categories
            </h3>
            <ul className="space-y-2">
              {isLoading ? (
                <li className="text-sm text-[#78716C]">Loading...</li>
              ) : (
                data?.categories.map((category: any) => (
                  <li key={category}>
                    <label className="flex items-center gap-2 text-sm text-[#78716C] cursor-pointer hover:text-[#292524]">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category)}
                        onChange={() => toggleCategory(category)}
                        className="accent-[#059669] w-3.5 h-3.5"
                      />
                      {category}
                    </label>
                  </li>
                ))
              )}
            </ul>
          </div>

          {/* Colors Filter */}
          <div>
            <h3 className="font-heading text-sm font-bold text-[#292524] mb-3">
              Colors
            </h3>
            <ul className="space-y-2">
              {colors.map((color) => (
                <li key={color.name}>
                  <label className="flex items-center gap-2 text-sm text-[#78716C] cursor-pointer hover:text-[#292524]">
                    <input
                      type="checkbox"
                      checked={selectedColors.includes(color.name)}
                      onChange={() => toggleColor(color.name)}
                      className="accent-[#059669] w-3.5 h-3.5"
                    />
                    <span
                      className="w-3 h-3 rounded-full border border-[#E7E5E4]"
                      style={{ backgroundColor: color.hex }}
                    />
                    {color.name}
                  </label>
                </li>
              ))}
            </ul>
          </div>

          {/* Sizes Filter */}
          <div>
            <h3 className="font-heading text-sm font-bold text-[#292524] mb-3">
              Sizes
            </h3>
            <div className="flex flex-wrap gap-2">
              {sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => toggleSize(size)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${selectedSizes.includes(size) ? "bg-[#059669] text-white border-[#059669]" : "bg-white text-[#78716C] border-[#E7E5E4] hover:border-[#059669]"}`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Products Grid */}
        <div className="flex-1">
          {isProductLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 12 }).map((_, index) => (
                <div
                  key={index}
                  className="aspect-square rounded-2xl bg-[#E7E5E4]/50 animate-pulse"
                ></div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-sm text-[#78716C] text-center py-16">
              No products found.
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setPage(i + 1)}
                  className={`w-8 h-8 rounded-full text-sm font-medium border transition ${page === i + 1 ? "bg-[#059669] text-white border-[#059669]" : "bg-white text-[#78716C] border-[#E7E5E4] hover:border-[#059669]"}`}
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
