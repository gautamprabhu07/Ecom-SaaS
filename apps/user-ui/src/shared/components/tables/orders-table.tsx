//Path: apps/user-ui/src/shared/components/tables/orders-table.tsx
"use client";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "apps/user-ui/src/utils/axiosInstance";
import { Package, ArrowRight } from "lucide-react";
import Link from "next/link";

const fetchOrders = async () => {
  const response = await axiosInstance.get("/order/api/get-user-orders");
  return response.data.orders;
};

const statusBadgeClass = (status: string) => {
  switch (status) {
    case "Delivered":
      return "bg-[#D1FAE5] text-[#059669]";
    case "Shipped":
    case "Out for Delivery":
      return "bg-blue-50 text-blue-700";
    case "Packed":
      return "bg-amber-50 text-amber-700";
    default:
      return "bg-[#F5F5F4] text-[#78716C]";
  }
};

const OrdersTable = () => {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["user-orders"],
    queryFn: fetchOrders,
    staleTime: 1000 * 60 * 2,
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-12 bg-[#FAF8F3] rounded-xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="p-4 bg-[#FAF8F3] rounded-full mb-3">
          <Package size={28} className="text-[#A8A29E]" />
        </div>
        <p className="text-sm text-[#78716C]">
          You haven&apos;t placed any orders yet.
        </p>
        <Link
          href="/"
          className="group mt-3 flex items-center gap-1 text-sm text-[#059669] font-medium hover:text-[#047857] transition-colors duration-200"
        >
          Start Shopping
          <ArrowRight
            size={14}
            className="transition-transform duration-200 group-hover:translate-x-1"
          />
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-[#E7E5E4]">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-[#E7E5E4] text-[#78716C] bg-[#FAF8F3]">
            <th className="py-3 px-4 font-medium">Order ID</th>
            <th className="py-3 px-4 font-medium">Date</th>
            <th className="py-3 px-4 font-medium">Items</th>
            <th className="py-3 px-4 font-medium">Total</th>
            <th className="py-3 px-4 font-medium">Payment</th>
            <th className="py-3 px-4 font-medium">Delivery Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F5F5F4]">
          {orders.map((order: any) => (
            <tr
              key={order.id}
              className="text-[#292524] transition-colors duration-150 hover:bg-[#FAF8F3]"
            >
              <td className="py-3 px-4 font-mono text-xs text-[#78716C]">
                #{order.id.slice(-6).toUpperCase()}
              </td>
              <td className="py-3 px-4 text-[#78716C]">
                {new Date(order.createdAt).toLocaleDateString()}
              </td>
              <td className="py-3 px-4 text-[#78716C]">
                {order.items?.length ?? 0} item
                {order.items?.length === 1 ? "" : "s"}
              </td>
              <td className="py-3 px-4 font-medium text-[#292524]">
                ${order.total.toFixed(2)}
              </td>
              <td className="py-3 px-4">
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full transition-transform duration-150 hover:scale-105 inline-block ${
                    order.status === "Paid"
                      ? "bg-[#D1FAE5] text-[#059669]"
                      : "bg-[#F5F5F4] text-[#78716C]"
                  }`}
                >
                  {order.status}
                </span>
              </td>
              <td className="py-3 px-4">
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full transition-transform duration-150 hover:scale-105 inline-block ${statusBadgeClass(order.deliveryStatus)}`}
                >
                  {order.deliveryStatus}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OrdersTable;
