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
      className={`bg-neutral-800 text-white w-full border-t border-neutral-700 ${isSticky ? "fixed top-0 left-0 z-50 shadow-lg shadow-black/20" : ""}`}
    >
      <div className="container mx-auto px-4 py-2.5 flex items-center gap-6">
        {/* All Categories Dropdown */}
        <div className="relative shrink-0">
          <div
            className="flex items-center gap-2 cursor-pointer hover:text-emerald-400 transition"
            onClick={() => setShow(!show)}
          >
            <AlignLeft className="w-5 h-5" />
            <span className="text-sm font-medium">All Categories</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${show ? "rotate-180" : ""}`}
            />
          </div>

          {show && (
            <div className="absolute top-full left-0 mt-2 bg-neutral-900 rounded-xl shadow-xl shadow-black/30 w-48 z-50 py-2 border border-neutral-700">
              <ul className="text-sm text-neutral-200">
                {/* category items */}
              </ul>
            </div>
          )}
        </div>

        {/* Nav Items */}
        <div className="flex items-center gap-5">
          {navItems.map((i: NavItem, index: number) => (
            <Link
              key={index}
              href={i.href}
              className="text-sm font-medium hover:text-emerald-400 transition"
            >
              {i.title}
            </Link>
          ))}
        </div>

        {/* Sticky Search + Icons */}
        {isSticky && (
          <div className="flex items-center gap-5 shrink-0">
            {/* Account */}
            {!isLoading && user ? (
              <>
                <Link
                  href="/profile"
                  className="flex flex-col items-center gap-0.5 hover:text-emerald-400 transition"
                >
                  <CircleUserRound className=" h-5" />
                </Link>
                <Link href="/profile">
                  <span className="text-xs leading-none">Hello </span>
                  <span className="text-xs leading-none">
                    {user?.name?.split(" ")[0]}
                  </span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="flex flex-col items-center gap-0.5 hover:text-emerald-400 transition"
                >
                  <CircleUserRound className="w-5 h-5" />
                  <span className="text-xs leading-none">
                    {isLoading ? "..." : "Sign in"}
                  </span>
                </Link>
              </>
            )}

            {/* Wishlist */}
            <Link
              href="/wishlist"
              className="relative flex flex-col items-center gap-0.5 hover:text-emerald-400 transition"
            >
              <Heart className="w-5 h-5" />
              <span className="text-xs leading-none">Wishlist</span>
              <span className="absolute -top-1.5 -right-2 bg-emerald-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                {wishlist.length}
              </span>
            </Link>

            {/* Cart */}
            <Link
              href="/cart"
              className="relative flex flex-col items-center gap-0.5 hover:text-emerald-400 transition"
            >
              <ShoppingCartIcon className="w-5 h-5" />
              <span className="text-xs leading-none">Cart</span>
              <span className="absolute -top-1.5 -right-2 bg-emerald-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                {cart?.length}
              </span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default HeaderBottom;
