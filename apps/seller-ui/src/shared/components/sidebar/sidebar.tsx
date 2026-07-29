// Path: apps/seller-ui/src/shared/components/sidebar/sidebar.tsx
"use client";
import React from "react";
import { usePathname } from "next/navigation";
import useSeller from "../../../hooks/useSeller";
import useSidebar from "../../../hooks/useSidebar";
import { useEffect } from "react";
import Box from "../box";
import Link from "next/link";
import { Sidebar } from "./sidebar.styles";
import SidebarItem from "./sidebar.item";
import SidebarMenu from "./sidebar.menu";
import Image from "next/image";
import { useQueryClient } from "@tanstack/react-query";
import axiosInstance from "apps/seller-ui/src/utils/axiosInstance";
import { useRouter } from "next/navigation";
import {
  Home,
  BellPlus,
  CalendarPlus,
  ListOrdered,
  PackageSearch,
  SquarePlus,
  TicketPercent,
  DoorOpen,
  Mail,
} from "lucide-react";

const SidebarWrapper = () => {
  const { activeSidebar, setActiveSidebar } = useSidebar();
  const pathName = usePathname();
  const { seller } = useSeller();
  const queryClient = useQueryClient();
  const router = useRouter();

  useEffect(() => {
    setActiveSidebar(pathName);
  }, [pathName, setActiveSidebar]);

  const handleLogout = async () => {
    try {
      await axiosInstance.get("/api/logout-seller");
    } finally {
      queryClient.removeQueries({ queryKey: ["seller"] });
      router.replace("/login");
    }
  };

  return (
    <Box className="sidebar-wrapper h-full bg-neutral-900 text-white flex flex-col">
      <Sidebar.Header>
        <Box>
          <Link
            href={"/dashboard/profile"}
            className="group flex items-center gap-3 transition-transform duration-200 hover:-translate-y-0.5"
          >
            <div className="relative">
              <span className="absolute inset-0 rounded-full bg-emerald-400/30 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Image
                src="/logoeshop.png"
                alt="Eshop Logo"
                width={44}
                height={44}
                priority
                className="relative"
              />
            </div>
            <Box>
              <h3 className="font-heading text-sm font-bold text-white">
                {seller?.shop?.name}
              </h3>
              <h5 className="text-xs text-neutral-400">
                {seller?.shop?.address}
              </h5>
            </Box>
          </Link>
        </Box>
      </Sidebar.Header>
      <div>
        <Sidebar.Body>
          <SidebarItem
            title="Dashboard"
            icon={<Home size={22} color="currentColor" />}
            isActive={activeSidebar === "/dashboard"}
            href="/dashboard"
          />
          <div>
            <SidebarMenu title="Main Menu">
              <SidebarItem
                isActive={activeSidebar === "/dashboard/orders"}
                title="Orders"
                icon={<ListOrdered size={22} color="currentColor" />}
                href="/dashboard/orders"
              />
              <SidebarItem
                isActive={activeSidebar === "/dashboard/payments"}
                title="Payments"
                icon={<ListOrdered size={22} color="currentColor" />}
                href="/dashboard/payments"
              />
            </SidebarMenu>
            <SidebarMenu title="Products">
              <SidebarItem
                isActive={activeSidebar === "/dashboard/create-product"}
                title="Create Product"
                icon={<SquarePlus size={22} color="currentColor" />}
                href="/dashboard/create-product"
              />
              <SidebarItem
                isActive={activeSidebar === "/dashboard/all-products"}
                title="All Products"
                icon={<PackageSearch size={22} color="currentColor" />}
                href="/dashboard/all-products"
              />
            </SidebarMenu>
            <SidebarMenu title="Events">
              <SidebarItem
                isActive={activeSidebar === "/dashboard/create-event"}
                title="Create Event"
                icon={<CalendarPlus size={22} color="currentColor" />}
                href="/dashboard/create-event"
              />
              <SidebarItem
                isActive={activeSidebar === "/dashboard/all-events"}
                title="All Events"
                icon={<BellPlus size={22} color="currentColor" />}
                href="/dashboard/all-events"
              />
            </SidebarMenu>
            <SidebarMenu title="Controllers">
              <SidebarItem
                isActive={activeSidebar === "/dashboard/inbox"}
                title="Inbox"
                icon={<Mail size={22} color="currentColor" />}
                href="/dashboard/inbox"
              />

              <SidebarItem
                isActive={activeSidebar === "/dashboard/discountCodes"}
                title="Discount Codes"
                icon={<TicketPercent size={22} color="currentColor" />}
                href="/dashboard/discountCodes"
              />
              <SidebarItem
                title="Logout"
                icon={<DoorOpen size={22} color="currentColor" />}
                danger
                onClick={handleLogout}
              />
            </SidebarMenu>
          </div>
        </Sidebar.Body>
      </div>
    </Box>
  );
};

export default SidebarWrapper;
