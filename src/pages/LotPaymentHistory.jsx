import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Home,
  Receipt,
  Calendar,
  User,
  FileText,
  ArrowLeft,
} from "lucide-react";
import { supabase } from "../lib/supabase";

function LotPaymentHistory() {
  const { lotId } = useParams();
  const [lot, setLot] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (lotId) {
      fetchPaymentHistory();
    }
  }, [lotId]);

  const fetchPaymentHistory = async () => {
    setLoading(true);
    try {
      // Fetch lot information
      const { data: lotData, error: lotError } = await supabase
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
        .eq("id", lotId)
        .single();

      if (lotError) throw lotError;
      setLot(lotData);

      // Fetch payment history
      const { data: paymentsData, error: paymentsError } = await supabase
        .from("lot_payments")
        .select("*")
        .eq("lot_id", lotId)
        .order("payment_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (paymentsError) throw paymentsError;
      setPayments(paymentsData || []);
    } catch (error) {
      console.error("Error fetching payment history:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const totalPaid = payments.reduce(
    (sum, payment) => sum + parseFloat(payment.amount || 0),
    0
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment history...</p>
        </div>
      </div>
    );
  }

  if (!lot) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Lot not found.</p>
          <Link
            to="/dashboard/lot-payments"
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Lot Payments
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Receipt className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Payment History
                </h1>
                <p className="text-gray-600 mt-1">
                  Block {lot.block_no} - Lot {lot.lot_no}
                </p>
              </div>
            </div>
            <Link
              to="/dashboard/lot-payments"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Lot Payments
            </Link>
          </div>

          {/* Lot Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-3">
              Lot Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <span className="text-gray-600 text-sm">Block-Lot:</span>
                <p className="font-medium text-gray-900">
                  {lot.block_no}-{lot.lot_no}
                </p>
              </div>
              <div>
                <span className="text-gray-600 text-sm">Owner:</span>
                <p className="font-medium text-gray-900">
                  {lot.members?.member_name || "N/A"}
                </p>
              </div>
              <div>
                <span className="text-gray-600 text-sm">Property Price:</span>
                <p className="font-medium text-blue-600">
                  ₱{parseFloat(lot.property_price || 0).toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-gray-600 text-sm">Current Balance:</span>
                <p
                  className={`font-medium ${
                    parseFloat(lot.balance || 0) > 0
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  ₱{parseFloat(lot.balance || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Receipt className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Payments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {payments.length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Receipt className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Paid Amount</p>
                <p className="text-2xl font-bold text-green-600">
                  ₱{totalPaid.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Receipt className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Average Payment</p>
                <p className="text-2xl font-bold text-purple-600">
                  ₱
                  {payments.length > 0
                    ? (totalPaid / payments.length).toLocaleString()
                    : "0"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment History Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Payment History ({payments.length} payments)
            </h3>
          </div>

          {payments.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No payments found for this lot.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-4 font-semibold text-gray-700">
                      Receipt Number
                    </th>
                    <th className="text-left p-4 font-semibold text-gray-700">
                      Amount
                    </th>
                    <th className="text-left p-4 font-semibold text-gray-700">
                      Payment Date
                    </th>
                    <th className="text-left p-4 font-semibold text-gray-700">
                      Date Recorded
                    </th>
                    <th className="text-left p-4 font-semibold text-gray-700">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment, index) => (
                    <tr
                      key={payment.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-25"
                      }`}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Receipt className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-gray-900">
                            {payment.receipt_number}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-green-600 text-lg">
                          ₱{parseFloat(payment.amount || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-900">
                            {formatDate(payment.payment_date)}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-gray-600 text-sm">
                          {formatDate(payment.created_at)}
                        </span>
                      </td>
                      <td className="p-4">
                        {payment.notes ? (
                          <div className="flex items-start gap-2">
                            <FileText className="h-4 w-4 text-gray-400 mt-0.5" />
                            <span className="text-gray-700 text-sm">
                              {payment.notes}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm italic">
                            No notes
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LotPaymentHistory;
