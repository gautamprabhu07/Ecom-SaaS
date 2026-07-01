'use client';
import React from 'react'
import Link from 'next/link'
import { Search, CircleUserRound, ShoppingCartIcon, Heart } from 'lucide-react'
import HeaderBottom from './header-bottom'
import useUser from '../../../hooks/useUser';

const Header = () => {
  const {user, isLoading}=useUser();
  return (
    <div className="bg-gray-800 text-white w-full">
      <div className="container mx-auto px-4 py-3 flex items-center gap-6">

        {/* Logo */}
        <Link href="/" className="text-xl font-bold text-amber-400 shrink-0">
          Eshop
        </Link>

        {/* Search */}
        <div className="flex-1 flex items-center relative">
          <input
            type="text"
            placeholder="Search products..."
            className="w-full pl-4 pr-10 py-2 text-sm text-gray-800 rounded-lg border-2 border-blue-500 focus:outline-none"
          />
          <div className="absolute right-0 h-full px-3 flex items-center justify-center bg-blue-500 rounded-r-lg cursor-pointer">
            <Search className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Nav Icons */}
        <div className="flex items-center gap-5 shrink-0">
          {/* Account */}
          {!isLoading && user ? (
            <>
            <Link href="/profile" className="flex flex-col items-center gap-0.5 hover:text-amber-400 transition">
            <CircleUserRound className=" h-5" /></Link>
            <Link href="/profile">
            <span className="text-xs leading-none">Hello{" "}</span>
            <span className="text-xs leading-none">{user?.name?.split(" ")[0]}</span>
            </Link>
            </>):(
              <>
          <Link href="/login" className="flex flex-col items-center gap-0.5 hover:text-amber-400 transition">
            <CircleUserRound className="w-5 h-5" />
            <span className="text-xs leading-none">{isLoading?"...": "Sign in"}</span>
          </Link></>)}

          {/* Wishlist */}
          <Link href="/wishlist" className="relative flex flex-col items-center gap-0.5 hover:text-amber-400 transition">
            <Heart className="w-5 h-5" />
            <span className="text-xs leading-none">Wishlist</span>
            <span className="absolute -top-1.5 -right-2 bg-blue-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">0</span>
          </Link>

          {/* Cart */}
          <Link href="/cart" className="relative flex flex-col items-center gap-0.5 hover:text-amber-400 transition">
            <ShoppingCartIcon className="w-5 h-5" />
            <span className="text-xs leading-none">Cart</span>
            <span className="absolute -top-1.5 -right-2 bg-blue-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">9</span>
          </Link>
        </div>

      </div>

      {/* Header Bottom */}
      <HeaderBottom />
    </div>
  )
}

export default Header;