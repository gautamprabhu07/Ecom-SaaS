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
import { Eye, Loader2, Search, XCircle } from "lucide-react";
import OrderDetails from "../../order/[id]/page";

const fetchOrders = async () => {
  const response = await axiosInstance.get("/order/api/get-seller-orders");
  return response.data;
};

const OrdersTable = () => {
  const [globalFilter, setGlobalFilter] = useState("");
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["seller-orders"],
    queryFn: fetchOrders,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const columns = useMemo(
    () => [
      {
        accessorKey: "id",
        header: "Order ID",
        cell: ({ row }: any) => (
          <span>#{row.original.id.slice(-6).toUpperCase()}</span>
        ),
      },
      {
        accessorKey: "user.name",
        header: "Buyer",
        cell: ({ row }: any) => (
          <span>{row.original.user?.name ?? "Guest"}</span>
        ),
      },
      {
        accessorKey: "total",
        header: "Total",
        cell: ({ row }: any) => <span>${row.original.total}</span>,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }: any) => (
          <span>
            {/* classname for span based on status is Paid or not */}
            {row.original.status}
          </span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Date",
        cell: ({ row }: any) => {
          const date = new Date(row.original.createdAt).toLocaleDateString();
          return <span>{date}</span>;
        },
      },
      {
        header: "Actions",
        cell: ({ row }: any) => (
          <Link href={`/order/${row.original.id}`}>
            <Eye />
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
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
  });

  return (
    <div>
      <h2>All orders</h2>

      {/* Add breadcrumbs here */}

      <div>
        <Search />
        <input
          type="text"
          placeholder="Search orders..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
        />
      </div>

      {/* Table */}
      <div>
        {isLoading ? (
          <p>Loading orders..</p>
        ) : (
          <table>
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id}>
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
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>
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

        {!isLoading && orders?.length === 0 && <p>No Orders found!</p>}
      </div>
    </div>
  );
};

export default OrdersTable;
