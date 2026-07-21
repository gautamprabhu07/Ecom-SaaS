//Path: apps/admin-ui/src/app/dashboard/management/page.tsx
"use client";
import React, { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../../../utils/axiosInstance";
import { Plus, X } from "lucide-react";
import Breadcrumbs from "../../../shared/components/breadcrumbs";

const fetchAdmins = async () => {
  const response = await axiosInstance.get("/admin/api/get-all-admins");
  return response.data.admins;
};

const ManagementPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const queryClient = useQueryClient();

  const { data: admins = [], isLoading } = useQuery({
    queryKey: ["admin-admins"],
    queryFn: fetchAdmins,
    staleTime: 1000 * 60 * 5,
  });

  const addAdminMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await axiosInstance.post("/admin/api/add-new-admin", {
        email,
        role: "admin",
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-admins"] });
      setEmail("");
      setError("");
      setShowModal(false);
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message || "Failed to add admin");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter an email address");
      return;
    }
    addAdminMutation.mutate(email.trim());
  };

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
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 capitalize">
            {row.original.role}
          </span>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: admins,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-xl font-semibold text-gray-800">
          Admin Management
        </h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          <Plus size={16} />
          Add Admin
        </button>
      </div>

      <div className="mb-4">
        <Breadcrumbs title="Management" />
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        {isLoading ? (
          <p className="p-6 text-sm text-gray-500">Loading admins...</p>
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

        {!isLoading && admins?.length === 0 && (
          <p className="p-6 text-sm text-gray-400 text-center">
            No admins found.
          </p>
        )}
      </div>

      {/* Add Admin Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Add New Admin
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setError("");
                  setEmail("");
                }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  This user must already have an account. They will be promoted
                  to admin.
                </p>
                {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setError("");
                    setEmail("");
                  }}
                  className="flex-1 border border-gray-300 text-gray-700 font-medium py-2.5 rounded-lg text-sm hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addAdminMutation.isPending}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition disabled:opacity-60"
                >
                  {addAdminMutation.isPending ? "Adding..." : "Add Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagementPage;
