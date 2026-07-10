//Path: apps/seller-ui/src/shared/components/modals/delete.confirmation.modal.tsx
import { X } from "lucide-react";
import React from "react";

const DeleteConfirmationModal = ({
  product,
  onClose,
  onConfirm,
  onRestore,
}: any) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            {product?.isDeleted ? "Restore Product" : "Delete Product"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          Are you sure you want to {product?.isDeleted ? "restore" : "delete"}{" "}
          <span className="font-medium text-gray-800">"{product?.title}"</span>?
          <br />
          <br />
          <span className="text-amber-600 text-xs">
            This product will be moved to the trash and can be restored within
            24 hours. After that, it will be permanently deleted.
          </span>
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-700 font-medium py-2.5 rounded-lg text-sm hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={!product?.isDeleted ? onConfirm : onRestore}
            className={`flex-1 font-medium py-2.5 rounded-lg text-sm text-white transition ${product?.isDeleted ? "bg-green-600 hover:bg-green-700" : "bg-red-500 hover:bg-red-600"}`}
          >
            {product?.isDeleted ? "Restore" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
