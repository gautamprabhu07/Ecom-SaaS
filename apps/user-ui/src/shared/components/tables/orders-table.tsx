//Path: apps/user-ui/src/shared/components/tables/orders-table.tsx
"use client";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "apps/user-ui/src/utils/axiosInstance";
import { Package } from "lucide-react";
import Link from "next/link";

const fetchOrders = async () => {
  const response = await axiosInstance.get("/order/api/get-user-orders");
  return response.data.orders;
};

const statusBadgeClass = (status: string) => {
  switch (status) {
    case "Delivered":
      return "bg-green-50 text-green-700";
    case "Shipped":
    case "Out for Delivery":
      return "bg-blue-50 text-blue-700";
    case "Packed":
      return "bg-amber-50 text-amber-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
};

const OrdersTable = () => {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["user-orders"],
    queryFn: fetchOrders,
    staleTime: 1000 * 60 * 2,
  });

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading orders...</p>;
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Package size={32} className="text-gray-300 mb-3" />
        <p className="text-sm text-gray-400">
          You haven&apos;t placed any orders yet.
        </p>
        <Link href="/" className="mt-3 text-sm text-blue-600 hover:underline">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-gray-500">
            <th className="pb-3 font-medium">Order ID</th>
            <th className="pb-3 font-medium">Date</th>
            <th className="pb-3 font-medium">Items</th>
            <th className="pb-3 font-medium">Total</th>
            <th className="pb-3 font-medium">Payment</th>
            <th className="pb-3 font-medium">Delivery Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {orders.map((order: any) => (
            <tr key={order.id} className="text-gray-700">
              <td className="py-3 font-mono text-xs text-gray-600">
                #{order.id.slice(-6).toUpperCase()}
              </td>
              <td className="py-3 text-gray-500">
                {new Date(order.createdAt).toLocaleDateString()}
              </td>
              <td className="py-3 text-gray-500">
                {order.items?.length ?? 0} item
                {order.items?.length === 1 ? "" : "s"}
              </td>
              <td className="py-3 font-medium text-gray-800">
                ${order.total.toFixed(2)}
              </td>
              <td className="py-3">
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    order.status === "Paid"
                      ? "bg-green-50 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {order.status}
                </span>
              </td>
              <td className="py-3">
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusBadgeClass(order.deliveryStatus)}`}
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
