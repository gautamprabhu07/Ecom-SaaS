// path: apps/user-ui/src/shared/components/section/cards/product-card.tsx
import Link from "next/link";
import React, { useState, useEffect } from "react";
import Ratings from "../../ratings";
import { Eye, Heart, ShoppingBag } from "lucide-react";
import ProductDetailsCard from "./product-details-card";
import { useStore } from "apps/user-ui/src/store";
import useLocationTracking from "apps/user-ui/src/hooks/useLocationTracking";
import useUser from "apps/user-ui/src/hooks/useUser";
import useDeviceTracking from "apps/user-ui/src/hooks/useDeviceTracking";

const ProductCard = ({
  product,
  isEvent,
}: {
  product: any;
  isEvent?: boolean;
}) => {
  const [timeLeft, setTimeLeft] = useState("");
  const [open, setOpen] = useState(false);
  const { user } = useUser();
  const location = useLocationTracking();
  const deviceInfo = useDeviceTracking();
  const addToWishlist = useStore((state: any) => state.addToWishlist);
  const removeFromWishlist = useStore((state: any) => state.removeFromWishlist);
  const addToCart = useStore((state: any) => state.addToCart);
  const wishlist = useStore((state: any) => state.wishlist);
  const isWishlisted = wishlist.some((item: any) => item.id === product.id);
  const cart = useStore((state: any) => state.cart);
  const isInCart = cart.some((item: any) => item.id === product.id);

  useEffect(() => {
    if (isEvent && product?.ending_date) {
      const interval = setInterval(() => {
        const diff = new Date(product.ending_date).getTime() - Date.now();
        if (diff <= 0) {
          setTimeLeft("Expired");
          clearInterval(interval);
          return;
        }
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        setTimeLeft(`${days}d ${hours}h ${minutes}m left with this price`);
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [isEvent, product?.ending_date]);

  return (
    <div className="relative bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition group">
      {/* Badges */}
      {isEvent && (
        <div className="absolute top-2 left-2 z-10 bg-red-500 text-white text-xs font-semibold px-2 py-0.5 rounded">
          OFFER
        </div>
      )}
      {product?.stock <= 5 && (
        <div className="absolute top-2 right-2 z-10 bg-amber-500 text-white text-xs font-semibold px-2 py-0.5 rounded">
          Limited Stock
        </div>
      )}

      {/* Image */}
      <Link
        href={`/product/${product?.slug}`}
        className="block relative h-52 overflow-hidden bg-gray-50"
      >
        <img
          src={product?.images?.[0]?.url}
          alt={product?.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </Link>

      {/* Action icons */}
      <div className="absolute right-2 top-[calc(50%-48px)] flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition">
        {[
          {
            icon: (
              <Heart
                size={15}
                fill={isWishlisted ? "red" : "transparent"}
                stroke="red"
                onClick={() => {
                  if (!user?.id)
                    console.log(
                      "No user - wishlist click won't fire kafka event",
                    );
                  isWishlisted
                    ? removeFromWishlist(product.id, user, location, deviceInfo)
                    : addToWishlist(
                        { ...product, quantity: 1 },
                        user,
                        location,
                        deviceInfo,
                      );
                }}
              />
            ),
            action: () => {},
          },
          { icon: <Eye size={15} />, action: () => setOpen(!open) },
          {
            icon: (
              <ShoppingBag
                size={15}
                onClick={() =>
                  !isInCart &&
                  addToCart(
                    { ...product, quantity: 1 },
                    user,
                    location,
                    deviceInfo,
                  )
                }
              />
            ),
            action: () => {},
          },
        ].map(({ icon, action }, i) => (
          <button
            key={i}
            onClick={action}
            className="w-8 h-8 bg-white rounded-full shadow flex items-center justify-center text-gray-600 hover:text-blue-600 hover:shadow-md transition"
          >
            {icon}
          </button>
        ))}
      </div>

      {/* Info */}
      <div className="p-3 space-y-1.5">
        <Link href={`/shop/${product?.Shop?.name}`}>
          <h3 className="text-sm font-medium text-gray-800 line-clamp-2 hover:text-blue-600 transition">
            {product?.title}
          </h3>
        </Link>

        <Ratings rating={product?.ratings} />

        <div className="flex items-center justify-between">
          <span className="text-base font-semibold text-gray-900">
            ${product?.sale_price}
          </span>
          <span className="text-xs text-gray-400">
            {product?.totalSales} sold
          </span>
        </div>

        {isEvent && timeLeft && (
          <p className="text-xs text-red-500 font-medium">{timeLeft}</p>
        )}
      </div>

      {open && <ProductDetailsCard data={product} setOpen={setOpen} />}
    </div>
  );
};

export default ProductCard;
