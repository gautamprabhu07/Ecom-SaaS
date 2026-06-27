// Theme: Archway — Primary site header; warm white surface, DM Serif logo, mono price badges

import React from 'react'
import Link from 'next/link'
import HeaderBottom from './header-bottom'

// ─── Inline SVG icons ────────────────────────────────────────────────────────

const SearchIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="18"
    height="18"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="7" />
    <line x1="16.5" y1="16.5" x2="22" y2="22" />
  </svg>
)

const UserIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="20"
    height="20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
)

const HeartIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="20"
    height="20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
  </svg>
)

const CartIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="20"
    height="20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
)

// ─── Icon button with badge ───────────────────────────────────────────────────

type IconBtnProps = {
  href: string
  label: string
  count?: number
  children: React.ReactNode
}

const IconBtn = ({ href, label, count, children }: IconBtnProps) => (
  <Link
    href={href}
    aria-label={label}
    className="relative flex items-center text-[#111110] hover:text-[#787672] transition-colors"
  >
    {children}
    {count !== undefined && count > 0 && (
      <span
        className="
          absolute -top-1.5 -right-2
          font-mono text-[10px] font-medium leading-none
          bg-[#1A1A1A] text-white
          rounded-full w-4 h-4
          flex items-center justify-center
        "
        aria-label={`${count} items`}
      >
        {count}
      </span>
    )}
  </Link>
)

// ─── Header ───────────────────────────────────────────────────────────────────

const Header = () => {
  return (
    <header className="w-full bg-white border-b border-[#E4E2DE]">

      {/* ── Top bar ── */}
      <div className="max-w-[1320px] mx-auto px-4 md:px-6 h-16 flex items-center gap-6">

        {/* Logo */}
        <Link
          href="/"
          className="flex-shrink-0 mr-2"
          aria-label="Eshop home"
        >
          {/*
           * Logo uses DM Serif Display (loaded via Google Fonts in global.css).
           * Add to tailwind.config.ts → fontFamily → display: ['"DM Serif Display"', 'serif']
           */}
          <span className="font-['DM_Serif_Display'] text-[22px] text-[#111110] leading-none tracking-[-0.01em] select-none">
            Eshop
          </span>
        </Link>

        {/* ── Search bar ── */}
        <div className="relative flex-1 max-w-[560px] hidden sm:flex items-center">
          <input
            type="text"
            placeholder="Search for products, brands, vendors…"
            className="
              w-full h-10 pl-4 pr-10
              text-[14px] text-[#111110] placeholder:text-[#787672]
              bg-[#F7F6F4]
              border border-[#E4E2DE] rounded-[4px]
              outline-none
              focus:bg-white focus:border-[#1A1A1A]
              transition-colors
            "
          />
          <button
            type="submit"
            aria-label="Submit search"
            className="
              absolute right-0 top-0 bottom-0
              w-10 flex items-center justify-center
              text-[#787672] hover:text-[#111110]
              transition-colors rounded-r-[4px]
            "
          >
            <SearchIcon />
          </button>
        </div>

        {/* ── Right actions ── */}
        <div className="flex items-center gap-5 ml-auto">

          {/* Account */}
          <Link
            href="/login"
            className="hidden md:flex flex-col items-start leading-none"
          >
            <span className="text-[11px] text-[#787672] font-medium">Hello,</span>
            <span className="text-[13px] text-[#111110] font-medium">Sign in</span>
          </Link>

          {/* User icon (mobile) */}
          <IconBtn href="/login" label="Account">
            <span className="md:hidden">
              <UserIcon />
            </span>
          </IconBtn>

          {/* Divider */}
          <div
            className="hidden md:block h-5 w-px bg-[#E4E2DE]"
            aria-hidden="true"
          />

          {/* Wishlist */}
          <IconBtn href="/wishlist" label="Wishlist" count={0}>
            <HeartIcon />
          </IconBtn>

          {/* Cart */}
          <IconBtn href="/cart" label="Cart" count={9}>
            <CartIcon />
          </IconBtn>
        </div>
      </div>

      {/* ── Search bar (mobile, below top bar) ── */}
      <div className="sm:hidden px-4 pb-3">
        <div className="relative flex items-center">
          <input
            type="text"
            placeholder="Search products…"
            className="
              w-full h-10 pl-4 pr-10
              text-[14px] text-[#111110] placeholder:text-[#787672]
              bg-[#F7F6F4]
              border border-[#E4E2DE] rounded-[4px]
              outline-none focus:bg-white focus:border-[#1A1A1A]
              transition-colors
            "
          />
          <button
            type="submit"
            aria-label="Submit search"
            className="
              absolute right-0 top-0 bottom-0
              w-10 flex items-center justify-center
              text-[#787672] hover:text-[#111110]
              transition-colors
            "
          >
            <SearchIcon />
          </button>
        </div>
      </div>

      {/* ── Navigation row ── */}
      <HeaderBottom />
    </header>
  )
}

export default Header