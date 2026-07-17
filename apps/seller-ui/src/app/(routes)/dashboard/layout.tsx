// Path: apps/seller-ui/src/app/(routes)/dashboard/layout.tsx
"use client";
import React from "react";
import SidebarWrapper from "../../../shared/components/sidebar/sidebar";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-screen bg-[#FAF8F3]">
      <aside className="w-[260px] shrink-0 relative z-10">
        <SidebarWrapper />
      </aside>
      <main className="flex-1 min-w-0 overflow-y-auto ml-[260px] md:ml-0 p-6">
        {children}
      </main>
    </div>
  );
};

export default Layout;
