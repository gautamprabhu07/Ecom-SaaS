// Path: apps/user-ui/src/shared/components/cards/quickActionCard.tsx
import React from "react";
import { ArrowRight } from "lucide-react";

const QuickActionCard = ({ Icon, title, description }: any) => {
  return (
    <div className="group bg-white rounded-2xl border border-[#E7E5E4] p-3 flex items-start gap-3 transition-all duration-300 hover:-translate-y-1 hover:border-[#059669]/30 hover:shadow-[0_10px_30px_-8px_rgba(5,150,105,0.25)] cursor-pointer">
      <div className="p-2 bg-[#D1FAE5] rounded-full shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
        <Icon size={15} className="text-[#059669]" />
      </div>
      <div className="flex-1">
        <h4 className="text-sm font-medium text-[#292524]">{title}</h4>
        <p className="text-xs text-[#78716C] mt-0.5">{description}</p>
      </div>
      <ArrowRight
        size={14}
        className="text-[#059669] shrink-0 mt-0.5 opacity-0 -translate-x-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0"
      />
    </div>
  );
};

export default QuickActionCard;
