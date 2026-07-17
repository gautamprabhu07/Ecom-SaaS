//Path: apps/user-ui/src/shared/modules/hero/index.tsx
"use client";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Star, ShieldCheck, Truck } from "lucide-react";
import React from "react";

const Hero = () => {
  const router = useRouter();

  return (
    <section className="relative overflow-hidden bg-[#FAF8F3]">
      {/* subtle dot grid backdrop */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: "radial-gradient(#00000014 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-16 px-6 py-20 lg:grid-cols-12 lg:px-8 lg:py-28">
        {/* Left: copy */}
        <div className="flex flex-col justify-center lg:col-span-6">
          <span className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium tracking-wide text-neutral-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            MULTI-VENDOR MARKETPLACE
          </span>

          <h1 className="text-4xl font-bold leading-[1.05] tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
            Every seller.
            <br />
            <span className="text-emerald-600">Every shopper.</span>
            <br />
            One marketplace.
          </h1>

          <p className="mt-6 max-w-md text-base leading-relaxed text-neutral-600">
            Launch a storefront in minutes or find exactly what you're looking
            for from thousands of independent sellers — all in one place, all
            verified, all shipped fast.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <button
              onClick={() => router.push("/signup?role=seller")}
              className="group inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Start selling
              <ArrowUpRight
                size={16}
                className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </button>
            <button
              onClick={() => router.push("/products")}
              className="rounded-full border border-neutral-300 bg-white px-6 py-3.5 text-sm font-semibold text-neutral-800 transition hover:border-emerald-400"
            >
              Explore products
            </button>
          </div>

          {/* trust row */}
          <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-neutral-200 pt-6">
            <div>
              <p className="text-2xl font-bold text-neutral-900">12K+</p>
              <p className="text-xs text-neutral-500">Active vendors</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">480K+</p>
              <p className="text-xs text-neutral-500">Products listed</p>
            </div>
            <div className="flex items-center gap-1">
              <Star size={16} className="fill-amber-400 text-amber-400" />
              <p className="text-2xl font-bold text-neutral-900">4.8</p>
              <p className="text-xs text-neutral-500">avg. seller rating</p>
            </div>
          </div>
        </div>

        {/* Right: product collage */}
        <div className="relative flex items-center justify-center lg:col-span-6">
          <div className="relative h-[420px] w-full max-w-md">
            {/* large card */}
            <div className="absolute left-0 top-0 h-64 w-56 rotate-[-4deg] overflow-hidden rounded-2xl shadow-xl shadow-emerald-200/40">
              <img
                src="/hero1.avif"
                alt="Featured product"
                className="h-full w-full object-cover"
              />
            </div>

            {/* medium card */}
            <div className="absolute right-2 top-10 h-48 w-44 rotate-[6deg] overflow-hidden rounded-2xl shadow-xl shadow-teal-200/40">
              <img
                src="/hero2.avif"
                alt="Featured product"
                className="h-full w-full object-cover"
              />
            </div>

            {/* small card */}
            <div className="absolute bottom-0 left-16 h-40 w-40 rotate-[3deg] overflow-hidden rounded-2xl shadow-xl shadow-amber-200/40">
              <img
                src="/hero3.webp"
                alt="Featured product"
                className="h-full w-full object-cover"
              />
            </div>

            {/* floating price chip */}
            <div className="absolute left-4 top-40 flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-lg">
              <span className="text-sm font-bold text-neutral-900">$42</span>
              <span className="text-xs text-neutral-400 line-through">$68</span>
            </div>

            {/* floating shipping chip */}
            <div className="absolute right-0 bottom-8 flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-lg">
              <Truck size={14} className="text-neutral-700" />
              <span className="text-xs font-medium text-neutral-700">
                2-day delivery
              </span>
            </div>

            {/* floating trust chip */}
            <div className="absolute right-10 top-0 flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-lg">
              <ShieldCheck size={14} className="text-emerald-600" />
              <span className="text-xs font-medium text-neutral-700">
                Verified seller
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
