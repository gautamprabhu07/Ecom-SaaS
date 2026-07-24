// Path: apps/seller-ui/src/app/(routes)/dashboard/layout.tsx
"use client";
import React from "react";
import { usePathname } from "next/navigation";
import SidebarWrapper from "../../../shared/components/sidebar/sidebar";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const showSidebar = pathname !== "/dashboard/profile";

  return (
    <div className="flex min-h-screen bg-[#FAF8F3]">
      {showSidebar && (
        <aside className="w-65 shrink-0 relative z-10">
          <SidebarWrapper />
        </aside>
      )}
      <main
        className={`flex-1 min-w-0 overflow-y-auto p-6 ${
          showSidebar ? "ml-65 md:ml-0" : "ml-0"
        }`}
      >
        {children}
      </main>
    </div>
  );
};

export default Layout;
