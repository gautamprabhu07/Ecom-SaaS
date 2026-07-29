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
    return { label: "Ended", className: "bg-[#F5F5F4] text-[#78716C]" };
  const hoursLeft = (end - now) / (1000 * 60 * 60);
  if (hoursLeft <= 24)
    return {
      label: "Ending soon",
      className: "bg-[#FDBA74]/20 text-[#9a5b1f]",
    };
  return { label: "Active", className: "bg-[#D1FAE5] text-[#047857]" };
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
              <div className="h-12 w-12 rounded-xl bg-[#F5F5F4] flex items-center justify-center text-[10px] text-[#78716C]">
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
              className="h-12 w-12 rounded-xl object-cover border border-[#E7E5E4] transition-transform duration-200 hover:scale-110"
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
              className="font-medium text-[#292524] hover:text-[#059669] hover:underline transition-colors duration-150"
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
          <span className="font-medium text-[#292524]">
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
                : "text-[#292524]"
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
          <span className="text-xs text-[#78716C]">
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
              className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full transition-transform duration-150 hover:scale-105 ${status.className}`}
            >
              {status.label}
            </span>
          );
        },
      },
      {
        header: "Actions",
        cell: ({ row }: any) => (
          <div className="flex items-center gap-1 text-[#78716C]">
            <Link
              href={`${process.env.NEXT_PUBLIC_USER_URL}/product/${row.original.slug}`}
              target="_blank"
              className="p-1.5 rounded-full transition-all duration-200 hover:bg-[#D1FAE5] hover:text-[#059669] hover:scale-110"
            >
              <Eye size={16} />
            </Link>
            <Link
              href={`/product/edit/${row.original.id}`}
              className="p-1.5 rounded-full transition-all duration-200 hover:bg-[#D1FAE5] hover:text-[#059669] hover:scale-110"
            >
              <Pencil size={16} />
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
    <div className="p-6 font-['Inter']">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-['Nunito'] text-xl font-extrabold text-[#292524]">
          All Events
        </h2>
        <Link
          href="/dashboard/create-event"
          className="flex items-center gap-1.5 rounded-full bg-[#059669] px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-[#047857] hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-8px_rgba(5,150,105,0.4)]"
        >
          <Plus size={16} />
          Create Event
        </Link>
      </div>

      <div className="flex items-center gap-1.5 text-sm text-[#78716C] mb-4">
        <Link
          href="/dashboard"
          className="hover:text-[#059669] transition-colors duration-150"
        >
          Dashboard
        </Link>
        <ChevronRight size={14} className="text-[#A8A29E]" />
        <span className="text-[#292524] font-medium">All Events</span>
      </div>

      <div className="flex items-center gap-2 mb-4 rounded-2xl border border-[#E7E5E4] bg-white px-3 py-2 max-w-sm transition-all duration-200 focus-within:ring-2 focus-within:ring-[#059669] focus-within:border-[#059669]">
        <Search size={16} className="text-[#78716C]" />
        <input
          type="text"
          placeholder="Search events..."
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
                className="h-12 bg-[#FAF8F3] rounded-xl animate-pulse"
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
        {!isLoading && events?.length === 0 && (
          <div className="flex flex-col items-center py-12 text-center">
            <div className="mb-3 w-14 h-14 rounded-full bg-[#D1FAE5] flex items-center justify-center">
              <span className="text-xl">🎉</span>
            </div>
            <p className="text-sm text-[#78716C]">No events found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsList;
