//Path: apps/admin-ui/src/app/dashboard/orders/page.tsx
//Orders table for admin
"use client";
import React, { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  flexRender,
} from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../../../utils/axiosInstance";
import Link from "next/link";
import { Eye, Search } from "lucide-react";
import Breadcrumbs from "../../../shared/components/breadcrumbs";

const fetchOrders = async () => {
  const response = await axiosInstance.get("/order/api/get-admin-orders");
  return response.data.orders;
};

const statusBadgeClass = (status: string) => {
  switch (status) {
    case "Paid":
      return "bg-[#D1FAE5] text-[#047857]";
    case "Pending":
      return "bg-[#FDBA74]/20 text-[#9a5b1f]";
    case "Failed":
      return "bg-red-50 text-red-700";
    default:
      return "bg-[#F5F5F4] text-[#78716C]";
  }
};

const OrdersTable = () => {
  const [globalFilter, setGlobalFilter] = useState("");

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: fetchOrders,
    staleTime: 1000 * 60 * 5,
  });

  const columns = useMemo(
    () => [
      {
        accessorKey: "id",
        header: "Order ID",
        cell: ({ row }: any) => (
          <span className="font-mono text-xs text-[#78716C]">
            #{row.original.id.slice(-6).toUpperCase()}
          </span>
        ),
      },
      {
        accessorKey: "shops.name",
        header: "Shop",
        cell: ({ row }: any) => (
          <span className="text-[#292524]">
            {row.original.shops?.name ?? "Unknown shop"}
          </span>
        ),
      },
      {
        accessorKey: "user.name",
        header: "Buyer",
        cell: ({ row }: any) => (
          <span className="text-[#292524]">
            {row.original.user?.name ?? "Guest"}
          </span>
        ),
      },
      {
        accessorKey: "total",
        header: "Total",
        cell: ({ row }: any) => (
          <span className="font-medium text-[#292524]">
            ${row.original.total.toFixed(2)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }: any) => (
          <span
            className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full transition-transform duration-150 hover:scale-105 ${statusBadgeClass(row.original.status)}`}
          >
            {row.original.status}
          </span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Date",
        cell: ({ row }: any) => (
          <span className="text-[#78716C] text-xs">
            {new Date(row.original.createdAt).toLocaleDateString()}
          </span>
        ),
      },
      {
        header: "Actions",
        cell: ({ row }: any) => (
          <Link
            href={`/order/${row.original.id}`}
            className="inline-flex text-[#78716C] hover:text-[#059669] transition-all duration-200 hover:scale-110"
          >
            <Eye size={16} />
          </Link>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: orders,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: "includesString",
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
  });

  return (
    <div className="p-6 font-['Inter']">
      <h2 className="font-['Nunito'] text-xl font-extrabold text-[#292524] mb-1">
        All Orders
      </h2>
      <div className="mb-4">
        <Breadcrumbs title="Orders" />
      </div>

      <div className="flex items-center gap-2 mb-4 rounded-2xl border border-[#E7E5E4] bg-white px-3 py-2 max-w-sm transition-all duration-200 focus-within:ring-2 focus-within:ring-[#059669] focus-within:border-[#059669]">
        <Search size={16} className="text-[#78716C]" />
        <input
          type="text"
          placeholder="Search orders..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="w-full text-sm outline-none placeholder:text-[#78716C] text-[#292524]"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[#E7E5E4] bg-white shadow-[0_4px_20px_-4px_rgba(120,53,15,0.08)]">
        {isLoading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-10 bg-[#FAF8F3] rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-[#FAF8F3]">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 font-medium text-[#78716C]"
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-t border-[#F5F5F4] transition-colors duration-150 hover:bg-[#FAF8F3]"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 align-middle">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!isLoading && orders?.length === 0 && (
          <div className="flex flex-col items-center py-12 text-center">
            <div className="mb-3 w-14 h-14 rounded-full bg-[#D1FAE5] flex items-center justify-center">
              <span className="text-xl">📦</span>
            </div>
            <p className="text-sm text-[#78716C]">No orders found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersTable;
