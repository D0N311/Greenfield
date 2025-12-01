import { useState, useEffect } from "react";
import {
  AlertTriangle,
  Plus,
  Search,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  User,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import Modal from "../components/Modal";
import Statistics from "../components/Statistics";
import ConfirmationModal from "../components/ConfirmationModal";

function Penalty() {
  // State management
  const [penalties, setPenalties] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingPenalty, setEditingPenalty] = useState(null);
  const [viewingPenalty, setViewingPenalty] = useState(null);

  // Filters and search
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState(""); // all, pending, paid, cancelled
  const [filterMember, setFilterMember] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  // Confirmation modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [penaltyToDelete, setPenaltyToDelete] = useState(null);

  // Statistics
  const [stats, setStats] = useState({
    totalPenalties: 0,
    pendingPenalties: 0,
    paidPenalties: 0,
    totalAmount: 0,
    paidAmount: 0,
    pendingAmount: 0,
  });

  // Form data
  const [formData, setFormData] = useState({
    member_id: "",
    amount: "",
    reason: "",
    penalty_status: "pending",
    notes: "",
  });

  // Load data on component mount
  useEffect(() => {
    fetchMembers();
    fetchPenalties();
    fetchStatistics();
  }, []);

  const fetchMembers = async () => {
    try {
      // Check authentication status
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      // console.log("Current user:", user); // Debug log

      if (userError) {
        console.error("Authentication error:", userError);
        return;
      }

      if (!user) {
        console.error("No authenticated user found");
        return;
      }

      const { data, error } = await supabase
        .from("members")
        .select("id, member_name, status, deleted_at") // Added more fields for debugging
        .order("member_name");

      // console.log("Supabase query error:", error); // Debug log
      // console.log("All members from database:", data); // Debug log

      if (error) throw error;

      // Filter in JavaScript instead of using Supabase filters
      const activeMembers =
        data?.filter(
          (member) => member.deleted_at === null && member.status === "active"
        ) || [];

      setMembers(activeMembers);
    } catch (error) {
      console.error("Error details:", error.message, error.details, error.hint);
    }
  };

  const fetchPenalties = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("penalties")
        .select(
          `
          *,
          members (
            id,
            member_name
          )
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPenalties(data || []);
    } catch (error) {
      console.error("Error fetching penalties:", error);
      setStatus({
        type: "error",
        message: `Error loading penalties: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const { data, error } = await supabase
        .from("penalties")
        .select("amount, penalty_status");

      if (error) throw error;

      const totalPenalties = data?.length || 0;
      const pendingPenalties =
        data?.filter((p) => p.penalty_status === "pending").length || 0;
      const paidPenalties =
        data?.filter((p) => p.penalty_status === "paid").length || 0;

      const totalAmount =
        data?.reduce(
          (sum, penalty) => sum + parseFloat(penalty.amount || 0),
          0
        ) || 0;
      const paidAmount =
        data
          ?.filter((p) => p.penalty_status === "paid")
          .reduce((sum, penalty) => sum + parseFloat(penalty.amount || 0), 0) ||
        0;
      const pendingAmount =
        data
          ?.filter((p) => p.penalty_status === "pending")
          .reduce((sum, penalty) => sum + parseFloat(penalty.amount || 0), 0) ||
        0;

      setStats({
        totalPenalties,
        pendingPenalties,
        paidPenalties,
        totalAmount,
        paidAmount,
        pendingAmount,
      });
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  };

  const handleAddPenalty = async (e) => {
    e.preventDefault();
    try {
      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;

      const penaltyData = {
        ...formData,
        amount: parseFloat(formData.amount),
        created_by: user?.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("penalties").insert([penaltyData]);

      if (error) throw error;

      setStatus({
        type: "success",
        message: "Penalty added successfully!",
      });

      resetForm();
      setShowAddModal(false);
      await fetchPenalties();
      await fetchStatistics();

      setTimeout(() => setStatus(null), 3000);
    } catch (error) {
      console.error("Error adding penalty:", error);
      setStatus({
        type: "error",
        message: `Error adding penalty: ${error.message}`,
      });
    }
  };

  const handleEditPenalty = (penalty) => {
    setEditingPenalty(penalty.id);
    setFormData({
      member_id: penalty.member_id,
      amount: penalty.amount,
      reason: penalty.reason || "",
      penalty_status: penalty.penalty_status,
      notes: penalty.notes || "",
    });
    setShowEditModal(true);
  };

  const handleUpdatePenalty = async (e) => {
    e.preventDefault();
    try {
      const penaltyData = {
        ...formData,
        amount: parseFloat(formData.amount),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("penalties")
        .update(penaltyData)
        .eq("id", editingPenalty);

      if (error) throw error;

      setStatus({
        type: "success",
        message: "Penalty updated successfully!",
      });

      resetForm();
      setShowEditModal(false);
      setEditingPenalty(null);
      await fetchPenalties();
      await fetchStatistics();

      setTimeout(() => setStatus(null), 3000);
    } catch (error) {
      console.error("Error updating penalty:", error);
      setStatus({
        type: "error",
        message: `Error updating penalty: ${error.message}`,
      });
    }
  };

  const handleViewPenalty = (penalty) => {
    setViewingPenalty(penalty);
    setShowViewModal(true);
  };

  const handleDeletePenalty = (penalty) => {
    setPenaltyToDelete(penalty);
    setConfirmAction(() => async () => {
      try {
        const { error } = await supabase
          .from("penalties")
          .delete()
          .eq("id", penalty.id);

        if (error) throw error;

        setStatus({
          type: "success",
          message: "Penalty deleted successfully!",
        });

        await fetchPenalties();
        await fetchStatistics();
        setShowConfirmModal(false);
        setPenaltyToDelete(null);

        setTimeout(() => setStatus(null), 3000);
      } catch (error) {
        console.error("Error deleting penalty:", error);
        setStatus({
          type: "error",
          message: `Error deleting penalty: ${error.message}`,
        });
        setShowConfirmModal(false);
        setPenaltyToDelete(null);
      }
    });
    setShowConfirmModal(true);
  };

  const togglePenaltyStatus = async (penalty) => {
    try {
      const newStatus =
        penalty.penalty_status === "pending" ? "paid" : "pending";
      const updateData = {
        penalty_status: newStatus,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("penalties")
        .update(updateData)
        .eq("id", penalty.id);

      if (error) throw error;

      setStatus({
        type: "success",
        message: `Penalty marked as ${newStatus}!`,
      });

      await fetchPenalties();
      await fetchStatistics();

      setTimeout(() => setStatus(null), 2000);
    } catch (error) {
      console.error("Error updating penalty status:", error);
      setStatus({
        type: "error",
        message: `Error updating penalty status: ${error.message}`,
      });
    }
  };

  const resetForm = () => {
    setFormData({
      member_id: "",
      amount: "",
      reason: "",
      penalty_status: "pending",
      notes: "",
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Filter penalties based on search and filters
  const filteredPenalties = penalties.filter((penalty) => {
    const memberName = penalty.members?.member_name?.toLowerCase() || "";
    const reason = penalty.reason?.toLowerCase() || "";
    const matchesSearch =
      memberName.includes(searchTerm.toLowerCase()) ||
      reason.includes(searchTerm.toLowerCase());

    const matchesStatus =
      !filterStatus || penalty.penalty_status === filterStatus;

    const matchesMember = !filterMember || penalty.member_id === filterMember;

    return matchesSearch && matchesStatus && matchesMember;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredPenalties.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPenalties = filteredPenalties.slice(startIndex, endIndex);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "cancelled":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "paid":
        return <CheckCircle2 className="h-3 w-3" />;
      case "pending":
        return <Clock className="h-3 w-3" />;
      case "cancelled":
        return <AlertCircle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <h1 className="text-2xl md:text-3xl font-bold text-black">
            Penalty Management
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            <span>Add Penalty</span>
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-700 mb-4">
        Manage and track penalties imposed on community members for violations
        and infractions.
      </p>

      {/* Status Messages */}
      {status && (
        <div
          className={`mb-3 p-2.5 rounded-lg flex items-center gap-2 text-sm ${
            status.type === "success"
              ? "bg-green-100 border border-green-400 text-green-700"
              : "bg-red-100 border border-red-400 text-red-700"
          }`}
        >
          {status.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{status.message}</span>
        </div>
      )}

      {/* Statistics Cards */}
      <Statistics
        stats={[
          {
            title: "Total Penalties",
            value: stats.totalPenalties,
            subtitle: `₱${stats.totalAmount.toLocaleString()} total amount`,
          },
          {
            title: "Pending Penalties",
            value: stats.pendingPenalties,
            subtitle: `₱${stats.pendingAmount.toLocaleString()} pending amount`,
          },
          {
            title: "Paid Penalties",
            value: stats.paidPenalties,
            subtitle: `₱${stats.paidAmount.toLocaleString()} collected`,
          },
          {
            title: "Collection Rate",
            value:
              stats.totalAmount > 0
                ? `${Math.round((stats.paidAmount / stats.totalAmount) * 100)}%`
                : "0%",
            subtitle: "Payment completion",
          },
        ]}
      />

      {/* Filters */}
      <div className="glass-panel rounded-xl p-4 mt-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search by member or reason..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 w-full"
            />
          </div>

          <select
            value={filterMember}
            onChange={(e) => setFilterMember(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">All Members</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.member_name}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Penalties Table */}
      <div className="glass-panel rounded-xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold text-black">Penalties List</h3>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-600">
            Loading penalties...
          </div>
        ) : filteredPenalties.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            No penalties found. Add penalties to get started!
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left p-3 font-semibold text-gray-700 w-16">
                      No.
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-700">
                      Member
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-700">
                      Reason
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-700">
                      Amount
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-700">
                      Created Date
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentPenalties.map((penalty, index) => (
                    <tr
                      key={penalty.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="p-3 text-gray-600 font-medium">
                        {startIndex + index + 1}
                      </td>
                      <td className="p-3">
                        <span className="font-medium text-gray-900">
                          {penalty.members?.member_name || "N/A"}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-gray-700">
                          {penalty.reason && penalty.reason.length > 50
                            ? `${penalty.reason.substring(0, 50)}...`
                            : penalty.reason || "-"}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-red-600">
                          ₱{parseFloat(penalty.amount).toLocaleString()}
                        </span>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => togglePenaltyStatus(penalty)}
                          className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 transition-colors ${getStatusColor(
                            penalty.penalty_status
                          )} hover:opacity-80`}
                        >
                          {getStatusIcon(penalty.penalty_status)}
                          {penalty.penalty_status?.charAt(0).toUpperCase() +
                            penalty.penalty_status?.slice(1)}
                        </button>
                      </td>
                      <td className="p-3">
                        <span className="text-gray-700">
                          {penalty.created_at
                            ? new Date(penalty.created_at).toLocaleDateString()
                            : "-"}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleViewPenalty(penalty)}
                            className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEditPenalty(penalty)}
                            className="p-1.5 text-green-600 hover:bg-green-100 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePenalty(penalty)}
                            className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Showing {startIndex + 1} to{" "}
                  {Math.min(endIndex, filteredPenalties.length)} of{" "}
                  {filteredPenalties.length} penalties
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

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
                        className={`px-3 py-1 text-sm rounded transition-colors ${
                          currentPage === pageNum
                            ? "bg-red-600 text-white"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Penalty Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title="Add New Penalty"
      >
        <form onSubmit={handleAddPenalty} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Member * ({members.length} members loaded)
            </label>
            <select
              name="member_id"
              value={formData.member_id}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Select Member</option>
              {members.map((member) => {
                return (
                  <option key={member.id} value={member.id}>
                    {member.member_name || "No name"}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount *
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Enter penalty amount"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                name="penalty_status"
                value={formData.penalty_status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason *
            </label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleInputChange}
              required
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Describe the reason for this penalty..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Optional additional notes..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowAddModal(false);
                resetForm();
              }}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Add Penalty
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Penalty Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingPenalty(null);
          resetForm();
        }}
        title="Edit Penalty"
      >
        <form onSubmit={handleUpdatePenalty} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Member * ({members.length} members loaded)
            </label>
            <select
              name="member_id"
              value={formData.member_id}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Select Member</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.member_name || "No name"}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount *
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Enter penalty amount"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                name="penalty_status"
                value={formData.penalty_status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason *
            </label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleInputChange}
              required
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Describe the reason for this penalty..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Optional additional notes..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowEditModal(false);
                setEditingPenalty(null);
                resetForm();
              }}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Update Penalty
            </button>
          </div>
        </form>
      </Modal>

      {/* View Penalty Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setViewingPenalty(null);
        }}
        title="Penalty Details"
      >
        {viewingPenalty && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Member
                </label>
                <p className="text-gray-900 font-medium">
                  {viewingPenalty.members?.member_name || "N/A"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <p className="text-red-600 font-semibold text-lg">
                  ₱{parseFloat(viewingPenalty.amount).toLocaleString()}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${getStatusColor(
                  viewingPenalty.penalty_status
                )}`}
              >
                {getStatusIcon(viewingPenalty.penalty_status)}
                {viewingPenalty.penalty_status?.charAt(0).toUpperCase() +
                  viewingPenalty.penalty_status?.slice(1)}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason
              </label>
              <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                {viewingPenalty.reason || "No reason provided"}
              </p>
            </div>

            {viewingPenalty.notes && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Notes
                </label>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                  {viewingPenalty.notes}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Created Date
                </label>
                <p className="text-gray-600">
                  {viewingPenalty.created_at
                    ? new Date(viewingPenalty.created_at).toLocaleString()
                    : "N/A"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Updated
                </label>
                <p className="text-gray-600">
                  {viewingPenalty.updated_at
                    ? new Date(viewingPenalty.updated_at).toLocaleString()
                    : "N/A"}
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowViewModal(false);
                  setViewingPenalty(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowViewModal(false);
                  handleEditPenalty(viewingPenalty);
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Edit Penalty
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setPenaltyToDelete(null);
        }}
        onConfirm={confirmAction}
        title="Delete Penalty"
        message={
          penaltyToDelete
            ? `Are you sure you want to delete the penalty for "${
                penaltyToDelete.members?.member_name
              }" in the amount of ₱${parseFloat(
                penaltyToDelete.amount
              ).toLocaleString()}? This action cannot be undone.`
            : ""
        }
        confirmText="Delete Penalty"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}

export default Penalty;
