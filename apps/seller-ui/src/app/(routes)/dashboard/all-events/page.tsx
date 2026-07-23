"use client";
import React from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getFilteredRowModel,
} from "@tanstack/react-table";
import Link from "next/link";
import axiosInstance from "apps/seller-ui/src/utils/axiosInstance";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import Image from "next/image";
import { ChevronRight, Eye, Pencil, Plus, Search } from "lucide-react";

const fetchEvents = async () => {
  const response = await axiosInstance.get("/product/api/get-shop-events");
  return response?.data?.events ?? [];
};

const eventStatus = (endingDate: string) => {
  const now = Date.now();
  const end = new Date(endingDate).getTime();
  if (end < now)
    return { label: "Ended", className: "bg-gray-100 text-gray-600" };
  const hoursLeft = (end - now) / (1000 * 60 * 60);
  if (hoursLeft <= 24)
    return { label: "Ending soon", className: "bg-amber-50 text-amber-700" };
  return { label: "Active", className: "bg-green-50 text-green-700" };
};

const EventsList = () => {
  const [globalFilter, setGlobalFilter] = useState("");

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["shop-events"],
    queryFn: fetchEvents,
    staleTime: 5 * 60 * 1000,
  });

  const columns = useMemo(
    () => [
      {
        accessorKey: "image",
        header: "Image",
        cell: ({ row }: any) => {
          const imageUrl = row.original.images?.[0]?.url;
          if (!imageUrl) {
            return (
              <div className="h-12 w-12 rounded-md bg-gray-100 flex items-center justify-center text-[10px] text-gray-400">
                No image
              </div>
            );
          }
          return (
            <Image
              src={imageUrl}
              alt={row.original.title || "Event image"}
              width={48}
              height={48}
              className="h-12 w-12 rounded-md object-cover"
            />
          );
        },
      },
      {
        accessorKey: "title",
        header: "Product Name",
        cell: ({ row }: any) => {
          const truncatedTitle =
            row.original.title.length >= 25
              ? `${row.original.title.substring(0, 25)}...`
              : row.original.title;
          return (
            <Link
              href={`${process.env.NEXT_PUBLIC_USER_URL}/product/${row.original.slug}`}
              title={row.original.title}
              className="font-medium text-gray-800 hover:text-blue-600 hover:underline"
            >
              {truncatedTitle}
            </Link>
          );
        },
      },
      {
        accessorKey: "price",
        header: "Offer Price",
        cell: ({ row }: any) => (
          <span className="font-medium text-gray-700">
            ${row.original.sale_price}
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
        accessorKey: "window",
        header: "Offer Window",
        cell: ({ row }: any) => (
          <span className="text-xs text-gray-500">
            {new Date(row.original.starting_date).toLocaleDateString()} –{" "}
            {new Date(row.original.ending_date).toLocaleDateString()}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }: any) => {
          const status = eventStatus(row.original.ending_date);
          return (
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.className}`}
            >
              {status.label}
            </span>
          );
        },
      },
      {
        header: "Actions",
        cell: ({ row }: any) => (
          <div className="flex items-center gap-3 text-gray-500">
            <Link
              href={`${process.env.NEXT_PUBLIC_USER_URL}/product/${row.original.slug}`}
              target="_blank"
              className="hover:text-blue-600"
            >
              <Eye size={18} />
            </Link>
            <Link
              href={`/product/edit/${row.original.id}`}
              className="hover:text-green-600"
            >
              <Pencil size={18} />
            </Link>
          </div>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: events,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: "includesString",
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">All Events</h2>
        <Link
          href="/dashboard/create-event"
          className="flex items-center gap-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={16} />
          Create Event
        </Link>
      </div>

      <div className="flex items-center gap-1 text-sm text-gray-500 mb-4">
        <Link href="/dashboard" className="hover:text-blue-600">
          Dashboard
        </Link>
        <ChevronRight size={14} />
        <span className="text-gray-700">All Events</span>
      </div>

      <div className="flex items-center gap-2 mb-4 rounded-md border border-gray-200 bg-white px-3 py-2 max-w-sm">
        <Search size={16} className="text-gray-400" />
        <input
          type="text"
          placeholder="Search events..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="w-full text-sm outline-none placeholder:text-gray-400"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        {isLoading ? (
          <p className="p-6 text-sm text-gray-500">Loading events...</p>
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
                      {header.isPlaceholder
                        ? null
                        : flexRender(
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
        {!isLoading && events?.length === 0 && (
          <p className="p-6 text-sm text-gray-400 text-center">
            No events found.
          </p>
        )}
      </div>
    </div>
  );
};

export default EventsList;
