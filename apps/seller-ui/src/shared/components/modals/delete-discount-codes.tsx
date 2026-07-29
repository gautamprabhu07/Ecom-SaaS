//Path: apps/seller-ui/src/shared/components/modals/delete-discount-codes.tsx
import { X } from "lucide-react";
import React from "react";

const DeleteDiscountCodeModal = ({
  discount,
  onClose,
  onConfirm,
}: {
  discount: any;
  onClose: () => void;
  onConfirm?: any;
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#292524]/40 animate-[fade-in_150ms_ease-out]">
      <div className="bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(120,53,15,0.15)] w-full max-w-sm p-6 animate-[dropdown-in_200ms_ease-out] font-['Inter']">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-['Nunito'] text-lg font-bold text-[#292524]">
            Delete Discount Code
          </h3>
          <button
            onClick={onClose}
            className="text-[#78716C] hover:text-[#292524] hover:rotate-90 transition-all duration-200"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-[#78716C] mb-6">
          Are you sure you want to delete{" "}
          <span className="font-medium text-[#292524]">
            "{discount.public_name}"
          </span>
          ?
          <br />
          <span className="text-red-500">This action cannot be undone.</span>
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-[#E7E5E4] text-[#292524] font-medium py-2.5 rounded-full text-sm transition-all duration-200 hover:bg-[#FAF8F3] hover:-translate-y-0.5"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-2.5 rounded-full text-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-8px_rgba(239,68,68,0.4)] active:translate-y-0"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteDiscountCodeModal;
