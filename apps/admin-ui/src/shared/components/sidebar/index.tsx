//path: apps/admin-ui/src/shared/components/sidebar/index.tsx
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
import Image from "next/image";

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
            <Image
              src="/logoeshop.png"
              alt="Eshop Logo"
              width={52}
              height={52}
              priority
            />
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
                title="Orders"
                href="/dashboard/orders"
                icon={
                  <ListOrdered className={getIconColor("/dashboard/orders")} />
                }
              />
              <SidebarItem
                isActive={activeSidebar === "/dashboard/payments"}
                title="Payments"
                href="/dashboard/payments"
                icon={/*Fill in an appropriate icon for Payments*/}
              />
              {/*Products*/}
              <SidebarItem
                isActive={activeSidebar === "/dashboard/products"}
                title="Products"
                href="/dashboard/products"
                icon={/*Fill in an appropriate icon for Products*/}
              />

              {/*Events*/}
              <SidebarItem
                isActive={activeSidebar === "/dashboard/events"}
                title="Events"
                href="/dashboard/events"
                icon={/*Fill in an appropriate icon for Events*/}
              />
              {/*Users*/}
              <SidebarItem
                isActive={activeSidebar === "/dashboard/users"}
                title="Users"
                href="/dashboard/users"
                icon={/*Fill in an appropriate icon for Users*/}
              />
              {/* Sellers */}
              <SidebarItem
                isActive={activeSidebar === "/dashboard/sellers"}
                title="Sellers"
                href="/dashboard/sellers"
                icon={/*Fill in an appropriate icon for Sellers*/}
              />
            </SidebarMenu>

            <SidebarMenu title="COntrollers">
              {/* Loggers */}
              <SidebarItem
                isActive={activeSidebar === "/dashboard/loggers"}
                title="Loggers"
                href="/dashboard/loggers"
                icon={/*Fill in an appropriate icon for Loggers*/}
              />
              {/* Management */}
              <SidebarItem
                isActive={activeSidebar === "/dashboard/management"}
                title="Management"
                href="/dashboard/management"
                icon={/*Fill in an appropriate icon for Management*/}
              />
              {/* Notification */}
              <SidebarItem
                isActive={activeSidebar === "/dashboard/notifications"}
                title="Notifications"
                href="/dashboard/notifications"
                icon={/*Fill in an appropriate icon for Notifications*/}
              />
            </SidebarMenu>
            <SidebarMenu title="Customization">
              {/* Customization */}
              <SidebarItem
                isActive={activeSidebar === "/dashboard/customization"}
                title="Customization"
                href="/dashboard/customization"
                icon={/*Fill in an appropriate icon for Customization*/}
              />
            </SidebarMenu>
            <SidebarMenu title="Extras">
              {/* Logout */}
              <SidebarItem
                isActive={activeSidebar === "/logout"}
                title="Logout"
                href="/logout"
                icon={/*Fill in an appropriate icon for Logout*/}
              />
            </SidebarMenu>
          </div>
        </Sidebar.Body>
      </div>
    </Box>
  );
};

export default SidebarWrapper;
