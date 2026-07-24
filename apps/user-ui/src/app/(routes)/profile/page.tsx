//Path: apps/user-ui/src/app/%28routes%29/profile/page.tsx
"use client";
import {
  BadgeCheck,
  Bell,
  CheckCircle,
  Gift,
  Lock,
  Inbox,
  Loader,
  LogOut,
  MapPin,
  Pencil,
  PhoneCall,
  ReceiptIcon,
  Settings,
  ShoppingBag,
  Truck,
  User,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import useUser from "../../../hooks/useUser";
import StatCard from "../../../shared/components/cards/statcard";
import { Clock } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import axiosInstance from "apps/user-ui/src/utils/axiosInstance";
import Image from "next/image";
import QuickActionCard from "apps/user-ui/src/shared/components/cards/quickActionCard";
import ShippingAddressSection from "apps/user-ui/src/shared/components/shippingAddress";
import { useQuery } from "@tanstack/react-query";
import useRequireAuth from "../../../hooks/useRequiredAuth";
import OrdersTable from "apps/user-ui/src/shared/components/tables/orders-table";
import ChangePassword from "apps/user-ui/src/shared/components/change-Password";

const Page = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isLoading } = useRequireAuth();
  const { data: orders = [] } = useQuery({
    queryKey: ["user-orders"],
    queryFn: async () => {
      const response = await axiosInstance.get("/order/api/get-user-orders");
      return response.data.orders;
    },
  });
  const totalOrders = orders.length;
  const processingOrders = orders.filter(
    (o: any) =>
      o?.deliveryStatus !== "Delivered" && o?.deliveryStatus !== "Cancelled",
  ).length;
  const completedOrders = orders.filter(
    (o: any) => o?.deliveryStatus === "Delivered",
  ).length;
  const queryTab = searchParams.get("active") || "Profile";
  const [activeTab, setActiveTab] = useState(queryTab);

  useEffect(() => {
    if (activeTab !== queryTab) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set("active", activeTab);
      router.replace(`/profile?${newParams.toString()}`);
    }
  }, [activeTab]);

  const logOutHandler = async () => {
    await axiosInstance.get("/api/logout-user").then(() => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      router.push("/login");
    });
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Greeting */}
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-[#292524]">
            Welcome Back,{" "}
            <span className="text-[#059669]">
              {isLoading ? (
                <Loader size={18} className="inline animate-spin" />
              ) : (
                user?.name || "User"
              )}
            </span>
          </h1>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard title="Total Orders" count={totalOrders} Icon={Clock} />
          <StatCard
            title="Processing Orders"
            count={processingOrders}
            Icon={Truck}
          />
          <StatCard
            title="Completed Orders"
            count={completedOrders}
            Icon={CheckCircle}
          />
        </div>

        {/* Sidebar + Content + Quick Panel */}
        <div className="flex gap-6 items-start">
          {/* Left Nav */}
          <div className="w-52 shrink-0 bg-white rounded-2xl border border-[#E7E5E4] p-3 space-y-1 shadow-[0_4px_20px_-4px_rgba(120,53,15,0.08)]">
            <nav className="flex flex-col">
              <NavItem
                label="Profile"
                Icon={User}
                active={activeTab === "profile"}
                onClick={() => setActiveTab("profile")}
              />
              <NavItem
                label="Orders"
                Icon={ShoppingBag}
                active={activeTab === "Orders"}
                onClick={() => setActiveTab("Orders")}
              />
              <NavItem
                label="Inbox"
                Icon={Inbox}
                active={activeTab === "Inbox"}
                onClick={() => router.push("/inbox")}
              />

              <NavItem
                label="Shipping Address"
                Icon={MapPin}
                active={activeTab === "Shipping Address"}
                onClick={() => setActiveTab("Shipping Address")}
              />
              <NavItem
                label="Change Password"
                Icon={Lock}
                active={activeTab === "Change Password"}
                onClick={() => setActiveTab("Change Password")}
              />
              <div className="pt-2 mt-2 border-t border-[#E7E5E4]">
                <NavItem
                  label="Logout"
                  Icon={LogOut}
                  danger
                  onClick={logOutHandler}
                />
              </div>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 bg-white rounded-2xl border border-[#E7E5E4] p-6 min-h-[400px] shadow-[0_4px_20px_-4px_rgba(120,53,15,0.08)]">
            <h2 className="font-heading text-lg font-bold text-[#292524] mb-5">
              My Profile
            </h2>

            {activeTab === "profile" && !isLoading && user ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-[#D1FAE5]">
                    <Image
                      src={
                        user?.avatar ||
                        "https://ik.imagekit.io/gautameshop/common/pp.avif"
                      }
                      alt="Profile Image"
                      layout="fill"
                      objectFit="cover"
                    />
                  </div>
                  <button className="flex items-center gap-1.5 text-sm text-[#059669] border border-[#059669]/30 px-3 py-1.5 rounded-full hover:bg-[#D1FAE5] transition">
                    <Pencil size={13} /> Change Photo
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  {[
                    { label: "Name", value: user.name },
                    { label: "Email", value: user.email },
                    {
                      label: "Joined",
                      value: new Date(user.createdAt).toLocaleDateString(),
                    },
                    { label: "Earned Points", value: user.points || 0 },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="bg-[#FAF8F3] rounded-xl px-4 py-3"
                    >
                      <p className="text-xs text-[#78716C] mb-0.5">{label}</p>
                      <p className="font-medium text-[#292524]">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : activeTab === "Shipping Address" ? (
              <ShippingAddressSection />
            ) : activeTab === "Orders" ? (
              <OrdersTable />
            ) : activeTab === "Change Password" ? (
              <ChangePassword />
            ) : (
              <></>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;

const NavItem = ({ label, Icon, active, danger, onClick }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-full text-sm transition
      ${active ? "bg-[#D1FAE5] text-[#059669] font-semibold" : "text-[#78716C] hover:bg-[#FAF8F3]"}
      ${danger ? "text-red-500 hover:bg-red-50" : ""}`}
  >
    <Icon size={16} />
    <span>{label}</span>
  </button>
);
