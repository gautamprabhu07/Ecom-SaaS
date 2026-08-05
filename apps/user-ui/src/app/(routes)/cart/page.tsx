<<<<<<< HEAD
//Path: apps/user-ui/src/app/%28routes%29/cart/page.tsx
"use client";
import React, { useState, useEffect } from "react";
=======
"use client";
import React, { useState } from "react";
>>>>>>> 8e6f03df1bed8880d94459fa06687a3233806394
import { useRouter } from "next/navigation";
import useUser from "../../../hooks/useUser";
import useLocationTracking from "../../../hooks/useLocationTracking";
import useDeviceTracking from "../../../hooks/useDeviceTracking";
import Link from "next/link";
import { useStore } from "apps/user-ui/src/store";
import Image from "next/image";
<<<<<<< HEAD
import { ChevronDown, ChevronRight, Loader2, X } from "lucide-react";
import axiosInstance from "apps/user-ui/src/utils/axiosInstance";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

const selectClass =
  "w-full appearance-none bg-white border border-neutral-300 rounded-xl pl-3 pr-9 py-2.5 text-sm text-neutral-800 cursor-pointer transition-all duration-200 hover:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500";

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
  const [error, setError] = useState("");
  const [storedCouponCOde, setStoredCouponCode] = useState("");

  const couponCodeApplyHandler = async () => {
    setError("");
    if (!couponCode.trim()) {
      setError("Please enter a coupon code.");
      return;
    }

    try {
      const res = await axiosInstance.post("/order/api/verify-coupon", {
        couponCode: couponCode.trim(),
        cart,
      });

      if (res.data.valid) {
        setStoredCouponCode(couponCode.trim());
        setDiscountAmount(parseFloat(res.data.discountAmount));
        setDiscountPercent(res.data.discountPercent);
        setDiscountedProductId(res.data.discountedProductId);
        setCouponCode("");
      } else {
        setDiscountAmount(0);
        setDiscountPercent(0);
        setDiscountedProductId("");
        setError("Invalid coupon code.");
      }
    } catch (error: any) {
      setDiscountAmount(0);
      setDiscountPercent(0);
      setDiscountedProductId("");
      console.error("Error verifying coupon:", error);
      setError(
        error?.response?.data?.message ||
          "An error occurred while verifying the coupon.",
      );
    }
  };

  const createPaymentSession = async () => {
    if (addresses?.length === 0) {
      toast.error(
        "Please add a shipping address before proceeding to checkout.",
      );
      return;
    }
    setLoading(true);
    try {
      const response = await axiosInstance.post(
        "/order/api/create-payment-session",
        {
          cart,
          selectedAddressId,
          coupon: {
            code: storedCouponCOde,
            discountAmount,
            discountPercent,
            discountedProductId,
          },
        },
      );
      const sessionId = response.data.sessionId;
      router.push(`/checkout?session_id=${sessionId}`);
    } catch (error) {
      toast.error("Failed to create payment session. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
=======
import { Loader2, X } from "lucide-react";

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
>>>>>>> 8e6f03df1bed8880d94459fa06687a3233806394
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item,
      ),
    }));
  };

<<<<<<< HEAD
  const removeItem = (id: string) =>
    removeFromCart(id, user, location, deviceInfo);
=======
  const removeItem = (id: string) => {
    removeFromCart(id, user, location, deviceInfo);
  };
>>>>>>> 8e6f03df1bed8880d94459fa06687a3233806394

  const subtotal = cart.reduce(
    (total: number, item: any) => total + item.sale_price * item.quantity,
    0,
  );

