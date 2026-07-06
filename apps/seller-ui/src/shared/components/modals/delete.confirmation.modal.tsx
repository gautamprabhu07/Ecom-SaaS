import { X } from "lucide-react";
import React from "react";

const DeleteConfirmationModal = ({
  product,
  OnClose,
  OnConfirm,
  OnRestore,
}: any) => {
  return (
    <div>
      <div>
        {/*Header*/}
        <h3>Delete Product</h3>
        <button onClick={OnClose}>
          <X />
        </button>
      </div>

      {/*Body*/}
      <p>
        Are you sure you want to delete <span>{product.title}</span>?
        <br />
        This product will be moved to the trash and can be restored later within
        24 hours. After that, it will be permanently deleted.
      </p>

      {/*Action buttons*/}
      <div>
        <button onClick={OnClose}>Cancel</button>
        <button onClick={!product?.isDeleted ? OnConfirm : OnRestore}>
          {product?.isDeleted ? "Restore" : "Delete"}
        </button>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
