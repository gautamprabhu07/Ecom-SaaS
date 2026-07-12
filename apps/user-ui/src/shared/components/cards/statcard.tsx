// Path: apps/user-ui/src/shared/components/cards/statcard.tsx
import React from "react";

const StatCard = ({ title, count, Icon }: any) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
      <div>
        <p className="text-xs text-gray-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-800">{count}</h3>
      </div>
      <div className="p-3 bg-blue-50 rounded-xl">
        <Icon size={20} className="text-blue-600" />
      </div>
    </div>
  );
};

export default StatCard;
