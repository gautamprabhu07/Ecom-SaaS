//Path: apps/user-ui/src/shared/widgets/header/header-bottom.tsx
"use client";
import {
  AlignLeft,
  ChevronDown,
  CircleUserRound,
  ShoppingCartIcon,
  Heart,
} from "lucide-react";
import Link from "next/link";
import { NavItem, navItems } from "../../../configs/constants";
import { categories } from "../../../configs/categories";
import React, { useEffect, useState } from "react";
import useUser from "../../../hooks/useUser";
import { useStore } from "apps/user-ui/src/store";

const HeaderBottom = () => {
  const [show, setShow] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const wishlist = useStore((state: any) => state.wishlist);
  const cart = useStore((state: any) => state.cart);
  const { user, isLoading } = useUser();

  useEffect(() => {
    const handleScroll = () => setIsSticky(window.scrollY > 100);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className={`bg-neutral-800 text-white w-full border-t border-neutral-700 transition-shadow duration-300 ${isSticky ? "fixed top-0 left-0 z-50 shadow-lg shadow-black/30" : ""}`}
    >
      <div className="w-full px-4 lg:px-8 py-2.5 flex items-center gap-2">
        {/* All Categories Dropdown */}
        <div className="relative shrink-0">
          <button
            type="button"
            className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              show
                ? "bg-emerald-500 text-white"
                : "text-neutral-200 bg-white/5 hover:bg-white/10"
            }`}
            onClick={() => setShow(!show)}
          >
            <AlignLeft className="w-4 h-4" />
            <span>All Categories</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${show ? "rotate-180" : ""}`}
            />
          </button>

          {show && (
            <div className="absolute top-full left-0 mt-2 bg-neutral-900 rounded-xl shadow-xl shadow-black/40 w-64 z-50 py-2 border border-neutral-700">
              <ul className="text-sm text-neutral-200 max-h-80 overflow-y-auto">
                {categories.map((category) => (
                  <li key={category.value}>
                    <Link
                      href="/products"
                      className="group flex items-center px-4 py-2 hover:bg-white/10 hover:text-emerald-400 transition-colors duration-150"
                    >
                      <span className="transition-transform duration-150 group-hover:translate-x-1">
                        {category.label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Nav Items */}
        <div className="flex items-center gap-1 ml-2">
          {navItems.map((i: NavItem, index: number) => (
            <Link
              key={index}
              href={i.href}
              className="group relative text-sm font-medium text-neutral-300 hover:text-white px-3 py-2 rounded-lg transition-colors duration-200"
            >
              {i.title}
              <span className="absolute left-3 right-3 -bottom-0.5 h-0.5 bg-emerald-400 rounded-full scale-x-0 origin-center group-hover:scale-x-100 transition-transform duration-200" />
            </Link>
          ))}
        </div>

        {/* Sticky Search + Icons */}
        {isSticky && (
          <div className="flex items-center gap-1 shrink-0 ml-auto">
            {/* Account */}
            {!isLoading && user ? (
              <Link
                href="/profile"
                className="group flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full text-neutral-200 hover:text-white hover:bg-white/10 transition-all duration-200"
              >
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 transition-transform duration-200 group-hover:scale-110">
                  <CircleUserRound className="w-4 h-4" />
                </span>
                <span className="text-sm font-medium">
                  {user?.name?.split(" ")[0]}
                </span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="group flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-neutral-200 hover:text-white hover:bg-white/10 transition-all duration-200"
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
              className="group relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-neutral-200 hover:text-white hover:bg-white/10 transition-all duration-200"
            >
              <Heart className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
              <span className="text-[11px] leading-none">Wishlist</span>
              {wishlist.length > 0 && (
                <span className="absolute top-0.5 right-1 bg-emerald-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link
              href="/cart"
              className="group relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-neutral-200 hover:text-white hover:bg-white/10 transition-all duration-200"
            >
              <ShoppingCartIcon className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
              <span className="text-[11px] leading-none">Cart</span>
              {cart?.length > 0 && (
                <span className="absolute top-0.5 right-1 bg-emerald-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                  {cart?.length}
                </span>
              )}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default HeaderBottom;
