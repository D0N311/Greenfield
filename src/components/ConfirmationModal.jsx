import { AlertTriangle, X } from "lucide-react";
import Modal from "./Modal";

function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "danger", // 'danger', 'warning', 'info'
  isLoading = false,
}) {
  const getTypeStyles = () => {
    switch (type) {
      case "danger":
        return {
          icon: "text-red-600",
          button: "bg-red-600 hover:bg-red-700",
          border: "border-red-200",
          bg: "bg-red-50",
        };
      case "warning":
        return {
          icon: "text-yellow-600",
          button: "bg-yellow-600 hover:bg-yellow-700",
          border: "border-yellow-200",
          bg: "bg-yellow-50",
        };
      case "info":
        return {
          icon: "text-blue-600",
          button: "bg-blue-600 hover:bg-blue-700",
          border: "border-blue-200",
          bg: "bg-blue-50",
        };
      default:
        return {
          icon: "text-red-600",
          button: "bg-red-600 hover:bg-red-700",
          border: "border-red-200",
          bg: "bg-red-50",
        };
    }
  };

  const styles = getTypeStyles();

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="space-y-4">
        {/* Icon and Title */}
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-full ${styles.bg} ${styles.border} border`}
          >
            <AlertTriangle className={`h-5 w-5 ${styles.icon}`} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>

        {/* Message */}
        <div className="pl-12">
          <p className="text-gray-700">{message}</p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${styles.button}`}
          >
            {isLoading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default ConfirmationModal;
