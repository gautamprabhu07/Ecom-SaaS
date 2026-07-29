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
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#FDBA74]/20 text-[#9a5b1f] capitalize transition-transform duration-150 hover:scale-105">
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
    <div className="p-6 font-['Inter']">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-['Nunito'] text-xl font-extrabold text-[#292524]">
          Admin Management
        </h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 bg-[#059669] hover:bg-[#047857] text-white text-sm font-medium px-4 py-2 rounded-full transition-all duration-200 hover:-translate-y-0.5"
        >
          <Plus size={16} />
          Add Admin
        </button>
      </div>

      <div className="mb-4">
        <Breadcrumbs title="Management" />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[#E7E5E4] bg-white shadow-[0_4px_20px_-4px_rgba(120,53,15,0.08)]">
        {isLoading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
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

        {!isLoading && admins?.length === 0 && (
          <div className="flex flex-col items-center py-12 text-center">
            <div className="mb-3 w-14 h-14 rounded-full bg-[#D1FAE5] flex items-center justify-center">
              <span className="text-xl">🛡️</span>
            </div>
            <p className="text-sm text-[#78716C]">No admins found.</p>
          </div>
        )}
      </div>

      {/* Add Admin Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-[0_20px_60px_-15px_rgba(120,53,15,0.3)] w-full max-w-sm p-6 animate-dropdown-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-['Nunito'] text-lg font-bold text-[#292524]">
                Add New Admin
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setError("");
                  setEmail("");
                }}
                className="text-[#78716C] hover:text-[#292524] transition-colors duration-150"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#292524] mb-1">
                  User Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full border border-[#E7E5E4] rounded-xl px-3 py-2.5 text-sm text-[#292524] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-[#059669]"
                />
                <p className="text-xs text-[#78716C] mt-1">
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
                  className="flex-1 border border-[#E7E5E4] text-[#292524] font-medium py-2.5 rounded-full text-sm hover:bg-[#FAF8F3] transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addAdminMutation.isPending}
                  className="flex-1 bg-[#059669] hover:bg-[#047857] text-white font-medium py-2.5 rounded-full text-sm transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
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
