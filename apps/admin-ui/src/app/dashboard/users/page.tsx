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
    ? "bg-[#FDBA74]/20 text-[#9a5b1f]"
    : "bg-[#D1FAE5] text-[#047857]";

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
          <span className="font-medium text-[#292524]">
            {row.original.name}
          </span>
        ),
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }: any) => (
          <span className="text-[#78716C]">{row.original.email}</span>
        ),
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }: any) => (
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize transition-transform duration-150 hover:scale-105 ${roleBadgeClass(row.original.role)}`}
          >
            {row.original.role}
          </span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Joined",
        cell: ({ row }: any) => (
          <span className="text-[#78716C] text-xs">
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
    <div className="p-6 font-['Inter']">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-['Nunito'] text-xl font-extrabold text-[#292524]">
          Users
        </h2>
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 text-sm font-medium border border-[#E7E5E4] text-[#292524] bg-white px-3 py-1.5 rounded-full transition-all duration-200 hover:bg-[#D1FAE5] hover:border-[#059669] hover:text-[#047857] hover:-translate-y-0.5"
        >
          <Download size={14} />
          Export CSV
        </button>
      </div>

      <div className="mb-4">
        <Breadcrumbs title="Users" />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2 rounded-2xl border border-[#E7E5E4] bg-white px-3 py-2 max-w-sm flex-1 transition-all duration-200 focus-within:ring-2 focus-within:ring-[#059669] focus-within:border-[#059669]">
          <Search size={16} className="text-[#78716C]" />
          <input
            type="text"
            placeholder="Search users..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full text-sm outline-none placeholder:text-[#78716C] text-[#292524]"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="border border-[#E7E5E4] bg-white text-[#292524] rounded-full px-3 py-2 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-[#059669]"
        >
          <option value="all">All Roles</option>
          <option value="user">Users</option>
          <option value="admin">Admins</option>
        </select>
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

        {!isLoading && filteredData?.length === 0 && (
          <div className="flex flex-col items-center py-12 text-center">
            <div className="mb-3 w-14 h-14 rounded-full bg-[#D1FAE5] flex items-center justify-center">
              <span className="text-xl">👤</span>
            </div>
            <p className="text-sm text-[#78716C]">No users found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersTable;
