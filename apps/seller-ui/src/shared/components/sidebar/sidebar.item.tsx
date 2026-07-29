import React from "react";
import Link from "next/link";

interface Props {
  icon: React.ReactNode;
  title: string;
  isActive?: boolean;
  href?: string;
  danger?: boolean;
  onClick?: () => void | Promise<void>;
}

const SidebarItem = ({ icon, title, isActive, href, danger, onClick }: Props) => {
  const itemClassName = `group flex items-center gap-3 px-3 py-2 mx-2 rounded-full transition-all duration-200 hover:translate-x-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900 ${
    isActive
      ? "bg-emerald-500 text-white shadow-[0_4px_16px_-4px_rgba(16,185,129,0.5)]"
      : danger
        ? "text-neutral-300 hover:bg-red-500/10 hover:text-red-400"
        : "text-neutral-300 hover:bg-white/10 hover:text-white"
  }`;

  const iconClassName = `transition-transform duration-200 ${
    isActive ? "" : "group-hover:scale-110"
  }`;

  const content = (
    <div className={itemClassName}>
      <span className={iconClassName}>{icon}</span>
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