<<<<<<< HEAD
  const { data: addresses = [] } = useQuery<any[], Error>({
    queryKey: ["shipping-addresses"],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/shipping-addresses");
      return res.data.addresses;
    },
  });

  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const defaultAddress = addresses.find((address) => address.isDefault);
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
      }
    }
  }, [addresses, selectedAddressId]);

  return (
    <div className="min-h-screen bg-[#FAF8F3] p-6">
      {/* Breadcrumb */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">
          Shopping Cart
          {cart.length > 0 && (
            <span className="ml-2 text-sm font-normal text-neutral-400">
              ({cart.length} {cart.length === 1 ? "item" : "items"})
            </span>
          )}
        </h1>
        <div className="flex items-center gap-1 text-sm text-neutral-500 mt-1">
          <Link
            href="/"
            className="hover:text-emerald-600 transition-colors duration-150"
          >
            Home
          </Link>
          <ChevronRight size={14} />
          <span className="text-neutral-700">Cart</span>
        </div>
      </div>

      {cart.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-[0_4px_20px_-4px_rgba(120,53,15,0.08)] p-16 text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-neutral-50 flex items-center justify-center">
            <X size={26} className="text-neutral-300" />
          </div>
          <p className="text-neutral-400 text-sm">Your cart is empty.</p>
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
        <div className="flex gap-6 items-start">
          {/* Cart table */}
          <div className="flex-1 bg-white rounded-2xl border border-neutral-200 shadow-[0_4px_20px_-4px_rgba(120,53,15,0.08)] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 text-neutral-500 text-left bg-neutral-50">
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Quantity</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {cart?.map((item: any) => (
                  <tr
                    key={item.id}
                    className="group text-neutral-700 transition-colors duration-150 hover:bg-neutral-50/80"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-neutral-200 shrink-0 transition-transform duration-200 group-hover:scale-105 group-hover:border-emerald-300">
                          <Image
                            src={item?.images?.[0]?.url || "/product-backup.jpg"}
                            alt={item.title}
                            layout="fill"
                            objectFit="cover"
                          />
                        </div>
                        <div>
                          <p className="font-medium text-neutral-800 line-clamp-1 transition-colors duration-150 group-hover:text-emerald-700">
                            {item.title}
                          </p>
                          {item?.selectedOptions && (
                            <div className="flex gap-2 mt-0.5">
                              {item?.selectedOptions?.color && (
                                <span className="text-xs text-neutral-500 flex items-center gap-1">
                                  Color:
                                  <span
                                    className="inline-block w-3 h-3 rounded-full border border-neutral-300"
                                    style={{
                                      backgroundColor:
                                        item?.selectedOptions?.color,
                                    }}
                                  />
                                </span>
                              )}
                              {item?.selectedOptions?.size && (
                                <span className="text-xs text-neutral-500">
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
                          <span className="text-neutral-400 line-through text-xs">
                            ${item.sale_price.toFixed(2)}
                          </span>
                          <span className="font-semibold text-neutral-900 ml-1">
=======
  return (
    <div>
      <div>
        <div>
          <h1>Shopping Cart</h1>
          <Link href={"/"}>Home</Link>
          <span>Cart</span>
        </div>

        {cart.length === 0 ? (
          <div>
            <p>Your cart is empty.</p>
          </div>
        ) : (
          <div>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Quantity</th>
                </tr>
              </thead>
              <tbody>
                {cart?.map((item: any) => (
                  <tr key={item.id}>
                    <td>
                      <Image
                        src={item?.images[0]?.url}
                        alt={item.title}
                        width={50}
                        height={50}
                      />
                      <div>
                        <span>{item.title}</span>
                        {item?.selectedOptions && (
                          <div>
                            {item?.selectedOptions?.color && (
                              <span>
                                Color: {}{" "}
                                <span
                                  style={{
                                    backgroundColor:
                                      item?.selectedOptions?.color,
                                  }}
                                />
                              </span>
                            )}
                            {item?.selectedOptions?.size && (
                              <span>Size: {item?.selectedOptions?.size}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      {item?.id === discountedProductId ? (
                        <div>
                          <span>${item.sale_price.toFixed(2)}</span>{" "}
                          <span>
>>>>>>> 8e6f03df1bed8880d94459fa06687a3233806394
                            $
                            {(
                              (item.sale_price * (100 - discountPercent)) /
                              100
                            ).toFixed(2)}
                          </span>
<<<<<<< HEAD
                          <span className="block text-xs text-emerald-600 font-medium">
                            Discount Applied
                          </span>
                        </div>
                      ) : (
                        <span className="font-semibold text-neutral-900">
                          ${item?.sale_price.toFixed(2)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center border border-neutral-300 rounded-full overflow-hidden w-fit transition-colors duration-150 group-hover:border-emerald-300">
                        <button
                          onClick={() => decreaseQuantity(item?.id)}
                          className="px-2.5 py-1 text-neutral-600 hover:bg-neutral-100 hover:text-emerald-600 transition-colors duration-150"
=======
                          <span>Discount Applied</span>
                        </div>
                      ) : (
                        <span>${item?.sale_price.toFixed(2)}</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden w-fit">
                        <button
                          onClick={() => decreaseQuantity(item?.id)}
                          className="px-2.5 py-1 text-gray-600 hover:bg-gray-100 transition"
>>>>>>> 8e6f03df1bed8880d94459fa06687a3233806394
                        >
                          −
                        </button>
                        <span className="px-3 text-sm font-medium">
                          {item?.quantity}
                        </span>
                        <button
                          onClick={() => increaseQuantity(item?.id)}
<<<<<<< HEAD
                          className="px-2.5 py-1 text-neutral-600 hover:bg-neutral-100 hover:text-emerald-600 transition-colors duration-150"
=======
                          className="px-2.5 py-1 text-gray-600 hover:bg-gray-100 transition"
>>>>>>> 8e6f03df1bed8880d94459fa06687a3233806394
                        >
                          +
                        </button>
                      </div>
                    </td>
<<<<<<< HEAD
                    <td className="px-4 py-3">
                      <button
                        onClick={() => removeItem(item?.id)}
                        className="p-1.5 text-neutral-400 hover:text-rose-500 hover:bg-rose-50 hover:scale-110 rounded-full transition-all duration-200"
                      >
                        <X size={15} />
=======
                    <td>
                      <button onClick={() => removeItem(item?.id)}>
                        <X />
>>>>>>> 8e6f03df1bed8880d94459fa06687a3233806394
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
<<<<<<< HEAD
          </div>

          {/* Order summary */}
          <div className="w-80 shrink-0 bg-white rounded-2xl border border-neutral-200 shadow-[0_4px_20px_-4px_rgba(120,53,15,0.08)] p-5 space-y-4 transition-shadow duration-300 hover:shadow-[0_8px_30px_-8px_rgba(120,53,15,0.14)]">
            {/* Discount row */}
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">
                  Discount ({discountPercent}%)
                </span>
                <span className="text-emerald-600 font-medium">
                  -${discountAmount.toFixed(2)}
                </span>
              </div>
            )}

            <div className="flex justify-between text-sm font-medium text-neutral-700">
              <span>Subtotal</span>
              <span>${(subtotal - discountAmount).toFixed(2)}</span>
            </div>

            <hr className="border-neutral-100" />

            {/* Coupon */}
            <div>
              <h4 className="text-sm font-medium text-neutral-700 mb-2">
                Have a coupon?
              </h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e: any) => setCouponCode(e.target.value)}
                  className="flex-1 border border-neutral-300 rounded-xl px-3 py-2 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <button
                  className="px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-full transition-all duration-200 hover:bg-neutral-800 hover:-translate-y-0.5 active:translate-y-0"
                  onClick={() => couponCodeApplyHandler()}
                >
                  Apply
                </button>
              </div>
              {error && (
                <p className="text-xs text-rose-500 mt-1 animate-[dropdown-in_150ms_ease-out]">
                  {error}
                </p>
              )}
            </div>

            <hr className="border-neutral-100" />

            {/* Shipping address */}
            <div>
              <h4 className="text-sm font-medium text-neutral-700 mb-2">
                Shipping Address
              </h4>
              {addresses?.length !== 0 && (
                <div className="relative">
                  <select
                    value={selectedAddressId}
                    onChange={(e) => setSelectedAddressId(e.target.value)}
                    className={selectClass}
                  >
                    {addresses.map((address: any) => (
                      <option key={address.id} value={address.id}>
                        {address.label} - {address.street}, {address.city},{" "}
                        {address.country}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
                  />
                </div>
              )}
              {addresses?.length === 0 && (
                <p className="text-xs text-neutral-400">
                  No saved addresses. Please add one in your profile.
                </p>
              )}
            </div>

            <hr className="border-neutral-100" />

            {/* Payment method */}
            <div>
              <h4 className="text-sm font-medium text-neutral-700 mb-2">
                Payment Method
              </h4>
              <div className="relative">
                <select className={selectClass}>
                  <option>Online Payment</option>
                  <option>Cash on Delivery</option>
                </select>
                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
                />
              </div>
            </div>

            <hr className="border-neutral-100" />

            {/* Total + checkout */}
            <div className="flex justify-between text-base font-semibold text-neutral-900">
              <span>Total</span>
              <span>${(subtotal - discountAmount).toFixed(2)}</span>
            </div>

            <button
              disabled={loading}
              onClick={createPaymentSession}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-full text-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-8px_rgba(5,150,105,0.4)] active:translate-y-0 disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? "Processing..." : "Proceed to Checkout"}
            </button>
          </div>
        </div>
      )}
=======

            <div>
              {discountAmount > 0 && (
                <div>
                  <span>Discount: ({discountPercent}%)</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div>
                <span>Subtotal:</span>
                <span>${(subtotal - discountAmount).toFixed(2)}</span>
              </div>
              <hr></hr>
              <div>
                <h4>Have a coupon?</h4>
                <div>
                  <input
                    type="text"
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e: any) => setCouponCode(e.target.value)}
                  />
                  <button>Apply</button>
                  {/* {error && <p>{error}</p>} */}
                </div>
                <hr />
                <div>
                  <h4>Select Shipping Address</h4>
                  <select
                    value={selectedAddressId}
                    onChange={(e: any) => setSelectedAddressId(e.target.value)}
                  >
                    <option value="123">Home-Manipal-India</option>
                  </select>
                </div>
                <hr />
                <div>
                  <h4>Select Payment Method</h4>
                  <select>
                    <option>Online Payment</option>
                    <option>Cash on Delivery</option>
                  </select>
                </div>
                <hr />
                <div>
                  <span>Total: </span>
                  <span>${(subtotal - discountAmount).toFixed(2)}</span>
                </div>
                <button disabled={loading}>
                  {loading && <Loader2 />}
                  {loading ? "Processing..." : "Proceed to Checkout"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
>>>>>>> 8e6f03df1bed8880d94459fa06687a3233806394
    </div>
  );
};

export default CartPage;
