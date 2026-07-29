//Path: apps/seller-ui/src/shared/components/breadcrumbs/index.tsx
import { ChevronRight } from "lucide-react";
import Link from "next/link";

const BreadCrumbs = ({ title }: { title: string }) => {
  return (
    <div className="flex items-center gap-1.5 text-sm">
      <Link
        href="/dashboard"
        className="text-[#78716C] hover:text-[#059669] transition-colors duration-150"
      >
        Dashboard
      </Link>
      <ChevronRight size={14} className="text-[#A8A29E]" />
      <span className="text-[#292524] font-medium">{title}</span>
    </div>
  );
};
export default BreadCrumbs;
