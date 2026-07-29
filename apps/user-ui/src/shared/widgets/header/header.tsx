//path: apps/user-ui/src/shared/widgets/header/header.tsx
"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, CircleUserRound, ShoppingCartIcon, Heart } from "lucide-react";
import HeaderBottom from "./header-bottom";
import useUser from "../../../hooks/useUser";
import { useStore } from "apps/user-ui/src/store";
import Image from "next/image";

const Header = () => {
  const { user, isLoading } = useUser();
  const wishlist = useStore((state: any) => state.wishlist);
  const cart = useStore((state: any) => state.cart);
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  const handleSearchClick = () => {
    if (!searchQuery.trim()) return;
    router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <div className="bg-neutral-900 text-white w-full">
      <div className="w-full px-4 lg:px-8 py-3.5 flex items-center gap-6 lg:gap-10">
        {/* Logo */}
        <Link
          href="/"
          className="group flex items-center gap-3 shrink-0 transition-transform duration-200 hover:-translate-y-0.5"
        >
          <div className="relative">
            <span className="absolute inset-0 rounded-full bg-emerald-400/30 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Image
              src="/logoeshop.png"
              alt="Eshop Logo"
              width={44}
              height={44}
              priority
              className="relative"
            />
          </div>
          <span
            className="hidden sm:inline text-lg font-extrabold tracking-tight bg-gradient-to-br from-white from-50% to-emerald-400 to-50% bg-clip-text text-transparent"
          >
            OutSource
          </span>
        </Link>

        {/* Search */}
        <div className="flex-1 flex items-center relative">
          <Search
            className={`pointer-events-none absolute left-4 w-4 h-4 transition-colors duration-200 ${searchFocused ? "text-emerald-500" : "text-neutral-400"}`}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            onKeyDown={(e) => e.key === "Enter" && handleSearchClick()}
            placeholder="Search products, brands, categories..."
            className="w-full pl-11 pr-28 py-2.5 text-sm text-neutral-800 bg-white placeholder:text-neutral-400 rounded-full border border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all duration-200"
          />
          <button
            type="button"
            onClick={handleSearchClick}
            className="absolute right-1.5 flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 active:scale-95 transition-all duration-150 rounded-full cursor-pointer shadow-sm shadow-black/30"
          >
            Search
          </button>
        </div>

        {/* Nav Icons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Account */}
          {!isLoading && user ? (
            <Link
              href="/profile"
              className="group flex items-center gap-2 pl-2 pr-4 py-1.5 rounded-full text-neutral-200 hover:text-white hover:bg-white/10 transition-all duration-200 hover:-translate-y-0.5"
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 transition-transform duration-200 group-hover:scale-110">
                <CircleUserRound className="w-5 h-5" />
              </span>
              <span className="text-sm font-medium">
                {user?.name?.split(" ")[0]}
              </span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="group flex flex-col items-center gap-1 px-4 py-1.5 rounded-full text-neutral-200 hover:text-white hover:bg-white/10 transition-all duration-200 hover:-translate-y-0.5"
            >
              <CircleUserRound className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
              <span className="text-[11px] leading-none">
                {isLoading ? "..." : "Sign in"}
              </span>
            </Link>
          )}

          {/* Wishlist */}
          <Link
            href="/wishlist"
            className="group relative flex flex-col items-center gap-1 px-4 py-1.5 rounded-full text-neutral-200 hover:text-white hover:bg-white/10 transition-all duration-200 hover:-translate-y-0.5"
          >
            <Heart className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
            <span className="text-[11px] leading-none">Wishlist</span>
            {wishlist.length > 0 && (
              <span className="absolute top-0.5 right-2 bg-emerald-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full shadow-sm shadow-black/40">
                {wishlist.length}
              </span>
            )}
          </Link>

          {/* Cart */}
          <Link
            href="/cart"
            className="group relative flex flex-col items-center gap-1 px-4 py-1.5 rounded-full text-neutral-200 hover:text-white hover:bg-white/10 transition-all duration-200 hover:-translate-y-0.5"
          >
            <ShoppingCartIcon className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
            <span className="text-[11px] leading-none">Cart</span>
            {cart?.length > 0 && (
              <span className="absolute top-0.5 right-2 bg-emerald-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full shadow-sm shadow-black/40">
                {cart?.length}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Header Bottom */}
      <HeaderBottom />
    </div>
  );
};

export default Header;
