//path: apps/admin-ui/src/app/dashboard/layout.tsx
import React from "react";
import SidebarWrapper from "apps/admin-ui/src/shared/components/sidebar/index";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      {/* sidebar */}
      <aside>
        <div>
          <SidebarWrapper />
        </div>
      </aside>

      {/* main content */}
      <main>
        <div>{children}</div>
      </main>
    </div>
  );
};

export default Layout;
