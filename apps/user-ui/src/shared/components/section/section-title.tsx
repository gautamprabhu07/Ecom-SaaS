//path: apps/user-ui/src/shared/components/section/section-title.tsx
import React from "react";

const SectionTitle = ({ title }: { title: string }) => {
  return (
    <div className="flex items-center gap-3 mb-6">
      <span className="h-5 w-1.5 rounded-full bg-emerald-500" />
      <h2 className="text-xl font-bold text-neutral-900 tracking-tight">
        {title}
      </h2>
    </div>
  );
};

export default SectionTitle;
