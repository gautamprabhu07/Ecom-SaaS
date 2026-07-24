//path: apps/admin-ui/src/shared/components/sidebar/index.tsx
"use client";
import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import useSidebar from "../../../hooks/useSidebar";
import useAdmin from "../../../hooks/useAdmin";
import { Sidebar } from "./sidebar.styles";
import Link from "next/link";
import SidebarItem from "./sidebar.item";
import SidebarMenu from "./sidebarmenu";
import {
  LayoutDashboard,
  ListOrdered,
  Wallet,
  Package,
  CalendarDays,
  Users,
  Store,
  FileText,
  Settings,
  Bell,
  Palette,
  LogOut,
} from "lucide-react";
import Image from "next/image";

const SidebarWrapper = () => {
  const { activeSidebar, setActiveSidebar } = useSidebar();
  const pathName = usePathname();
  const { admin } = useAdmin();

  useEffect(() => {
    setActiveSidebar(pathName);
  }, [pathName, setActiveSidebar]);

  return (
    <div className="w-[260px] h-screen bg-white border-r border-[#E7E5E4] overflow-y-auto">
      <Sidebar.Header>
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logoeshop.png"
            alt="Eshop Logo"
            width={40}
            height={40}
            priority
          />
          <div>
            <h3 className="font-heading text-sm font-bold text-[#292524]">
              {admin?.name}
            </h3>
            <h5 className="text-xs text-[#78716C]">{admin?.email}</h5>
          </div>
        </Link>
      </Sidebar.Header>
      <div>
        <Sidebar.Body>
          <SidebarItem
            icon={<LayoutDashboard size={22} color="currentColor" />}
            title="Dashboard"
            isActive={activeSidebar === "/dashboard"}
            href="/dashboard"
          />

          <div>
            <SidebarMenu title="Main Menu">
              <SidebarItem
                isActive={activeSidebar === "/dashboard/orders"}
                title="Orders"
                href="/dashboard/orders"
                icon={<ListOrdered size={22} color="currentColor" />}
              />
              <SidebarItem
                isActive={activeSidebar === "/dashboard/payments"}
                title="Payments"
                href="/dashboard/payments"
                icon={<Wallet size={22} color="currentColor" />}
              />
              <SidebarItem
                isActive={activeSidebar === "/dashboard/products"}
                title="Products"
                href="/dashboard/products"
                icon={<Package size={22} color="currentColor" />}
              />

              <SidebarItem
                isActive={activeSidebar === "/dashboard/users"}
                title="Users"
                href="/dashboard/users"
                icon={<Users size={22} color="currentColor" />}
              />
              <SidebarItem
                isActive={activeSidebar === "/dashboard/sellers"}
                title="Sellers"
                href="/dashboard/sellers"
                icon={<Store size={22} color="currentColor" />}
              />
            </SidebarMenu>

            <SidebarMenu title="Controllers">
              <SidebarItem
                isActive={activeSidebar === "/dashboard/loggers"}
                title="Loggers"
                href="/dashboard/loggers"
                icon={<FileText size={22} color="currentColor" />}
              />
              <SidebarItem
                isActive={activeSidebar === "/dashboard/management"}
                title="Management"
                href="/dashboard/management"
                icon={<Settings size={22} color="currentColor" />}
              />
            </SidebarMenu>

            <SidebarMenu title="Extras">
              <SidebarItem
                isActive={activeSidebar === "/logout"}
                title="Logout"
                href="/logout"
                icon={<LogOut size={22} color="currentColor" />}
              />
            </SidebarMenu>
          </div>
        </Sidebar.Body>
      </div>
    </div>
  );
};

export default SidebarWrapper;
