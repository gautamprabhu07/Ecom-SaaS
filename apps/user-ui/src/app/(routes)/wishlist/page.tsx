"use client";
import React from "react";
import useUser from "../../../hooks/useUser";
import { useStore } from "apps/user-ui/src/store";
import useLocationTracking from "../../../hooks/useLocationTracking";
import useDeviceTracking from "../../../hooks/useDeviceTracking";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, ShoppingCart, Trash2 } from "lucide-react";

const WishListPage = () => {
  const { user } = useUser();
  const location = useLocationTracking();
  const deviceInfo = useDeviceTracking();
  const addToCart = useStore((state: any) => state.addToCart);
  const removeFromWishlist = useStore((state: any) => state.removeFromWishlist);
  const wishlist = useStore((state: any) => state.wishlist);

  const decreaseQuantity = (id: string) => {
    useStore.setState((state: any) => ({
      wishlist: state.wishlist.map((item: any) =>
        item.id === id && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item,
      ),
    }));
  };

  const increaseQuantity = (id: string) => {
    useStore.setState((state: any) => ({
      wishlist: state.wishlist.map((item: any) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item,
      ),
    }));
  };

  const removeItem = (id: string) =>
    removeFromWishlist(id, user, location, deviceInfo);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Breadcrumb */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">
          Wishlist
          {wishlist.length > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-400">
              ({wishlist.length} {wishlist.length === 1 ? "item" : "items"})
            </span>
          )}
        </h1>
        <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
          <Link
            href="/"
            className="hover:text-emerald-600 transition-colors duration-150"
          >
            Home
          </Link>
          <ChevronRight size={14} />
          <span className="text-gray-700">Wishlist</span>
        </div>
      </div>

      {wishlist.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] p-16 text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center">
            <ShoppingCart size={26} className="text-gray-300" />
          </div>
          <p className="text-gray-400 text-sm">Your wishlist is empty.</p>
          <Link
            href="/"
            className="group mt-4 inline-flex items-center gap-1 text-emerald-600 text-sm font-medium hover:text-emerald-700 transition-colors duration-150"
          >
            Continue Shopping
            <ChevronRight
              size={14}
              className="transition-transform duration-200 group-hover:translate-x-1"
            />
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500 text-left bg-gray-50">
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Quantity</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {wishlist.map((item: any) => (
                <tr
                  key={item.id}
                  className="group text-gray-700 transition-colors duration-150 hover:bg-gray-50/80"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-gray-200 shrink-0 transition-transform duration-200 group-hover:scale-105 group-hover:border-emerald-300">
                        <Image
                          src={item.images?.[0]?.url || "/product-backup.jpg"}
                          alt={item.title}
                          layout="fill"
                          objectFit="cover"
                        />
                      </div>
                      <span className="font-medium text-gray-800 line-clamp-2 transition-colors duration-150 group-hover:text-emerald-700">
                        {item.title}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    ${item?.sale_price.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden w-fit transition-colors duration-150 group-hover:border-emerald-300">
                      <button
                        onClick={() => decreaseQuantity(item?.id)}
                        className="px-2.5 py-1 text-gray-600 hover:bg-gray-100 hover:text-emerald-600 transition-colors duration-150"
                      >
                        −
                      </button>
                      <span className="px-3 text-sm font-medium">
                        {item?.quantity}
                      </span>
                      <button
                        onClick={() => increaseQuantity(item?.id)}
                        className="px-2.5 py-1 text-gray-600 hover:bg-gray-100 hover:text-emerald-600 transition-colors duration-150"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          addToCart(item, user, location, deviceInfo)
                        }
                        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_16px_-4px_rgba(5,150,105,0.4)] active:translate-y-0"
                      >
                        <ShoppingCart size={13} /> Add to Cart
                      </button>
                      <button
                        onClick={() => removeItem(item?.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 hover:scale-110 rounded-lg transition-all duration-200"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default WishListPage;
