// Path: apps/user-ui/src/shared/components/cards/statcard.tsx
import React from "react";

const StatCard = ({ title, count, Icon }: any) => {
  return (
    <div className="bg-white rounded-2xl border border-[#E7E5E4] p-4 flex items-center justify-between shadow-[0_4px_20px_-4px_rgba(120,53,15,0.08)]">
      <div>
        <p className="text-xs text-[#78716C] mb-1">{title}</p>
        <h3 className="font-heading text-2xl font-extrabold text-[#292524]">
          {count}
        </h3>
      </div>
      <div className="p-3 bg-[#D1FAE5] rounded-full">
        <Icon size={20} className="text-[#059669]" />
      </div>
    </div>
  );
};

export default StatCard;
