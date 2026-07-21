//path: apps/admin-ui/src/app/dashboard/layout.tsx
import React from "react";
import SidebarWrapper from "apps/admin-ui/src/shared/components/sidebar/index";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-screen bg-[#FAF8F3]">
      <aside className="w-[260px] shrink-0">
        <SidebarWrapper />
      </aside>
      <main className="flex-1 min-w-0 p-6">{children}</main>
    </div>
  );
};

export default Layout;
