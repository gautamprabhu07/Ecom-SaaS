import React from "react";
import Link from "next/link";

interface Props {
  icon: React.ReactNode;
  title: string;
  isActive?: boolean;
  href?: string;
  onClick?: () => void | Promise<void>;
}

const SidebarItem = ({ icon, title, isActive, href, onClick }: Props) => {
  const itemClassName = `flex items-center gap-3 px-3 py-2 mx-2 rounded-full transition-colors ${
    isActive
      ? "bg-[#059669] text-white shadow-[0_4px_20px_-4px_rgba(120,53,15,0.08)]"
      : "text-[#78716C] hover:bg-[#D1FAE5] hover:text-[#292524]"
  }`;

  const content = (
    <div className={itemClassName}>
      {icon}
      <h5 className="text-sm font-medium">{title}</h5>
    </div>
  );

  if (href) {
    return (
      <Link href={href} onClick={onClick}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className="w-full text-left">
      {content}
    </button>
  );
};

export default SidebarItem;
