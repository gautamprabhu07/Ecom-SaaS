// Path: apps/user-ui/src/shared/components/cards/quickActionCard.tsx
import React from "react";

const QuickActionCard = ({ Icon, title, description }: any) => {
  return (
    <div className="bg-white rounded-2xl border border-[#E7E5E4] p-3 flex items-start gap-3 hover:shadow-[0_4px_20px_-4px_rgba(120,53,15,0.08)] transition cursor-pointer">
      <div className="p-2 bg-[#D1FAE5] rounded-full shrink-0">
        <Icon size={15} className="text-[#059669]" />
      </div>
      <div>
        <h4 className="text-sm font-medium text-[#292524]">{title}</h4>
        <p className="text-xs text-[#78716C] mt-0.5">{description}</p>
      </div>
    </div>
  );
};

export default QuickActionCard;
