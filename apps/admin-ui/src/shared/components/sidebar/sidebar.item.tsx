// Path: apps/admin-ui/src/shared/components/sidebar/sidebar.item.tsx
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
        className={`flex items-center gap-3 px-3 py-2 mx-2 rounded-full transition-colors ${
          isActive
            ? "bg-[#059669] text-white shadow-[0_4px_20px_-4px_rgba(120,53,15,0.08)]"
            : "text-[#78716C] hover:bg-[#D1FAE5] hover:text-[#292524]"
        }`}
      >
        {icon}
        <h5 className="text-sm font-medium">{title}</h5>
      </div>
    </Link>
  );
};

export default SidebarItem;
