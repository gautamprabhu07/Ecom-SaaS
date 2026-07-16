// Path: apps/seller-ui/src/shared/components/sidebar/sidebar.item.tsx
import React from "react";
import Link from "next/link";

interface Props {
  icon: React.ReactNode;
  title: string;
  isActive?: boolean;
  href: string;
}

const SidebarItem = ({ icon, title, isActive, href }: Props) => {
  return (
    <Link href={href}>
      <div
        className={`flex items-center gap-3 px-3 py-2 rounded-[6px] transition-colors ${
          isActive
            ? "bg-[#1A1A1A] text-[#F7F6F4]"
            : "text-[#787672] hover:bg-[#F7F6F4] hover:text-[#111110]"
        }`}
      >
        {icon}
        <h5 className="text-sm font-medium">{title}</h5>
      </div>
    </Link>
  );
};

export default SidebarItem;
