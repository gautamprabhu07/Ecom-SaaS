//Path: apps/seller-ui/src/app/(routes)/dashboard/payments/page.tsx
"use client";
import React, { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  flexRender,
} from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../../../../utils/axiosInstance";
import Link from "next/link";
import { Eye, Search } from "lucide-react";
import Breadcrumbs from "../../../../shared/components/breadcrumbs";

const fetchOrders = async () => {
  const response = await axiosInstance.get("/order/api/get-seller-orders");
  return response.data.orders;
};

const statusBadgeClass = (status: string) => {
  switch (status) {
    case "Paid":
      return "bg-green-50 text-green-700";
    case "Pending":
      return "bg-amber-50 text-amber-700";
    case "Failed":
      return "bg-red-50 text-red-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
};

const PaymentsTable = () => {
  const [globalFilter, setGlobalFilter] = useState("");

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["seller-payments"],
    queryFn: fetchOrders,
    staleTime: 1000 * 60 * 5,
  });

  const columns = useMemo(
    () => [
      {
        accessorKey: "id",
        header: "Order ID",
        cell: ({ row }: any) => (
          <span className="font-mono text-xs text-gray-600">
            #{row.original.id.slice(-6).toUpperCase()}
          </span>
        ),
      },
      {
        accessorKey: "user.name",
        header: "Buyer",
        cell: ({ row }: any) => (
          <span className="text-gray-800">
            {row.original.user?.name ?? "Guest"}
          </span>
        ),
      },
      {
        accessorKey: "sellerEarnings",
        header: "Seller Earnings (90%)",
        cell: ({ row }: any) => (
          <span className="font-medium text-gray-800">
            ${(row.original.total * 0.9).toFixed(2)}
          </span>
        ),
      },
      {
        accessorKey: "adminFee",
        header: "Admin Fee (10%)",
        cell: ({ row }: any) => (
          <span className="font-medium text-gray-700">
            ${(row.original.total * 0.1).toFixed(2)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }: any) => (
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusBadgeClass(row.original.status)}`}
          >
            {row.original.status}
          </span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Date",
        cell: ({ row }: any) => (
          <span className="text-gray-500 text-xs">
            {new Date(row.original.createdAt).toLocaleDateString()}
          </span>
        ),
      },
      {
        header: "Actions",
        cell: ({ row }: any) => (
          <Link
            href={`/order/${row.original.id}`}
            className="text-gray-400 hover:text-blue-600 transition"
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
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-1">Payments</h2>
      <div className="mb-4">
        <Breadcrumbs title="Payments" />
      </div>

      <div className="flex items-center gap-2 mb-4 rounded-md border border-gray-200 bg-white px-3 py-2 max-w-sm">
        <Search size={16} className="text-gray-400" />
        <input
          type="text"
          placeholder="Search payments..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="w-full text-sm outline-none placeholder:text-gray-400"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        {isLoading ? (
          <p className="p-6 text-sm text-gray-500">Loading payments...</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 font-medium text-gray-600"
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
                  className="border-t border-gray-100 hover:bg-gray-50"
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
          <p className="p-6 text-sm text-gray-400 text-center">
            No payments found.
          </p>
        )}
      </div>
    </div>
  );
};

export default PaymentsTable;
