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

const Page = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isLoading } = useUser();
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            Welcome Back,{" "}
            <span className="text-blue-600">
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
          <StatCard title="Total Orders" count={10} Icon={Clock} />
          <StatCard title="Processing Orders" count={4} Icon={Truck} />
          <StatCard title="Completed Orders" count={6} Icon={CheckCircle} />
        </div>

        {/* Sidebar + Content + Quick Panel */}
        <div className="flex gap-6 items-start">
          {/* Left Nav */}
          <div className="w-52 shrink-0 bg-white rounded-xl border border-gray-200 p-3 space-y-1">
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
                label="Notifications"
                Icon={Bell}
                active={activeTab === "Notifications"}
                onClick={() => setActiveTab("Notifications")}
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
              <div className="pt-2 mt-2 border-t border-gray-100">
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
          <div className="flex-1 bg-white rounded-xl border border-gray-200 p-6 min-h-[400px]">
            <h2 className="text-lg font-semibold text-gray-800 mb-5">
              My Profile
            </h2>

            {activeTab === "profile" && !isLoading && user ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200">
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
                  <button className="flex items-center gap-1.5 text-sm text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition">
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
                      className="bg-gray-50 rounded-lg px-4 py-3"
                    >
                      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                      <p className="font-medium text-gray-800">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : activeTab === "Shipping Address" ? (
              <ShippingAddressSection />
            ) : (
              <p className="text-sm text-gray-400 text-center pt-16">
                Select a section from the left.
              </p>
            )}
          </div>

          {/* Right Quick Panel */}
          <div className="w-56 shrink-0 space-y-3">
            <QuickActionCard
              Icon={Gift}
              title="Referral Program"
              description="Invite friends and earn rewards"
            />
            <QuickActionCard
              Icon={BadgeCheck}
              title="Your Badges"
              description="View your achievements"
            />
            <QuickActionCard
              Icon={Settings}
              title="Account Settings"
              description="Manage your preferences"
            />
            <QuickActionCard
              Icon={ReceiptIcon}
              title="Billing History"
              description="View invoices and billing"
            />
            <QuickActionCard
              Icon={PhoneCall}
              title="Support"
              description="Contact support for help"
            />
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
    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition
      ${active ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-600 hover:bg-gray-100"}
      ${danger ? "text-red-500 hover:bg-red-50" : ""}`}
  >
    <Icon size={16} />
    <span>{label}</span>
  </button>
);
