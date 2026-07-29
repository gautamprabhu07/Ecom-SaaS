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
              className="w-10 h-10 rounded-xl object-cover border border-[#E7E5E4] transition-transform duration-200 hover:scale-105"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-[#FAF8F3] flex items-center justify-center text-[9px] text-[#78716C]">
              No image
            </div>
          );
        },
      },
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }: any) => (
          <span className="text-[#292524] font-medium line-clamp-1 max-w-[200px]">
            {row.original.title}
          </span>
        ),
      },
      {
        accessorKey: "sale_price",
        header: "Price",
        cell: ({ row }: any) => (
          <span className="font-medium text-[#059669]">
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
                : "text-[#292524]"
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
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#F5F5F4] text-[#78716C]">
            {row.original.category}
          </span>
        ),
      },
      {
        accessorKey: "rating",
        header: "Rating",
        cell: ({ row }: any) => (
          <span className="text-[#292524] flex items-center gap-1">
            {row.original.rating ?? 5}
            <span className="text-[#FDBA74]">★</span>
          </span>
        ),
      },
      {
        accessorKey: "Shop.name",
        header: "Shop",
        cell: ({ row }: any) => (
          <span className="text-[#78716C]">
            {row.original.Shop?.name ?? "Unknown shop"}
          </span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }: any) => (
          <span className="text-[#78716C] text-xs">
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
            className="inline-flex text-[#78716C] hover:text-[#059669] transition-all duration-200 hover:scale-110"
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
    <div className="p-6 font-['Inter']">
      <h2 className="font-['Nunito'] text-xl font-extrabold text-[#292524] mb-1">
        Products
      </h2>
      <div className="mb-4">
        <Breadcrumbs title="Products" />
      </div>

      <div className="flex items-center gap-2 mb-4 rounded-2xl border border-[#E7E5E4] bg-white px-3 py-2 max-w-sm transition-all duration-200 focus-within:ring-2 focus-within:ring-[#059669] focus-within:border-[#059669]">
        <Search size={16} className="text-[#78716C]" />
        <input
          type="text"
          placeholder="Search products..."
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

        {!isLoading && products?.length === 0 && (
          <div className="flex flex-col items-center py-12 text-center">
            <div className="mb-3 w-14 h-14 rounded-full bg-[#D1FAE5] flex items-center justify-center">
              <span className="text-xl">🛍️</span>
            </div>
            <p className="text-sm text-[#78716C]">No products found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsTable;
