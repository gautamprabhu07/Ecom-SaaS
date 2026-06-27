// Theme: Archway — Sticky secondary nav bar; warm white, hairline border, mono badge counts

'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { navItems, NavItem } from '../../../configs/constants'

// ─── Inline SVG icons ────────────────────────────────────────────────────────

const AlignLeftIcon = () => (
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
    <line x1="3" y1="6"  x2="21" y2="6"  />
    <line x1="3" y1="12" x2="15" y2="12" />
    <line x1="3" y1="18" x2="18" y2="18" />
  </svg>
)

const ChevronDownIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="14"
    height="14"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

const SearchIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="16"
    height="16"
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

// ─── Category data ────────────────────────────────────────────────────────────

type Category = { label: string; href: string }

const categories: Category[] = [
  { label: 'Electronics',   href: '/c/electronics'   },
  { label: 'Fashion',       href: '/c/fashion'       },
  { label: 'Home & Living', href: '/c/home-living'   },
  { label: 'Sports',        href: '/c/sports'        },
  { label: 'Books',         href: '/c/books'         },
  { label: 'Grocery',       href: '/c/grocery'       },
  { label: 'Toys & Kids',   href: '/c/toys-kids'     },
  { label: 'Beauty',        href: '/c/beauty'        },
]

// ─── Icon action button ───────────────────────────────────────────────────────

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
    className="relative flex items-center text-[#111110] hover:text-[#1A1A1A] transition-colors"
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

// ─── Sticky search bar (shown only when sticky) ───────────────────────────────

const StickySearch = () => (
  <div className="relative flex items-center w-52 lg:w-72">
    <input
      type="text"
      placeholder="Search products…"
      className="
        w-full h-8 pl-8 pr-3
        text-[13px] text-[#111110] placeholder:text-[#787672]
        bg-white border border-[#E4E2DE] rounded-[4px]
        outline-none focus:border-[#1A1A1A]
        transition-colors
      "
    />
    <span className="absolute left-2.5 text-[#787672]">
      <SearchIcon />
    </span>
  </div>
)

// ─── HeaderBottom ─────────────────────────────────────────────────────────────

const HeaderBottom = () => {
  const [showCategories, setShowCategories] = useState(false)
  const [isSticky, setIsSticky]             = useState(false)
  const dropdownRef                          = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => setIsSticky(window.scrollY > 80)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowCategories(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  return (
    <div
      className={`
        w-full bg-[#F7F6F4] border-b border-[#E4E2DE]
        ${isSticky ? 'fixed top-0 left-0 z-50 shadow-[0_1px_0_#E4E2DE]' : ''}
      `}
    >
      <div className="max-w-[1320px] mx-auto px-4 md:px-6 h-11 flex items-center gap-6">

        {/* ── All Categories trigger ── */}
        <div ref={dropdownRef} className="relative flex-shrink-0">
          <button
            onClick={() => setShowCategories(prev => !prev)}
            className="
              flex items-center gap-1.5
              text-[13px] font-medium text-[#111110]
              hover:text-[#787672] transition-colors
              select-none
            "
            aria-expanded={showCategories}
            aria-haspopup="true"
          >
            <AlignLeftIcon />
            <span className="hidden sm:inline">All Categories</span>
            <span
              className={`transition-transform duration-150 ${showCategories ? 'rotate-180' : ''}`}
            >
              <ChevronDownIcon />
            </span>
          </button>

          {/* Dropdown */}
          {showCategories && (
            <div
              className="
                absolute top-[calc(100%+8px)] left-0 z-50
                bg-white border border-[#E4E2DE] rounded-[6px]
                min-w-[200px] py-1
                shadow-[0_4px_16px_rgba(0,0,0,0.07)]
              "
              role="menu"
            >
              {categories.map((cat) => (
                <Link
                  key={cat.href}
                  href={cat.href}
                  role="menuitem"
                  onClick={() => setShowCategories(false)}
                  className="
                    block px-4 py-2
                    text-[13px] text-[#111110]
                    hover:bg-[#F7F6F4] transition-colors
                  "
                >
                  {cat.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ── Divider ── */}
        <div className="hidden md:block h-4 w-px bg-[#E4E2DE]" aria-hidden="true" />

        {/* ── Nav items ── */}
        <nav
          className="hidden md:flex items-center gap-6 flex-1"
          aria-label="Main navigation"
        >
          {navItems.map((item: NavItem) => (
            <Link
              key={item.href}
              href={item.href}
              className="
                text-[13px] text-[#787672]
                hover:text-[#111110] transition-colors
                whitespace-nowrap
              "
            >
              {item.title}
            </Link>
          ))}
        </nav>

        {/* ── Sticky search + icons (only when sticky) ── */}
        {isSticky && (
          <div className="flex items-center gap-4 ml-auto">
            <StickySearch />
            <div className="flex items-center gap-4">
              <IconBtn href="/login" label="Account">
                <UserIcon />
              </IconBtn>
              <IconBtn href="/wishlist" label="Wishlist" count={0}>
                <HeartIcon />
              </IconBtn>
              <IconBtn href="/cart" label="Cart" count={9}>
                <CartIcon />
              </IconBtn>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default HeaderBottom