//Path: apps/admin-ui/src/app/dashboard/products/page.tsx
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
import { Search, ExternalLink } from "lucide-react";
import Breadcrumbs from "../../../shared/components/breadcrumbs";

const fetchProducts = async () => {
  const response = await axiosInstance.get("/admin/api/get-all-products");
  return response.data.data;
};

const ProductsTable = () => {
  const [globalFilter, setGlobalFilter] = useState("");

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: fetchProducts,
    staleTime: 1000 * 60 * 5,
  });

  const columns = useMemo(
    () => [
      {
        accessorKey: "image",
        header: "Image",
        cell: ({ row }: any) => {
          const imageUrl = row.original.images?.[0]?.url;
          return imageUrl ? (
            <img
              src={imageUrl}
              alt={row.original.title}
              className="w-10 h-10 rounded-lg object-cover border border-gray-200"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-[9px] text-gray-400">
              No image
            </div>
          );
        },
      },
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }: any) => (
          <span className="text-gray-800 font-medium line-clamp-1 max-w-[200px]">
            {row.original.title}
          </span>
        ),
      },
      {
        accessorKey: "sale_price",
        header: "Price",
        cell: ({ row }: any) => (
          <span className="font-medium text-gray-700">
            ${row.original.sale_price?.toFixed(2)}
          </span>
        ),
      },
      {
        accessorKey: "stock",
        header: "Stock",
        cell: ({ row }: any) => (
          <span
            className={
              row.original.stock <= 0
                ? "text-red-500 font-medium"
                : "text-gray-700"
            }
          >
            {row.original.stock}
          </span>
        ),
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }: any) => (
          <span className="text-gray-600">{row.original.category}</span>
        ),
      },
      {
        accessorKey: "rating",
        header: "Rating",
        cell: ({ row }: any) => (
          <span className="text-gray-700">{row.original.rating ?? 5} ⭐</span>
        ),
      },
      {
        accessorKey: "Shop.name",
        header: "Shop",
        cell: ({ row }: any) => (
          <span className="text-gray-600">
            {row.original.Shop?.name ?? "Unknown shop"}
          </span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }: any) => (
          <span className="text-gray-500 text-xs">
            {new Date(row.original.createdAt).toLocaleDateString()}
          </span>
        ),
      },
      {
        header: "Actions",
        cell: ({ row }: any) => (
          <a
            href={`${process.env.NEXT_PUBLIC_USER_URL}/product/${row.original.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-blue-600 transition"
          >
            <ExternalLink size={16} />
          </a>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: products,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: "includesString",
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
  });

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-1">Products</h2>
      <div className="mb-4">
        <Breadcrumbs title="Products" />
      </div>

      <div className="flex items-center gap-2 mb-4 rounded-md border border-gray-200 bg-white px-3 py-2 max-w-sm">
        <Search size={16} className="text-gray-400" />
        <input
          type="text"
          placeholder="Search products..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="w-full text-sm outline-none placeholder:text-gray-400"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        {isLoading ? (
          <p className="p-6 text-sm text-gray-500">Loading products...</p>
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

        {!isLoading && products?.length === 0 && (
          <p className="p-6 text-sm text-gray-400 text-center">
            No products found.
          </p>
        )}
      </div>
    </div>
  );
};

export default ProductsTable;
