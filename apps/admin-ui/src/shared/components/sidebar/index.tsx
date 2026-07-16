"use client";
import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import useSidebar from "../../../hooks/useSidebar";
import useAdmin from "../../../hooks/useAdmin";
import Box from "../box";
import { Sidebar } from "./sidebar.styles";
import Link from "next/link";
import SidebarItem from "./sidebar.item";
import SidebarMenu from "./sidebarmenu";
import { ListOrdered } from "lucide-react";

const SidebarWrapper = () => {
  const { activeSidebar, setActiveSidebar } = useSidebar();
  const pathName = usePathname();
  const { admin } = useAdmin();

  useEffect(() => {
    setActiveSidebar(pathName);
  }, [pathName, setActiveSidebar]);

  const getIconColor = (route: string) => {
    return activeSidebar === route ? "text-blue-500" : "text-gray-500";
  };
  return (
    <Box
      css={{
        width: "250px",
        height: "100vh",
        backgroundColor: "#f8f9fa",
        padding: "20px",
        boxShadow: "2px 0 5px rgba(0, 0, 0, 0.1)",
        overflowY: "scroll",
      }}
    >
      <Sidebar.Header>
        <Box>
          <Link href="/">
            {/* Add logo */}
            <Box>
              <h3>{admin?.name}</h3>
              <h5>{admin?.email}</h5>
            </Box>
          </Link>
        </Box>
      </Sidebar.Header>
      <div>
        <Sidebar.Body>
          <SidebarItem
            icon={
              <svg
                className={getIconColor("/dashboard")}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              ></svg>
            }
            title="Dashboard"
            isActive={activeSidebar === "/dashboard"}
            href="/dashboard"
          />
          <div>
            <SidebarMenu title="Main Menu">
              <SidebarItem
                isActive={activeSidebar === "/dashboard/orders"}
                icon={<ListOrdered />}
              />
            </SidebarMenu>
          </div>
        </Sidebar.Body>
      </div>
    </Box>

    //add payment, accounts, all products, all events,  controllers, management, notifications, customization, logout
  );
};

export default SidebarWrapper;
