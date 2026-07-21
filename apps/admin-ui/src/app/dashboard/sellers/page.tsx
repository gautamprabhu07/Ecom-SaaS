//Path: apps/admin-ui/src/app/dashboard/sellers/page.tsx
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
import { Search, Download } from "lucide-react";
import Breadcrumbs from "../../../shared/components/breadcrumbs";
import { exportToCsv } from "../../../utils/exportCsv";

const fetchSellers = async () => {
  const response = await axiosInstance.get("/admin/api/get-all-sellers");
  return response.data.data;
};

const SellersTable = () => {
  const [globalFilter, setGlobalFilter] = useState("");

  const { data: sellers = [], isLoading } = useQuery({
    queryKey: ["admin-sellers"],
    queryFn: fetchSellers,
    staleTime: 1000 * 60 * 5,
  });

  const columns = useMemo(
    () => [
      {
        accessorKey: "avatar",
        header: "Avatar",
        cell: ({ row }: any) => {
          const avatarUrl = row.original.shop?.avatar?.[0]?.url;
          return avatarUrl ? (
            <img
              src={avatarUrl}
              alt={row.original.name}
              className="w-9 h-9 rounded-full object-cover border border-gray-200"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-[10px] text-gray-400">
              N/A
            </div>
          );
        },
      },
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }: any) => (
          <span className="font-medium text-gray-800">{row.original.name}</span>
        ),
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }: any) => (
          <span className="text-gray-600">{row.original.email}</span>
        ),
      },
      {
        accessorKey: "shop.name",
        header: "Shop Name",
        cell: ({ row }: any) => (
          <span className="text-gray-700">
            {row.original.shop?.name ?? "No shop"}
          </span>
        ),
      },
      {
        accessorKey: "shop.address",
        header: "Address",
        cell: ({ row }: any) => (
          <span className="text-gray-500 text-xs">
            {row.original.shop?.address ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Joined",
        cell: ({ row }: any) => (
          <span className="text-gray-500 text-xs">
            {new Date(row.original.createdAt).toLocaleDateString()}
          </span>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: sellers,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: "includesString",
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
  });

  const handleExport = () => {
    const rows = table.getFilteredRowModel().rows.map((r: any) => ({
      Name: r.original.name,
      Email: r.original.email,
      "Shop Name": r.original.shop?.name ?? "",
      Address: r.original.shop?.address ?? "",
      Joined: new Date(r.original.createdAt).toLocaleDateString(),
    }));
    exportToCsv("sellers.csv", rows);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-xl font-semibold text-gray-800">Sellers</h2>
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 text-sm font-medium border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"
        >
          <Download size={14} />
          Export CSV
        </button>
      </div>

      <div className="mb-4">
        <Breadcrumbs title="Sellers" />
      </div>

      <div className="flex items-center gap-2 mb-4 rounded-md border border-gray-200 bg-white px-3 py-2 max-w-sm">
        <Search size={16} className="text-gray-400" />
        <input
          type="text"
          placeholder="Search sellers..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="w-full text-sm outline-none placeholder:text-gray-400"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        {isLoading ? (
          <p className="p-6 text-sm text-gray-500">Loading sellers...</p>
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

        {!isLoading && sellers?.length === 0 && (
          <p className="p-6 text-sm text-gray-400 text-center">
            No sellers found.
          </p>
        )}
      </div>
    </div>
  );
};

export default SellersTable;
