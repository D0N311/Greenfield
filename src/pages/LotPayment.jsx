import { useState, useEffect } from "react";
import {
  Home,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Plus,
  X,
  Receipt,
  Eye,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import Statistics from "../components/Statistics";
import Modal from "../components/Modal";
import ConfirmationModal from "../components/ConfirmationModal";

function LotPayment() {
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showGeneralPaymentModal, setShowGeneralPaymentModal] = useState(false);
  const [selectedLot, setSelectedLot] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    receipt_number: "",
    payment_date: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [stats, setStats] = useState({
    totalLots: 0,
    totalOutstanding: 0,
    totalPaid: 0,
    totalValue: 0,
  });

  // Confirmation modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmTitle, setConfirmTitle] = useState("");

  useEffect(() => {
    fetchLotPaymentData();
  }, []);

  const fetchLotPaymentData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("lots")
        .select(
          `
          *,
          members (
            id,
            member_name
          )
        `
        )
        .eq("is_active", true)
        .order("block_no")
        .order("lot_no");

      if (error) throw error;

      const lotsData = data || [];
      setLots(lotsData);

      // Calculate statistics
      const totalLots = lotsData.length;
      const totalOutstanding = lotsData.reduce(
        (sum, lot) => sum + parseFloat(lot.balance || 0),
        0
      );
      const totalValue = lotsData.reduce(
        (sum, lot) => sum + parseFloat(lot.property_price || 0),
        0
      );
      const totalPaid = totalValue - totalOutstanding;

      setStats({
        totalLots,
        totalOutstanding,
        totalPaid,
        totalValue,
      });
    } catch (error) {
      console.error("Error fetching lot payment data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = (lot) => {
    setSelectedLot(lot);
    setPaymentForm({
      amount: "",
      receipt_number: "",
      payment_date: new Date().toISOString().split("T")[0],
      notes: "",
    });
    setShowPaymentModal(true);
  };

  const handleGeneralAddPayment = () => {
    setSelectedLot(null);
    setPaymentForm({
      amount: "",
      receipt_number: "",
      payment_date: new Date().toISOString().split("T")[0],
      notes: "",
    });
    setShowGeneralPaymentModal(true);
  };

  const handleLotSelection = (lotId) => {
    const lot = lots.find((l) => l.id === lotId);
    setSelectedLot(lot);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLot || !paymentForm.amount || !paymentForm.receipt_number) {
      setConfirmTitle("Missing Information");
      setConfirmMessage(
        "Please fill in all required fields before submitting the payment."
      );
      setConfirmAction(() => () => setShowConfirmModal(false));
      setShowConfirmModal(true);
      return;
    }

    const paymentAmount = parseFloat(paymentForm.amount);
    const currentBalance = parseFloat(selectedLot.balance || 0);

    if (paymentAmount <= 0) {
      setConfirmTitle("Invalid Amount");
      setConfirmMessage(
        "Payment amount must be greater than 0. Please enter a valid payment amount."
      );
      setConfirmAction(() => () => setShowConfirmModal(false));
      setShowConfirmModal(true);
      return;
    }

    if (paymentAmount > currentBalance) {
      setConfirmTitle("Amount Exceeds Balance");
      setConfirmMessage(
        `Payment amount (₱${paymentAmount.toLocaleString()}) cannot exceed the outstanding balance (₱${currentBalance.toLocaleString()}). Please enter a valid amount.`
      );
      setConfirmAction(() => () => setShowConfirmModal(false));
      setShowConfirmModal(true);
      return;
    }

    setSubmitting(true);
    try {
      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("Error getting user:", userError);
        setConfirmTitle("Authentication Error");
        setConfirmMessage(
          "You are not properly authenticated. Please sign in again to continue."
        );
        setConfirmAction(() => () => setShowConfirmModal(false));
        setShowConfirmModal(true);
        return;
      }

      // Insert payment record
      const { error: paymentError } = await supabase
        .from("lot_payments")
        .insert({
          lot_id: selectedLot.id,
          amount: paymentAmount,
          receipt_number: paymentForm.receipt_number,
          payment_date: paymentForm.payment_date,
          notes: paymentForm.notes,
          created_by: user?.id,
          created_at: new Date().toISOString(),
        });

      if (paymentError) throw paymentError;

      // Update lot balance
      const newBalance = currentBalance - paymentAmount;
      const { error: balanceError } = await supabase
        .from("lots")
        .update({ balance: newBalance })
        .eq("id", selectedLot.id);

      if (balanceError) throw balanceError;

      setConfirmTitle("Payment Successful");
      setConfirmMessage(
        `Payment of ₱${paymentAmount.toLocaleString()} has been added successfully!\n\nReceipt Number: ${
          paymentForm.receipt_number
        }\nLot: ${selectedLot.block_no}-${
          selectedLot.lot_no
        }\nNew Balance: ₱${newBalance.toLocaleString()}`
      );
      setConfirmAction(() => () => setShowConfirmModal(false));
      setShowConfirmModal(true);
      setShowPaymentModal(false);
      setShowGeneralPaymentModal(false);
      fetchLotPaymentData(); // Refresh data
    } catch (error) {
      console.error("Error processing payment:", error);
      setConfirmTitle("Payment Error");
      setConfirmMessage(
        "There was an error processing your payment. Please check your information and try again."
      );
      setConfirmAction(() => () => setShowConfirmModal(false));
      setShowConfirmModal(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentFormChange = (e) => {
    const { name, value } = e.target;
    setPaymentForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Pagination calculations
  const totalPages = Math.ceil(lots.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLots = lots.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleViewHistory = (lot) => {
    const historyUrl = `/lot-payment-history/${lot.id}`;
    window.open(historyUrl, "_blank");
  };

  return (
    <div className="glass-panel rounded-2xl p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-600" />
          <h1 className="text-2xl md:text-3xl font-bold text-black">
            Lot Payments
          </h1>
        </div>
      </div>

      <p className="text-sm text-gray-700 mb-4">
        Track lot property values, payments, and outstanding balances for all
        community lots.
      </p>

      {/* Statistics Cards */}
      <Statistics
        stats={[
          {
            title: "Total Property Value",
            value: `₱${stats.totalValue.toLocaleString()}`,
            subtitle: `${stats.totalLots} active lots`,
          },
          {
            title: "Total Paid",
            value: `₱${stats.totalPaid.toLocaleString()}`,
            subtitle: "Amount received",
          },
          {
            title: "Outstanding Balance",
            value: `₱${stats.totalOutstanding.toLocaleString()}`,
            subtitle: "Amount pending",
          },
          {
            title: "Payment Progress",
            value: `${
              stats.totalValue > 0
                ? Math.round((stats.totalPaid / stats.totalValue) * 100)
                : 0
            }%`,
            subtitle: "Completion rate",
          },
        ]}
      />

      {/* Lot Payments Table */}
      <div className="glass-panel rounded-xl p-4 mt-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-semibold text-black">
              Lot Payment Status
            </h3>
            <p className="text-sm text-gray-600">
              Showing {startIndex + 1}-{Math.min(endIndex, lots.length)} of{" "}
              {lots.length} lots
            </p>
          </div>
          <button
            onClick={handleGeneralAddPayment}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            <span>Add Lot Payment</span>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-600">
            Loading lot payments...
          </div>
        ) : lots.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            No active lots found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left p-3 font-semibold text-gray-700">
                    Block-Lot
                  </th>
                  <th className="text-left p-3 font-semibold text-gray-700">
                    Owner
                  </th>
                  <th className="text-left p-3 font-semibold text-gray-700">
                    Property Price
                  </th>
                  <th className="text-left p-3 font-semibold text-gray-700">
                    Balance
                  </th>
                  <th className="text-left p-3 font-semibold text-gray-700">
                    Paid Amount
                  </th>
                  <th className="text-left p-3 font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="text-left p-3 font-semibold text-gray-700">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentLots.map((lot) => {
                  const propertyPrice = parseFloat(lot.property_price || 0);
                  const balance = parseFloat(lot.balance || 0);
                  const paidAmount = propertyPrice - balance;
                  const isFullyPaid = balance === 0;

                  return (
                    <tr
                      key={lot.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <Home className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-900">
                            {lot.block_no}-{lot.lot_no}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="font-medium text-gray-900">
                          {lot.members?.member_name || "N/A"}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-blue-600">
                          ₱{propertyPrice.toLocaleString()}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`font-semibold ${
                            balance > 0 ? "text-red-600" : "text-green-600"
                          }`}
                        >
                          ₱{balance.toLocaleString()}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-green-600">
                          ₱{paidAmount.toLocaleString()}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${
                            isFullyPaid
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {isFullyPaid ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <AlertCircle className="h-3 w-3" />
                          )}
                          {isFullyPaid ? "Fully Paid" : "Outstanding"}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {balance > 0 && (
                            <button
                              onClick={() => handleAddPayment(lot)}
                              className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs font-medium flex items-center gap-1"
                            >
                              <Plus className="h-3 w-3" />
                              Add Payment
                            </button>
                          )}
                          <button
                            onClick={() => handleViewHistory(lot)}
                            className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium flex items-center gap-1"
                          >
                            <Eye className="h-3 w-3" />
                            History
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 px-4">
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>

              {/* Page numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                        pageNum === currentPage
                          ? "bg-blue-600 text-white"
                          : "border border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Add Payment"
      >
        <form onSubmit={handlePaymentSubmit} className="space-y-4">
          {selectedLot && (
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h4 className="font-semibold text-gray-800 mb-2">
                Lot Information
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Block-Lot:</span>
                  <span className="ml-2 font-medium">
                    {selectedLot.block_no}-{selectedLot.lot_no}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Owner:</span>
                  <span className="ml-2 font-medium">
                    {selectedLot.members?.member_name || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Property Price:</span>
                  <span className="ml-2 font-medium text-blue-600">
                    ₱
                    {parseFloat(
                      selectedLot.property_price || 0
                    ).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Outstanding Balance:</span>
                  <span className="ml-2 font-medium text-red-600">
                    ₱{parseFloat(selectedLot.balance || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Amount *
              </label>
              <input
                type="number"
                name="amount"
                step="0.01"
                min="0.01"
                max={selectedLot ? selectedLot.balance : ""}
                value={paymentForm.amount}
                onChange={handlePaymentFormChange}
                placeholder="Enter payment amount"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Receipt Number *
              </label>
              <input
                type="text"
                name="receipt_number"
                value={paymentForm.receipt_number}
                onChange={handlePaymentFormChange}
                placeholder="Enter receipt number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Date *
            </label>
            <input
              type="date"
              name="payment_date"
              value={paymentForm.payment_date}
              onChange={handlePaymentFormChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              name="notes"
              value={paymentForm.notes}
              onChange={handlePaymentFormChange}
              placeholder="Enter any additional notes"
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowPaymentModal(false)}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                "Processing..."
              ) : (
                <>
                  <Receipt className="h-4 w-4" />
                  Add Payment
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* General Add Payment Modal */}
      <Modal
        isOpen={showGeneralPaymentModal}
        onClose={() => setShowGeneralPaymentModal(false)}
        title="Add Lot Payment"
      >
        <form onSubmit={handlePaymentSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Lot *
            </label>
            <select
              value={selectedLot?.id || ""}
              onChange={(e) => handleLotSelection(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            >
              <option value="">Choose a lot...</option>
              {lots
                .filter((lot) => parseFloat(lot.balance || 0) > 0)
                .map((lot) => {
                  const balance = parseFloat(lot.balance || 0);
                  return (
                    <option key={lot.id} value={lot.id}>
                      Block {lot.block_no} - Lot {lot.lot_no} (
                      {lot.members?.member_name || "No Owner"}) - Balance: ₱
                      {balance.toLocaleString()}
                    </option>
                  );
                })}
            </select>
          </div>

          {selectedLot && (
            <>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h4 className="font-semibold text-gray-800 mb-2">
                  Selected Lot Information
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Block-Lot:</span>
                    <span className="ml-2 font-medium">
                      {selectedLot.block_no}-{selectedLot.lot_no}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Owner:</span>
                    <span className="ml-2 font-medium">
                      {selectedLot.members?.member_name || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Property Price:</span>
                    <span className="ml-2 font-medium text-blue-600">
                      ₱
                      {parseFloat(
                        selectedLot.property_price || 0
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Outstanding Balance:</span>
                    <span className="ml-2 font-medium text-red-600">
                      ₱{parseFloat(selectedLot.balance || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Amount *
                  </label>
                  <input
                    type="number"
                    name="amount"
                    step="0.01"
                    min="0.01"
                    max={selectedLot.balance}
                    value={paymentForm.amount}
                    onChange={handlePaymentFormChange}
                    placeholder="Enter payment amount"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Receipt Number *
                  </label>
                  <input
                    type="text"
                    name="receipt_number"
                    value={paymentForm.receipt_number}
                    onChange={handlePaymentFormChange}
                    placeholder="Enter receipt number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Date *
                </label>
                <input
                  type="date"
                  name="payment_date"
                  value={paymentForm.payment_date}
                  onChange={handlePaymentFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  name="notes"
                  value={paymentForm.notes}
                  onChange={handlePaymentFormChange}
                  placeholder="Enter any additional notes"
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                />
              </div>
            </>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowGeneralPaymentModal(false)}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedLot}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                "Processing..."
              ) : (
                <>
                  <Receipt className="h-4 w-4" />
                  Add Payment
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmAction || (() => setShowConfirmModal(false))}
        title={confirmTitle}
        message={confirmMessage}
        confirmText="OK"
        type={
          confirmTitle.includes("Success")
            ? "info"
            : confirmTitle.includes("Error")
            ? "danger"
            : "warning"
        }
      />
    </div>
  );
}

export default LotPayment;
