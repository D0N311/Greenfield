import { useState, useEffect } from "react";
import {
  Home,
  Plus,
  Search,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  MapPin,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import Modal from "../components/Modal";
import Statistics from "../components/Statistics";
import ConfirmationModal from "../components/ConfirmationModal";

function Lots() {
  // State management
  const [lots, setLots] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLot, setEditingLot] = useState(null);

  // Filters and search
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState(""); // all, active, released
  const [filterMember, setFilterMember] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  // Statistics
  const [stats, setStats] = useState({
    totalLots: 0,
    activeLots: 0,
    releasedLots: 0,
    ownedMembers: 0,
  });

  // Form data
  const [formData, setFormData] = useState({
    member_id: "",
    block_no: "",
    lot_no: "",
    size_sqm: "",
    property_price: "",
    balance: "",
    acquired_at: new Date().toISOString().split("T")[0],
  });

  // Confirmation modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [lotToDelete, setLotToDelete] = useState(null);

  // Load data on component mount
  useEffect(() => {
    fetchMembers();
    fetchLots();
    fetchStatistics();
  }, []);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from("members")
        .select("id, member_name")
        .is("deleted_at", null)
        .eq("status", "active")
        .order("member_name");

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error("Error fetching members:", error);
    }
  };

  const fetchLots = async () => {
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
        .order("block_no")
        .order("lot_no");

      if (error) throw error;
      setLots(data || []);
    } catch (error) {
      console.error("Error fetching lots:", error);
      setStatus({
        type: "error",
        message: `Error loading lots: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const { data: allLots, error: lotsError } = await supabase
        .from("lots")
        .select("is_active, member_id");

      if (lotsError) throw lotsError;

      const totalLots = allLots?.length || 0;
      const activeLots = allLots?.filter((lot) => lot.is_active).length || 0;
      const releasedLots = totalLots - activeLots;
      const ownedMembers = new Set(
        allLots?.filter((lot) => lot.is_active).map((lot) => lot.member_id)
      ).size;

      setStats({
        totalLots,
        activeLots,
        releasedLots,
        ownedMembers,
      });
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  };

  const handleAddLot = async (e) => {
    e.preventDefault();
    try {
      const lotData = {
        ...formData,
        size_sqm: formData.size_sqm ? parseFloat(formData.size_sqm) : null,
        property_price: formData.property_price
          ? parseFloat(formData.property_price)
          : 0,
        balance: formData.balance
          ? parseFloat(formData.balance)
          : formData.property_price
          ? parseFloat(formData.property_price)
          : 0,
        is_active: true,
      };

      const { error } = await supabase.from("lots").insert([lotData]);

      if (error) throw error;

      setStatus({
        type: "success",
        message: "Lot added successfully!",
      });

      resetForm();
      setShowAddModal(false);
      await fetchLots();
      await fetchStatistics();

      setTimeout(() => setStatus(null), 3000);
    } catch (error) {
      console.error("Error adding lot:", error);
      setStatus({
        type: "error",
        message: `Error adding lot: ${error.message}`,
      });
    }
  };

  const handleEditLot = (lot) => {
    setEditingLot(lot.id);
    setFormData({
      member_id: lot.member_id,
      block_no: lot.block_no,
      lot_no: lot.lot_no,
      size_sqm: lot.size_sqm || "",
      property_price: lot.property_price || "",
      balance: lot.balance || "",
      acquired_at: lot.acquired_at ? lot.acquired_at.split("T")[0] : "",
    });
    setShowEditModal(true);
  };

  const handleUpdateLot = async (e) => {
    e.preventDefault();
    try {
      const lotData = {
        ...formData,
        size_sqm: formData.size_sqm ? parseFloat(formData.size_sqm) : null,
        property_price: formData.property_price
          ? parseFloat(formData.property_price)
          : 0,
        balance: formData.balance ? parseFloat(formData.balance) : 0,
      };

      const { error } = await supabase
        .from("lots")
        .update(lotData)
        .eq("id", editingLot);

      if (error) throw error;

      setStatus({
        type: "success",
        message: "Lot updated successfully!",
      });

      resetForm();
      setShowEditModal(false);
      setEditingLot(null);
      await fetchLots();
      await fetchStatistics();

      setTimeout(() => setStatus(null), 3000);
    } catch (error) {
      console.error("Error updating lot:", error);
      setStatus({
        type: "error",
        message: `Error updating lot: ${error.message}`,
      });
    }
  };

  const toggleLotStatus = async (lot) => {
    try {
      const newStatus = !lot.is_active;
      const updateData = {
        is_active: newStatus,
        released_at: newStatus ? null : new Date().toISOString(),
      };

      const { error } = await supabase
        .from("lots")
        .update(updateData)
        .eq("id", lot.id);

      if (error) throw error;

      setStatus({
        type: "success",
        message: `Lot ${newStatus ? "activated" : "released"} successfully!`,
      });

      await fetchLots();
      await fetchStatistics();

      setTimeout(() => setStatus(null), 2000);
    } catch (error) {
      console.error("Error updating lot status:", error);
      setStatus({
        type: "error",
        message: `Error updating lot status: ${error.message}`,
      });
    }
  };

  const handleDeleteLot = (lot) => {
    setLotToDelete(lot);
    setConfirmAction(() => async () => {
      try {
        const { error } = await supabase.from("lots").delete().eq("id", lot.id);

        if (error) throw error;

        setStatus({
          type: "success",
          message: "Lot deleted successfully!",
        });

        await fetchLots();
        await fetchStatistics();
        setShowConfirmModal(false);
        setLotToDelete(null);

        setTimeout(() => setStatus(null), 3000);
      } catch (error) {
        console.error("Error deleting lot:", error);
        setStatus({
          type: "error",
          message: `Error deleting lot: ${error.message}`,
        });
        setShowConfirmModal(false);
        setLotToDelete(null);
      }
    });
    setShowConfirmModal(true);
  };

  const resetForm = () => {
    setFormData({
      member_id: "",
      block_no: "",
      lot_no: "",
      size_sqm: "",
      property_price: "",
      balance: "",
      acquired_at: new Date().toISOString().split("T")[0],
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Filter lots based on search and filters
  const filteredLots = lots.filter((lot) => {
    const memberName = lot.members?.member_name?.toLowerCase() || "";
    const blockLot = `${lot.block_no}-${lot.lot_no}`.toLowerCase();
    const matchesSearch =
      memberName.includes(searchTerm.toLowerCase()) ||
      blockLot.includes(searchTerm.toLowerCase());

    const matchesStatus =
      !filterStatus ||
      (filterStatus === "active" && lot.is_active) ||
      (filterStatus === "released" && !lot.is_active);

    const matchesMember = !filterMember || lot.member_id === filterMember;

    return matchesSearch && matchesStatus && matchesMember;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredLots.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLots = filteredLots.slice(startIndex, endIndex);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="glass-panel rounded-2xl p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Home className="h-5 w-5 text-green-600" />
          <h1 className="text-2xl md:text-3xl font-bold text-black">
            Lot Management
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            <span>Assign Lot</span>
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-700 mb-4">
        Manage lot assignments and track member property ownership within the
        community.
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
            title: "Total Lots",
            value: stats.totalLots,
            subtitle: "All registered lots",
          },
          {
            title: "Active Lots",
            value: stats.activeLots,
            subtitle: "Currently owned",
          },
          {
            title: "Released Lots",
            value: stats.releasedLots,
            subtitle: "Available or sold",
          },
          {
            title: "Members with Lots",
            value: stats.ownedMembers,
            subtitle: "Property owners",
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
              placeholder="Search by member or lot (Block-Lot)..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            />
          </div>

          <select
            value={filterMember}
            onChange={(e) => setFilterMember(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="released">Released</option>
          </select>
        </div>
      </div>

      {/* Lots Table */}
      <div className="glass-panel rounded-xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold text-black">Lots List</h3>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-600">Loading lots...</div>
        ) : filteredLots.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            No lots found. Start by assigning lots to members!
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
                      Block-Lot
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-700">
                      Owner
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-700">
                      Size (sqm)
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-700">
                      Property Price
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-700">
                      Balance
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-700">
                      Acquired Date
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentLots.map((lot, index) => (
                    <tr
                      key={lot.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="p-3 text-gray-600 font-medium">
                        {startIndex + index + 1}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-gray-400" />
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
                        <span className="text-gray-700">
                          {lot.size_sqm
                            ? `${parseFloat(lot.size_sqm).toLocaleString()}`
                            : "N/A"}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-green-600">
                          ₱
                          {lot.property_price
                            ? parseFloat(lot.property_price).toLocaleString()
                            : "0"}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`font-semibold ${
                            parseFloat(lot.balance || 0) > 0
                              ? "text-red-600"
                              : "text-green-600"
                          }`}
                        >
                          ₱
                          {lot.balance
                            ? parseFloat(lot.balance).toLocaleString()
                            : "0"}
                        </span>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => toggleLotStatus(lot)}
                          className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 transition-colors ${
                            lot.is_active
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {lot.is_active ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <Clock className="h-3 w-3" />
                          )}
                          {lot.is_active ? "Active" : "Released"}
                        </button>
                      </td>
                      <td className="p-3">
                        <span className="text-gray-700">
                          {lot.acquired_at
                            ? new Date(lot.acquired_at).toLocaleDateString()
                            : "-"}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEditLot(lot)}
                            className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteLot(lot)}
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
                  {Math.min(endIndex, filteredLots.length)} of{" "}
                  {filteredLots.length} lots
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
                            ? "bg-blue-600 text-white"
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

      {/* Add Lot Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title="Assign New Lot"
      >
        <form onSubmit={handleAddLot} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Member *
            </label>
            <select
              name="member_id"
              value={formData.member_id}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Member</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.member_name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Block # *
              </label>
              <input
                type="text"
                name="block_no"
                value={formData.block_no}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., A, B, C, 1, 2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lot # *
              </label>
              <input
                type="text"
                name="lot_no"
                value={formData.lot_no}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 1, 2, 3"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Property Price *
              </label>
              <input
                type="number"
                name="property_price"
                value={formData.property_price}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 150000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Balance
              </label>
              <input
                type="number"
                name="balance"
                value={formData.balance}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Leave empty to use property price"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Size (sqm)
              </label>
              <input
                type="number"
                name="size_sqm"
                value={formData.size_sqm}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Acquired Date *
              </label>
              <input
                type="date"
                name="acquired_at"
                value={formData.acquired_at}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
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
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Assign Lot
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Lot Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingLot(null);
          resetForm();
        }}
        title="Edit Lot Assignment"
      >
        <form onSubmit={handleUpdateLot} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Member *
            </label>
            <select
              name="member_id"
              value={formData.member_id}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Member</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.member_name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Block # *
              </label>
              <input
                type="text"
                name="block_no"
                value={formData.block_no}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., A, B, C, 1, 2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lot # *
              </label>
              <input
                type="text"
                name="lot_no"
                value={formData.lot_no}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 1, 2, 3"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Property Price *
              </label>
              <input
                type="number"
                name="property_price"
                value={formData.property_price}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 150000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Balance *
              </label>
              <input
                type="number"
                name="balance"
                value={formData.balance}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Outstanding amount"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Size (sqm)
              </label>
              <input
                type="number"
                name="size_sqm"
                value={formData.size_sqm}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Acquired Date *
              </label>
              <input
                type="date"
                name="acquired_at"
                value={formData.acquired_at}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowEditModal(false);
                setEditingLot(null);
                resetForm();
              }}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Update Lot
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setLotToDelete(null);
        }}
        onConfirm={confirmAction}
        title="Delete Lot"
        message={
          lotToDelete
            ? `Are you sure you want to delete lot ${lotToDelete.block_no}-${lotToDelete.lot_no}? This action cannot be undone and will permanently remove all associated data.`
            : ""
        }
        confirmText="Delete Lot"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}

export default Lots;
