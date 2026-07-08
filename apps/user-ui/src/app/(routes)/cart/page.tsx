"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import useUser from "../../../hooks/useUser";
import useLocationTracking from "../../../hooks/useLocationTracking";
import useDeviceTracking from "../../../hooks/useDeviceTracking";
import Link from "next/link";
import { useStore } from "apps/user-ui/src/store";
import Image from "next/image";
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
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item,
      ),
    }));
  };

  const removeItem = (id: string) => {
    removeFromCart(id, user, location, deviceInfo);
  };

  const subtotal = cart.reduce(
    (total: number, item: any) => total + item.sale_price * item.quantity,
    0,
  );

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
                            $
                            {(
                              (item.sale_price * (100 - discountPercent)) /
                              100
                            ).toFixed(2)}
                          </span>
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
                    <td>
                      <button onClick={() => removeItem(item?.id)}>
                        <X />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

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
    </div>
  );
};

export default CartPage;
