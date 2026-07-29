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
        <Loader2 className="animate-spin text-[#059669]" size={28} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6 text-center text-sm text-[#78716C]">
        Order not found.
      </div>
    );
  }

  const currentIndex = statusSteps.indexOf(order.deliveryStatus);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 font-['Inter']">
      {/* Back link */}
      <button
        onClick={() => router.push("/dashboard/orders")}
        className="group flex items-center gap-1.5 text-sm font-medium text-[#78716C] hover:text-[#059669] transition-colors duration-200"
      >
        <ArrowLeft
          size={15}
          className="transition-transform duration-200 group-hover:-translate-x-1"
        />
        Back to Orders
      </button>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="font-['Nunito'] text-xl font-extrabold text-[#292524]">
          Order #{order.id.slice(-6).toUpperCase()}
        </h3>

        <div className="flex items-center gap-2">
          <label className="text-sm text-[#78716C]">
            Update delivery status:
          </label>
          <select
            value={order.deliveryStatus}
            onChange={handleStatusChange}
            disabled={updating}
            className="border border-[#E7E5E4] rounded-2xl px-3 py-1.5 text-sm text-[#292524] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-[#059669] disabled:opacity-60"
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
      <div className="bg-white rounded-2xl border border-[#E7E5E4] shadow-[0_4px_20px_-4px_rgba(120,53,15,0.08)] p-6 transition-shadow duration-300 hover:shadow-[0_8px_30px_-8px_rgba(120,53,15,0.14)]">
        <div className="flex items-center">
          {statusSteps.map((step, index) => {
            const passed = currentIndex >= index;
            const isLast = index === statusSteps.length - 1;
            return (
              <React.Fragment key={step}>
                <div className="flex flex-col items-center shrink-0">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
                      passed
                        ? "bg-[#059669] text-white shadow-[0_4px_12px_-2px_rgba(5,150,105,0.4)]"
                        : "bg-[#E7E5E4] text-[#78716C]"
                    }`}
                  >
                    {passed ? "✓" : index + 1}
                  </div>
                  <span className="text-xs text-[#78716C] mt-1.5 text-center w-20">
                    {step}
                  </span>
                </div>
                {!isLast && (
                  <div
                    className={`flex-1 h-1 mx-1 rounded transition-colors duration-300 ${
                      currentIndex > index ? "bg-[#059669]" : "bg-[#E7E5E4]"
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Summary info */}
      <div className="bg-white rounded-2xl border border-[#E7E5E4] shadow-[0_4px_20px_-4px_rgba(120,53,15,0.08)] p-6 space-y-3 text-sm transition-shadow duration-300 hover:shadow-[0_8px_30px_-8px_rgba(120,53,15,0.14)]">
        <div className="flex justify-between">
          <span className="text-[#78716C]">Payment Status</span>
          <span
            className={`font-medium px-2 py-0.5 rounded-full text-xs ${
              order.status === "Paid"
                ? "bg-[#D1FAE5] text-[#047857]"
                : "bg-[#F5F5F4] text-[#78716C]"
            }`}
          >
            {order.status}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-[#78716C]">Total Paid</span>
          <span className="font-semibold text-[#292524]">
            ${order.total.toFixed(2)}
          </span>
        </div>

        {order.discountAmount > 0 && (
          <div className="flex justify-between">
            <span className="text-[#78716C]">Discount Applied</span>
            <span className="text-[#059669] font-medium">
              -${order.discountAmount.toFixed(2)}
              {order.couponCode && (
                <span className="text-[#A8A29E] font-normal ml-1">
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
            <span className="text-[#78716C]">Coupon Used</span>
            <span className="flex items-center gap-1 text-[#292524]">
              <Tag size={13} className="text-[#78716C]" />
              {order.couponCode.public_name}
            </span>
          </div>
        )}

        <div className="flex justify-between">
          <span className="text-[#78716C]">Date</span>
          <span className="text-[#292524]">
            {new Date(order.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Shipping address */}
      {order.shippingAddress && (
        <div className="bg-white rounded-2xl border border-[#E7E5E4] shadow-[0_4px_20px_-4px_rgba(120,53,15,0.08)] p-6 transition-shadow duration-300 hover:shadow-[0_8px_30px_-8px_rgba(120,53,15,0.14)]">
          <h4 className="font-['Nunito'] text-sm font-bold text-[#292524] mb-3 flex items-center gap-1.5">
            <MapPin size={15} className="text-[#059669]" />
            Shipping Address
          </h4>
          <div className="text-sm text-[#78716C] space-y-0.5">
            <p className="font-medium text-[#292524]">
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
      <div className="bg-white rounded-2xl border border-[#E7E5E4] shadow-[0_4px_20px_-4px_rgba(120,53,15,0.08)] p-6 transition-shadow duration-300 hover:shadow-[0_8px_30px_-8px_rgba(120,53,15,0.14)]">
        <h2 className="font-['Nunito'] text-sm font-bold text-[#292524] mb-4">
          Order Items
        </h2>

        <div className="space-y-4">
          {order.items.map((item: any) => (
            <div
              key={item.productId}
              className="group flex items-center gap-4 border-b border-[#F5F5F4] last:border-0 pb-4 last:pb-0 transition-colors duration-150 hover:bg-[#FAF8F3] rounded-xl px-2 -mx-2"
            >
              {item.product?.images?.[0]?.url && (
                <img
                  src={item.product.images[0].url}
                  alt={item.product?.title || "Product"}
                  className="w-16 h-16 rounded-xl object-cover border border-[#E7E5E4] shrink-0 transition-transform duration-300 group-hover:scale-105"
                />
              )}
              <div className="flex-1">
                <p className="font-medium text-[#292524]">
                  {item.product?.title ?? "Unknown product"}
                </p>
                <p className="text-xs text-[#78716C] mt-0.5">
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
                              className="text-xs text-[#78716C] capitalize"
                            >
                              {key}: {value}
                            </span>
                          ),
                      )}
                    </div>
                  )}
              </div>
              <p className="font-medium text-[#292524]">
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
