// Path: apps/user-ui/src/shared/components/cards/statcard.tsx
import React from "react";

const StatCard = ({ title, count, Icon }: any) => {
  return (
    <div className="group bg-white rounded-2xl border border-[#E7E5E4] p-4 flex items-center justify-between shadow-[0_4px_20px_-4px_rgba(120,53,15,0.08)] transition-all duration-300 hover:-translate-y-1 hover:border-[#059669]/30 hover:shadow-[0_10px_30px_-8px_rgba(5,150,105,0.25)]">
      <div>
        <p className="text-xs text-[#78716C] mb-1">{title}</p>
        <h3 className="font-heading text-2xl font-extrabold text-[#292524] transition-transform duration-300 group-hover:scale-105 origin-left">
          {count}
        </h3>
      </div>
      <div className="p-3 bg-[#D1FAE5] rounded-full transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
        <Icon size={20} className="text-[#059669]" />
      </div>
    </div>
  );
};

export default StatCard;
