//path: apps/user-ui/src/shared/components/section/section-title.tsx
import React from "react";

const SectionTitle = ({ title }: { title: string }) => {
  return (
    <div className="flex items-center gap-3 mb-6">
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 animate-[pulse-soft_2s_ease-in-out_infinite]" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
      </span>
      <h2 className="text-xl font-bold text-neutral-900 tracking-tight">
        {title}
      </h2>
      <span className="h-px flex-1 bg-linear-to-r from-neutral-200 to-transparent" />
    </div>
  );
};

export default SectionTitle;
