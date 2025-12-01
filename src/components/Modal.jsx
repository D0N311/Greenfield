import React, { useEffect } from "react";
import { X } from "lucide-react";

const Modal = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    if (isOpen) {
      // Scroll to modal container when modal opens
      const modalElement = document.getElementById("modal-container");
      if (modalElement) {
        modalElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      id="modal-container"
      className="fixed top-0 left-0 w-full bg-gray-800/50 bg-opacity-90 flex items-center justify-center z-50 p-4"
      style={{ height: "100vh", minHeight: "100%" }}
    >
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
