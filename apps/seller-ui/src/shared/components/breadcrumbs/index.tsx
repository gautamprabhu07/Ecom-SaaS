//Path: apps/seller-ui/src/shared/components/breadcrumbs/index.tsx
import { ChevronRight } from "lucide-react";
import Link from "next/link";

const BreadCrumbs = ({ title }: { title: string }) => {
  return (
    <div>
      <Link href="/dashboard">Dashboard</Link>
      <ChevronRight />
      <span>{title}</span>
    </div>
  );
};
export default BreadCrumbs;
