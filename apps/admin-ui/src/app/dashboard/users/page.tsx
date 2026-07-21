//Path: apps/admin-ui/src/app/dashboard/users/page.tsx
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

const fetchUsers = async () => {
  const response = await axiosInstance.get("/admin/api/get-all-users");
  return response.data.data;
};

const roleBadgeClass = (role: string) =>
  role === "admin"
    ? "bg-purple-50 text-purple-700"
    : "bg-blue-50 text-blue-700";

const UsersTable = () => {
  const [globalFilter, setGlobalFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: fetchUsers,
    staleTime: 1000 * 60 * 5,
  });

  const filteredData = useMemo(() => {
    if (roleFilter === "all") return users;
    return users.filter((u: any) => u.role === roleFilter);
  }, [users, roleFilter]);

  const columns = useMemo(
    () => [
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
        accessorKey: "role",
        header: "Role",
        cell: ({ row }: any) => (
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${roleBadgeClass(row.original.role)}`}
          >
            {row.original.role}
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
    data: filteredData,
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
      Role: r.original.role,
      Joined: new Date(r.original.createdAt).toLocaleDateString(),
    }));
    exportToCsv("users.csv", rows);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-xl font-semibold text-gray-800">Users</h2>
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 text-sm font-medium border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"
        >
          <Download size={14} />
          Export CSV
        </button>
      </div>

      <div className="mb-4">
        <Breadcrumbs title="Users" />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 max-w-sm flex-1">
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full text-sm outline-none placeholder:text-gray-400"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Roles</option>
          <option value="user">Users</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        {isLoading ? (
          <p className="p-6 text-sm text-gray-500">Loading users...</p>
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

        {!isLoading && filteredData?.length === 0 && (
          <p className="p-6 text-sm text-gray-400 text-center">
            No users found.
          </p>
        )}
      </div>
    </div>
  );
};

export default UsersTable;
