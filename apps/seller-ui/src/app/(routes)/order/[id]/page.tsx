//Path: apps/seller-ui/src/app/%28routes%29/order/%5Bid%5D/page.tsx
//order details page for seller
"use client";
import React, { useEffect, useState } from "react";
import { ArrowLeft, Loader2, MapPin, Tag } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import axiosInstance from "../../../../utils/axiosInstance";

const statusSteps = [
  "Ordered",
  "Packed",
  "Shipped",
  "Out for Delivery",
  "Delivered",
];

const Page = () => {
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const router = useRouter();

  const fetchOrder = async () => {
    try {
      const response = await axiosInstance.get(
        `/order/api/get-order-details/${orderId}`,
      );
      setOrder(response.data.order);
    } catch (error) {
      console.error("Error fetching order details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const newStatus = e.target.value;
    setUpdating(true);
    try {
      await axiosInstance.put(`/order/api/update-status/${orderId}`, {
        deliveryStatus: newStatus,
      });
      setOrder((prevOrder: any) => ({
        ...prevOrder,
        deliveryStatus: newStatus,
      }));
    } catch (error) {
      console.error("Error updating order status:", error);
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-gray-400" size={28} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6 text-center text-sm text-gray-400">
        Order not found.
      </div>
    );
  }

  const currentIndex = statusSteps.indexOf(order.deliveryStatus);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Back link */}
      <button
        onClick={() => router.push("/dashboard/orders")}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition"
      >
        <ArrowLeft size={15} />
        Back to Orders
      </button>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-800">
          Order #{order.id.slice(-6).toUpperCase()}
        </h3>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500">
            Update delivery status:
          </label>
          <select
            value={order.deliveryStatus}
            onChange={handleStatusChange}
            disabled={updating}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
          >
            {statusSteps.map((s) => {
              const statusIndex = statusSteps.indexOf(s);
              return (
                <option key={s} value={s} disabled={statusIndex < currentIndex}>
                  {s}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Delivery progress */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center">
          {statusSteps.map((step, index) => {
            const passed = currentIndex >= index;
            const isLast = index === statusSteps.length - 1;
            return (
              <React.Fragment key={step}>
                <div className="flex flex-col items-center shrink-0">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition ${
                      passed
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {passed ? "✓" : index + 1}
                  </div>
                  <span className="text-xs text-gray-600 mt-1.5 text-center w-20">
                    {step}
                  </span>
                </div>
                {!isLast && (
                  <div
                    className={`flex-1 h-1 mx-1 rounded transition ${
                      currentIndex > index ? "bg-green-500" : "bg-gray-200"
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Summary info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Payment Status</span>
          <span
            className={`font-medium px-2 py-0.5 rounded-full text-xs ${
              order.status === "Paid"
                ? "bg-green-50 text-green-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {order.status}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-500">Total Paid</span>
          <span className="font-semibold text-gray-800">
            ${order.total.toFixed(2)}
          </span>
        </div>

        {order.discountAmount > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-500">Discount Applied</span>
            <span className="text-green-600 font-medium">
              -${order.discountAmount.toFixed(2)}
              {order.couponCode && (
                <span className="text-gray-400 font-normal ml-1">
                  (
                  {order.couponCode.discountType === "percentage"
                    ? `${order.couponCode.discountValue}%`
                    : `$${order.couponCode.discountValue}`}
                  )
                </span>
              )}
            </span>
          </div>
        )}

        {order.couponCode && (
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Coupon Used</span>
            <span className="flex items-center gap-1 text-gray-700">
              <Tag size={13} className="text-gray-400" />
              {order.couponCode.public_name}
            </span>
          </div>
        )}

        <div className="flex justify-between">
          <span className="text-gray-500">Date</span>
          <span className="text-gray-700">
            {new Date(order.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Shipping address */}
      {order.shippingAddress && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-1.5">
            <MapPin size={15} className="text-gray-400" />
            Shipping Address
          </h4>
          <div className="text-sm text-gray-600 space-y-0.5">
            <p className="font-medium text-gray-800">
              {order.shippingAddress.name}
            </p>
            <p>
              {order.shippingAddress.street}, {order.shippingAddress.city}{" "}
              {order.shippingAddress.zip}
            </p>
            <p>{order.shippingAddress.country}</p>
          </div>
        </div>
      )}

      {/* Order items */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-800 mb-4">
          Order Items
        </h2>

        <div className="space-y-4">
          {order.items.map((item: any) => (
            <div
              key={item.productId}
              className="flex items-center gap-4 border-b border-gray-50 last:border-0 pb-4 last:pb-0"
            >
              {item.product?.images?.[0]?.url && (
                <img
                  src={item.product.images[0].url}
                  alt={item.product?.title || "Product"}
                  className="w-16 h-16 rounded-lg object-cover border border-gray-200 shrink-0"
                />
              )}
              <div className="flex-1">
                <p className="font-medium text-gray-800">
                  {item.product?.title ?? "Unknown product"}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Quantity: {item.quantity}
                </p>
                {item.selectedOptions &&
                  Object.keys(item.selectedOptions).length > 0 && (
                    <div className="flex gap-3 mt-1">
                      {Object.entries(item.selectedOptions).map(
                        ([key, value]: [string, any]) =>
                          value && (
                            <span
                              key={key}
                              className="text-xs text-gray-500 capitalize"
                            >
                              {key}: {value}
                            </span>
                          ),
                      )}
                    </div>
                  )}
              </div>
              <p className="font-medium text-gray-800">
                ${item.price.toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Page;
