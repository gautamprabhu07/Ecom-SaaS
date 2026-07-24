//Path: apps/seller-ui/src/app/%28routes%29/dashboard/all-products/page.tsx
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import Image from "next/image";
import {
  BarChart,
  ChevronRight,
  Eye,
  Pencil,
  Plus,
  Search,
  Trash,
} from "lucide-react";
import { useMemo } from "react";
import DeleteConfirmationModel from "apps/seller-ui/src/shared/components/modals/delete.confirmation.modal";

const fetchProducts = async () => {
  const response = await axiosInstance.get("/product/api/get-shop-products");
  return response?.data?.products;
};

const deleteProduct = async (productId: string) => {
  await axiosInstance.delete(`/product/api/delete-product/${productId}`);
};

const restoreProduct = async (productId: string) => {
  await axiosInstance.put(`/product/api/restore-product/${productId}`);
};

const ProductList = () => {
  const [globalFilter, setGlobalFilter] = useState("");
  const [analyticsData, setAnalyticsData] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>();
  const queryClient = useQueryClient();

  const {
    data: products = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["shop-products"],
    queryFn: fetchProducts,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-products"] });
      setShowDeleteModal(false);
    },
  });

  const restoreMutation = useMutation({
    mutationFn: restoreProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-products"] });
      setShowDeleteModal(false);
    },
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
              alt={row.original.title || "Product image"}
              width={200}
              height={200}
              className="h-12 w-12 rounded-md object-cover"
            />
          );
        },
      },
      {
        accessorKey: "name",
        header: "Product Name",
        cell: ({ row }: any) => {
          const truncatedTitle =
            row.original.title.length >= 25
              ? `${row.original.title.substring(0, 25)}...`
              : row.original.title;
          return (
            <Link
              href={`${process.env.NEXT_PUBLIC_USER_UI_URL}/product/${row.original.slug}`}
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
        header: "Price",
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
        accessorKey: "Category",
        header: "Category",
        cell: ({ row }: any) => (
          <span className="text-gray-600">{row.original.category}</span>
        ),
      },
      {
        accessorKey: "rating",
        header: "Rating",
        cell: ({ row }: any) => (
          <span className="text-gray-700">{row.original.rating || 5} ⭐</span>
        ),
      },
      {
        header: "Actions",
        cell: ({ row }: any) => (
          <div className="flex items-center gap-3 text-gray-500">
            <Link
              href={`/dashboard/product-details/${row.original.id}`}
              className="hover:text-blue-600"
            >
              <Eye size={18} />
            </Link>
            <Link
              href={`/dashboard/edit-product/${row.original.id}`}
              className="hover:text-green-600"
            >
              <Pencil size={18} />
            </Link>
            <button className="hover:text-purple-600">
              <BarChart size={18} />
            </button>
            <button
              onClick={() => openDeleteModal(row.original)}
              className="hover:text-red-600"
            >
              <Trash size={18} />
            </button>
          </div>
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
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
  });

  const openDeleteModal = (product: any) => {
    setSelectedProduct(product);
    setShowDeleteModal(true);
  };

  return (
    <div className="p-6">
      {/*Header*/}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">All Products</h2>
        <Link
          href="/dashboard/create-product"
          className="flex items-center gap-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={16} />
          Add New Product
        </Link>
      </div>

      {/*Breadcrumb*/}
      <div className="flex items-center gap-1 text-sm text-gray-500 mb-4">
        <Link href="/dashboard" className="hover:text-blue-600">
          Dashboard
        </Link>
        <ChevronRight size={14} />
        <span className="text-gray-700">All Products</span>
      </div>

      {/*Searchbar*/}
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

      {/*Table*/}
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
        {showDeleteModal && (
          <DeleteConfirmationModel
            product={selectedProduct}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={() => deleteMutation.mutate(selectedProduct?.id)}
            onRestore={() => restoreMutation.mutate(selectedProduct?.id)}
          />
        )}
      </div>
    </div>
  );
};

export default ProductList;
