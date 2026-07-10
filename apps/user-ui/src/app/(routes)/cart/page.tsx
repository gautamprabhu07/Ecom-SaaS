"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import useUser from "../../../hooks/useUser";
import useLocationTracking from "../../../hooks/useLocationTracking";
import useDeviceTracking from "../../../hooks/useDeviceTracking";
import Link from "next/link";
import { useStore } from "apps/user-ui/src/store";
import Image from "next/image";
import { ChevronRight, Loader2, X } from "lucide-react";

const selectClass =
  "w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

const CartPage = () => {
  const router = useRouter();
  const { user } = useUser();
  const location = useLocationTracking();
  const deviceInfo = useDeviceTracking();
  const [discountedProductId, setDiscountedProductId] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const cart = useStore((state: any) => state.cart);
  const removeFromCart = useStore((state: any) => state.removeFromCart);

  const decreaseQuantity = (id: string) => {
    useStore.setState((state: any) => ({
      cart: state.cart.map((item: any) =>
        item.id === id && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item,
      ),
    }));
  };

  const increaseQuantity = (id: string) => {
    useStore.setState((state: any) => ({
      cart: state.cart.map((item: any) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item,
      ),
    }));
  };

  const removeItem = (id: string) =>
    removeFromCart(id, user, location, deviceInfo);

  const subtotal = cart.reduce(
    (total: number, item: any) => total + item.sale_price * item.quantity,
    0,
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Breadcrumb */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Shopping Cart</h1>
        <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
          <Link href="/" className="hover:text-gray-700">
            Home
          </Link>
          <ChevronRight size={14} />
          <span className="text-gray-700">Cart</span>
        </div>
      </div>

      {cart.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <p className="text-gray-400 text-sm">Your cart is empty.</p>
          <Link
            href="/"
            className="mt-4 inline-block text-blue-600 text-sm hover:underline"
          >
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="flex gap-6 items-start">
          {/* Cart table */}
          <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500 text-left">
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Quantity</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {cart?.map((item: any) => (
                  <tr key={item.id} className="text-gray-700">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-gray-200 shrink-0">
                          <Image
                            src={item?.images[0]?.url}
                            alt={item.title}
                            layout="fill"
                            objectFit="cover"
                          />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 line-clamp-1">
                            {item.title}
                          </p>
                          {item?.selectedOptions && (
                            <div className="flex gap-2 mt-0.5">
                              {item?.selectedOptions?.color && (
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  Color:
                                  <span
                                    className="inline-block w-3 h-3 rounded-full border border-gray-300"
                                    style={{
                                      backgroundColor:
                                        item?.selectedOptions?.color,
                                    }}
                                  />
                                </span>
                              )}
                              {item?.selectedOptions?.size && (
                                <span className="text-xs text-gray-500">
                                  Size: {item?.selectedOptions?.size}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {item?.id === discountedProductId ? (
                        <div>
                          <span className="text-gray-400 line-through text-xs">
                            ${item.sale_price.toFixed(2)}
                          </span>
                          <span className="font-semibold text-gray-900 ml-1">
                            $
                            {(
                              (item.sale_price * (100 - discountPercent)) /
                              100
                            ).toFixed(2)}
                          </span>
                          <span className="block text-xs text-green-600 font-medium">
                            Discount Applied
                          </span>
                        </div>
                      ) : (
                        <span className="font-semibold text-gray-900">
                          ${item?.sale_price.toFixed(2)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden w-fit">
                        <button
                          onClick={() => decreaseQuantity(item?.id)}
                          className="px-2.5 py-1 text-gray-600 hover:bg-gray-100 transition"
                        >
                          −
                        </button>
                        <span className="px-3 text-sm font-medium">
                          {item?.quantity}
                        </span>
                        <button
                          onClick={() => increaseQuantity(item?.id)}
                          className="px-2.5 py-1 text-gray-600 hover:bg-gray-100 transition"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => removeItem(item?.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                      >
                        <X size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Order summary */}
          <div className="w-80 shrink-0 bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            {/* Discount row */}
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">
                  Discount ({discountPercent}%)
                </span>
                <span className="text-green-600 font-medium">
                  -${discountAmount.toFixed(2)}
                </span>
              </div>
            )}

            <div className="flex justify-between text-sm font-medium text-gray-700">
              <span>Subtotal</span>
              <span>${(subtotal - discountAmount).toFixed(2)}</span>
            </div>

            <hr className="border-gray-100" />

            {/* Coupon */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Have a coupon?
              </h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e: any) => setCouponCode(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button className="px-3 py-2 bg-gray-800 text-white text-sm rounded-lg hover:bg-gray-700 transition">
                  Apply
                </button>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Shipping address */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Shipping Address
              </h4>
              <select
                value={selectedAddressId}
                onChange={(e: any) => setSelectedAddressId(e.target.value)}
                className={selectClass}
              >
                <option value="123">Home - Manipal, India</option>
              </select>
            </div>

            <hr className="border-gray-100" />

            {/* Payment method */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </h4>
              <select className={selectClass}>
                <option>Online Payment</option>
                <option>Cash on Delivery</option>
              </select>
            </div>

            <hr className="border-gray-100" />

            {/* Total + checkout */}
            <div className="flex justify-between text-base font-semibold text-gray-800">
              <span>Total</span>
              <span>${(subtotal - discountAmount).toFixed(2)}</span>
            </div>

            <button
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition disabled:opacity-60"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? "Processing..." : "Proceed to Checkout"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
