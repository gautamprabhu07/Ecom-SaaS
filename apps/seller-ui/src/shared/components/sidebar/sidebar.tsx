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
import Logo from "./logo";
import SidebarItem from "./sidebar.item";
import SidebarMenu from "./sidebar.menu";
import {
  Home,
  BellPlus,
  BellRing,
  CalendarPlus,
  ListOrdered,
  PackageSearch,
  SquarePlus,
  TicketPercent,
  DoorOpen,
  Mail,
  Settings,
} from "lucide-react";

const SidebarWrapper = () => {
  const { activeSidebar, setActiveSidebar } = useSidebar();
  const pathName = usePathname();
  const { seller } = useSeller();

  useEffect(() => {
    setActiveSidebar(pathName);
  }, [pathName, setActiveSidebar]);

  return (
    <Box css={{ height: "100vh" }} className="sidebar-wrapper">
      <Sidebar.Header>
        <Box>
          <Link href={"/"}>
            <Logo />
            <Box>
              <h3>{seller?.shop?.name}</h3>
              <h5>{seller?.shop?.address}</h5>
            </Box>
          </Link>
        </Box>
      </Sidebar.Header>
      <div>
        <Sidebar.Body>
          <SidebarItem
            title="Dashboard"
            icon={<Home size={26} color="currentColor" />}
            isActive={activeSidebar === "/dashboard"}
            href="/dashboard"
          />
          <div>
            <SidebarMenu title="Main Menu">
              <SidebarItem
                isActive={activeSidebar === "/dashboard/orders"}
                title="Orders"
                icon={<ListOrdered size={26} color="currentColor" />}
                href="/dashboard/orders"
              />
              <SidebarItem
                isActive={activeSidebar === "/dashboard/payments"}
                title="Payments"
                icon={<ListOrdered size={26} color="currentColor" />}
                href="/dashboard/payments"
              />
            </SidebarMenu>
            <SidebarMenu title="Products">
              <SidebarItem
                isActive={activeSidebar === "/dashboard/create-product"}
                title="Create Product"
                icon={<SquarePlus size={26} color="currentColor" />}
                href="/dashboard/create-product"
              />
              <SidebarItem
                isActive={activeSidebar === "/dashboard/all-products"}
                title="All Products"
                icon={<PackageSearch size={26} color="currentColor" />}
                href="/dashboard/all-products"
              />
            </SidebarMenu>
            <SidebarMenu title="Events">
              <SidebarItem
                isActive={activeSidebar === "/dashboard/create-event"}
                title="Create Event"
                icon={<CalendarPlus size={26} color="currentColor" />}
                href="/dashboard/create-event"
              />
              <SidebarItem
                isActive={activeSidebar === "/dashboard/all-events"}
                title="All Events"
                icon={<BellPlus size={26} color="currentColor" />}
                href="/dashboard/all-events"
              />
            </SidebarMenu>
            q{" "}
            <SidebarMenu title="Controllers">
              <SidebarItem
                isActive={activeSidebar === "/dashboard/inbox"}
                title="Inbox"
                icon={<Mail size={26} color="currentColor" />}
                href="/dashboard/inbox"
              />
              <SidebarItem
                isActive={activeSidebar === "/dashboard/settings"}
                title="Settings"
                icon={<Settings size={26} color="currentColor" />}
                href="/dashboard/settings"
              />
              <SidebarItem
                isActive={activeSidebar === "/dashboard/notifications"}
                title="Notifications"
                icon={<BellRing size={26} color="currentColor" />}
                href="/dashboard/notifications"
              />
            </SidebarMenu>
            <SidebarMenu title="Extras">
              <SidebarItem
                isActive={activeSidebar === "/dashboard/discountCodes"}
                title="Discount Codes"
                icon={<TicketPercent size={26} color="currentColor" />}
                href="/dashboard/discountCodes"
              />
              <SidebarItem
                isActive={activeSidebar === "/dashboard/logout"}
                title="Logout"
                icon={<DoorOpen size={26} color="currentColor" />}
                href="/dashboard/logout"
              />
            </SidebarMenu>
          </div>
        </Sidebar.Body>
      </div>
    </Box>
  );
};

export default SidebarWrapper;
