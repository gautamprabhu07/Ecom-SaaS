// Path: apps/user-ui/src/shared/components/cards/quickActionCard.tsx
import React from "react";

const QuickActionCard = ({ Icon, title, description }: any) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3 flex items-start gap-3 hover:shadow-sm transition cursor-pointer">
      <div className="p-2 bg-blue-50 rounded-lg shrink-0">
        <Icon size={15} className="text-blue-600" />
      </div>
      <div>
        <h4 className="text-sm font-medium text-gray-800">{title}</h4>
        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
      </div>
    </div>
  );
};

export default QuickActionCard;
