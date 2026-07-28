//Path: apps/user-ui/src/shared/widgets/footer/index.tsx
"use client";
import React, { useState } from "react";
import Link from "next/link";
import {
  FaFacebookF,
  FaInstagram,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";
import { Mail, Phone, MapPin, CreditCard } from "lucide-react";

const Footer = () => {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail("");
  };

  return (
    <footer className="bg-[#111110] text-[#D6D3D1] mt-20">
      {/* Newsletter */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-semibold text-white">
              Subscribe to our newsletter
            </h3>
            <p className="text-sm text-[#A8A29E] mt-1">
              Get the latest deals, new arrivals, and exclusive offers straight
              to your inbox.
            </p>
          </div>
          <form
            onSubmit={handleSubscribe}
            className="flex w-full md:w-auto gap-2"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 md:w-72 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-[#78716C] focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition shrink-0"
            >
              Subscribe
            </button>
          </form>
          {subscribed && (
            <p className="text-xs text-green-400 md:hidden">
              Thanks for subscribing!
            </p>
          )}
        </div>
      </div>

      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-5 gap-8">
        {/* Brand */}
        <div className="col-span-2">
          <Link href="/" className="text-xl font-bold text-amber-400">
            OUTSOURCE
          </Link>
          <p className="text-sm text-[#A8A29E] mt-3 max-w-xs">
            Your one-stop multi-vendor marketplace for quality products from
            trusted sellers around the world.
          </p>

          <div className="flex items-center gap-3 mt-5">
            <a
              href="#"
              aria-label="Facebook"
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition"
            >
              <FaFacebookF size={15} />
            </a>
            <a
              href="#"
              aria-label="Instagram"
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition"
            >
              <FaInstagram size={15} />
            </a>
            <a
              href="#"
              aria-label="Twitter"
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition"
            >
              <FaXTwitter size={15} />
            </a>
            <a
              href="#"
              aria-label="YouTube"
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition"
            >
              <FaYoutube size={15} />
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-sm font-semibold text-white mb-4">Quick Links</h4>
          <ul className="space-y-2.5 text-sm text-[#A8A29E]">
            <li>
              <Link href="/" className="hover:text-white transition">
                Home
              </Link>
            </li>
            <li>
              <Link href="/products" className="hover:text-white transition">
                All Products
              </Link>
            </li>
            <li>
              <Link href="/shops" className="hover:text-white transition">
                All Shops
              </Link>
            </li>
            <li>
              <Link href="/offers" className="hover:text-white transition">
                Offers & Deals
              </Link>
            </li>
            <li>
              <Link href="/cart" className="hover:text-white transition">
                My Cart
              </Link>
            </li>
          </ul>
        </div>

        {/* Customer Service */}
        <div>
          <h4 className="text-sm font-semibold text-white mb-4">
            Customer Service
          </h4>
          <ul className="space-y-2.5 text-sm text-[#A8A29E]">
            <li>
              <Link
                href="/profile?active=Orders"
                className="hover:text-white transition"
              >
                Track Order
              </Link>
            </li>
            <li>
              <Link href="/returns" className="hover:text-white transition">
                Returns & Refunds
              </Link>
            </li>
            <li>
              <Link href="/shipping" className="hover:text-white transition">
                Shipping Info
              </Link>
            </li>
            <li>
              <Link href="/faq" className="hover:text-white transition">
                FAQs
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-white transition">
                Contact Us
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="text-sm font-semibold text-white mb-4">
            Get in Touch
          </h4>
          <ul className="space-y-3 text-sm text-[#A8A29E]">
            <li className="flex items-start gap-2">
              <MapPin size={15} className="mt-0.5 shrink-0" />
              <span>123 Market Street, Bangalore, India</span>
            </li>
            <li className="flex items-center gap-2">
              <Phone size={15} className="shrink-0" />
              <span>+91 98765 43210</span>
            </li>
            <li className="flex items-center gap-2">
              <Mail size={15} className="shrink-0" />
              <span>support@eshop.com</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[#78716C]">
            &copy; {new Date().getFullYear()} Eshop. All rights reserved.
          </p>

          <div className="flex items-center gap-4 text-xs text-[#78716C]">
            <Link href="/privacy" className="hover:text-white transition">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-white transition">
              Terms of Service
            </Link>
          </div>

          <div className="flex items-center gap-2 text-[#78716C]">
            <CreditCard size={16} />
            <span className="text-xs">Secure payments powered by Stripe</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
