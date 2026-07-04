// Path: apps/seller-ui/src/shared/components/sidebar/sidebar.menu.tsx
import React from "react";

interface Props {
  title: string;
  children: React.ReactNode;
}

const SidebarMenu = ({ title, children }: Props) => {
  return (
    <div className="mt-6">
      <h3 className="px-3 mb-2 text-xs font-semibold uppercase tracking-wide text-[#787672]">
        {title}
      </h3>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  );
};

export default SidebarMenu;
