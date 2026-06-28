'use client';
import { AlignLeft, ChevronDown, Search, CircleUserRound, ShoppingCartIcon, Heart } from 'lucide-react';
import Link from 'next/link';
import { NavItem, navItems } from '../../../configs/constants';
import React, { useEffect, useState } from 'react'

const HeaderBottom = () => {
  const [show, setShow] = useState(false);
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsSticky(window.scrollY > 100);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={`bg-gray-700 text-white w-full ${isSticky ? 'fixed top-0 left-0 z-50 shadow-lg' : ''}`}>
      <div className="container mx-auto px-4 py-2 flex items-center gap-6">

        {/* All Categories Dropdown */}
        <div className="relative shrink-0">
          <div
            className="flex items-center gap-2 cursor-pointer hover:text-amber-400 transition"
            onClick={() => setShow(!show)}
          >
            <AlignLeft className="w-5 h-5" />
            <span className="text-sm font-medium">All Categories</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${show ? 'rotate-180' : ''}`} />
          </div>

          {show && (
            <div className="absolute top-full left-0 mt-1 bg-gray-800 rounded-lg shadow-xl w-48 z-50 py-2">
              <ul className="text-sm text-gray-200">{/* category items */}</ul>
            </div>
          )}
        </div>

        {/* Nav Items */}
        <div className="flex items-center gap-5">
          {navItems.map((i: NavItem, index: number) => (
            <Link
              key={index}
              href={i.href}
              className="text-sm font-medium hover:text-amber-400 transition"
            >
              {i.title}
            </Link>
          ))}
        </div>

        {/* Sticky Search + Icons */}
        {isSticky && (
          <div className="flex items-center gap-5 ml-auto">
            {/* Search */}
            <div className="flex items-center relative">
              <input
                type="text"
                placeholder="Search products..."
                className="pl-4 pr-10 py-1.5 text-sm text-gray-800 rounded-lg border-2 border-blue-500 focus:outline-none w-48"
              />
              <div className="absolute right-0 h-full px-2.5 flex items-center bg-blue-500 rounded-r-lg cursor-pointer">
                <Search className="w-4 h-4 text-white" />
              </div>
            </div>

            {/* Icons */}
            <Link href="/login" className="flex flex-col items-center gap-0.5 hover:text-amber-400 transition">
              <CircleUserRound className="w-5 h-5" />
              <span className="text-[10px]">Sign in</span>
            </Link>

            <Link href="/wishlist" className="relative flex flex-col items-center gap-0.5 hover:text-amber-400 transition">
              <Heart className="w-5 h-5" />
              <span className="text-[10px]">Wishlist</span>
              <span className="absolute -top-1.5 -right-2 bg-blue-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">0</span>
            </Link>

            <Link href="/cart" className="relative flex flex-col items-center gap-0.5 hover:text-amber-400 transition">
              <ShoppingCartIcon className="w-5 h-5" />
              <span className="text-[10px]">Cart</span>
              <span className="absolute -top-1.5 -right-2 bg-blue-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">9</span>
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}

export default HeaderBottom;