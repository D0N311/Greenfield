import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Settings,
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import Modal from "../components/Modal";
import ConfirmationModal from "../components/ConfirmationModal";
import { useAuth } from "../hooks/useAuth";

function ContributionTypes() {
  const navigate = useNavigate();
  const { role } = useAuth();

  // State management
  const [contributionTypes, setContributionTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingType, setEditingType] = useState(null);

  // Search and pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Form data
  const [formData, setFormData] = useState({
    type_name: "",
    description: "",
    default_amount: 0,
    is_active: true,
  });

  // Confirmation modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [typeToDelete, setTypeToDelete] = useState(null);

  // Statistics
  const [stats, setStats] = useState({
    totalTypes: 0,
    activeTypes: 0,
    inactiveTypes: 0,
  });

  // Load data on component mount
  useEffect(() => {
    fetchContributionTypes();
    fetchStatistics();
  }, []);

  const fetchContributionTypes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("contribution_types")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setContributionTypes(data || []);
    } catch (error) {
      console.error("Error fetching contribution types:", error);
      setStatus({
        type: "error",
        message: `Error loading contribution types: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const { data, error } = await supabase
        .from("contribution_types")
        .select("is_active");

      if (error) throw error;

      const totalTypes = data?.length || 0;
      const activeTypes = data?.filter((type) => type.is_active).length || 0;
      const inactiveTypes = totalTypes - activeTypes;

      setStats({
        totalTypes,
        activeTypes,
        inactiveTypes,
      });
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  };

  const handleAddType = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from("contribution_types")
        .insert([formData]);

      if (error) throw error;

      setStatus({
        type: "success",
        message: "Contribution type added successfully!",
      });

      resetForm();
      setShowAddModal(false);
      await fetchContributionTypes();
      await fetchStatistics();

      setTimeout(() => setStatus(null), 3000);
    } catch (error) {
      console.error("Error adding contribution type:", error);
      setStatus({
        type: "error",
        message: `Error adding contribution type: ${error.message}`,
      });
    }
  };

  const handleEditType = (type) => {
    setEditingType(type.id);
    setFormData({
      type_name: type.type_name,
      description: type.description || "",
      default_amount: type.default_amount || 0,
      is_active: type.is_active,
    });
    setShowEditModal(true);
  };

  const handleUpdateType = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from("contribution_types")
        .update(formData)
        .eq("id", editingType);

      if (error) throw error;

      setStatus({
        type: "success",
        message: "Contribution type updated successfully!",
      });

      resetForm();
      setShowEditModal(false);
      setEditingType(null);
      await fetchContributionTypes();
      await fetchStatistics();

      setTimeout(() => setStatus(null), 3000);
    } catch (error) {
      console.error("Error updating contribution type:", error);
      setStatus({
        type: "error",
        message: `Error updating contribution type: ${error.message}`,
      });
    }
  };

  const handleDeleteType = async (type) => {
    // First, check if this contribution type is being used in any contributions
    try {
      const { data: existingContributions, error: checkError } = await supabase
        .from("contributions")
        .select("id")
        .eq("contribution_type_id", type.id)
        .limit(1);

      if (checkError) throw checkError;

      if (existingContributions && existingContributions.length > 0) {
        setStatus({
          type: "error",
          message: `Cannot delete "${type.type_name}" because it is currently being used by existing contributions. Please remove or reassign all contributions using this type before deleting it.`,
        });
        setTimeout(() => setStatus(null), 5000);
        return;
      }

      // If no contributions are using this type, proceed with deletion confirmation
      setTypeToDelete(type);
      setConfirmAction(() => async () => {
        try {
          const { error } = await supabase
            .from("contribution_types")
            .delete()
            .eq("id", type.id);

          if (error) throw error;

          setStatus({
            type: "success",
            message: "Contribution type deleted successfully!",
          });

          await fetchContributionTypes();
          await fetchStatistics();
          setShowConfirmModal(false);
          setTypeToDelete(null);

          setTimeout(() => setStatus(null), 3000);
        } catch (error) {
          console.error("Error deleting contribution type:", error);
          setStatus({
            type: "error",
            message: `Error deleting contribution type: ${error.message}`,
          });
          setShowConfirmModal(false);
          setTypeToDelete(null);
        }
      });
      setShowConfirmModal(true);
    } catch (error) {
      console.error("Error checking contribution usage:", error);
      setStatus({
        type: "error",
        message: `Error checking if contribution type is in use: ${error.message}`,
      });
      setTimeout(() => setStatus(null), 5000);
    }
  };

  const toggleActiveStatus = async (type) => {
    try {
      const { error } = await supabase
        .from("contribution_types")
        .update({ is_active: !type.is_active })
        .eq("id", type.id);

      if (error) throw error;

      setStatus({
        type: "success",
        message: `Contribution type ${
          !type.is_active ? "activated" : "deactivated"
        } successfully!`,
      });

      await fetchContributionTypes();
      await fetchStatistics();

      setTimeout(() => setStatus(null), 2000);
    } catch (error) {
      console.error("Error updating status:", error);
      setStatus({
        type: "error",
        message: `Error updating status: ${error.message}`,
      });
    }
  };

  const resetForm = () => {
    setFormData({
      type_name: "",
      description: "",
      default_amount: 0,
      is_active: true,
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Filter types based on search
  const filteredTypes = contributionTypes.filter((type) =>
    type.type_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination calculations
  const totalPages = Math.ceil(filteredTypes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTypes = filteredTypes.slice(startIndex, endIndex);

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
          <button
            onClick={() => navigate("/dashboard/contribution")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Back to Contributions"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <Settings className="h-5 w-5 text-purple-600" />
          <h1 className="text-2xl md:text-3xl font-bold text-black">
            Contribution Types
          </h1>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          <span>Add Type</span>
        </button>
      </div>

      <p className="text-sm text-gray-700 mb-4">
        Manage different types of contributions and their default amounts.
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="glass-panel rounded-xl p-4 text-center">
          <div className="text-2xl md:text-3xl font-bold text-purple-600 mb-2">
            {stats.totalTypes}
          </div>
          <div className="text-sm font-medium text-gray-700">Total Types</div>
        </div>
        <div className="glass-panel rounded-xl p-4 text-center">
          <div className="text-2xl md:text-3xl font-bold text-green-600 mb-2">
            {stats.activeTypes}
          </div>
          <div className="text-sm font-medium text-gray-700">Active Types</div>
        </div>
        <div className="glass-panel rounded-xl p-4 text-center">
          <div className="text-2xl md:text-3xl font-bold text-gray-600 mb-2">
            {stats.inactiveTypes}
          </div>
          <div className="text-sm font-medium text-gray-700">
            Inactive Types
          </div>
        </div>
      </div>

      {/* Contribution Types Table */}
      <div className="glass-panel rounded-xl p-4 mt-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold text-black">
            Contribution Types List
          </h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search types..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 w-full sm:w-64"
            />
          </div>
        </div>

        {searchTerm && (
          <div className="mb-3 text-sm text-gray-600">
            Showing {filteredTypes.length} result(s) for "{searchTerm}"
          </div>
        )}

        {loading ? (
          <div className="text-center py-8 text-gray-600">
            Loading contribution types...
          </div>
        ) : filteredTypes.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            {searchTerm
              ? `No contribution types found matching "${searchTerm}"`
              : "No contribution types found. Add some types to get started!"}
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
                      Type Name
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-700">
                      Description
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-700">
                      Default Amount
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentTypes.map((type, index) => (
                    <tr
                      key={type.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="p-3 text-gray-600 font-medium">
                        {startIndex + index + 1}
                      </td>
                      <td className="p-3">
                        <span className="font-medium text-gray-900">
                          {type.type_name}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-gray-700">
                          {type.description || "-"}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-gray-900">
                          ₱
                          {parseFloat(
                            type.default_amount || 0
                          ).toLocaleString()}
                        </span>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => toggleActiveStatus(type)}
                          className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 transition-colors ${
                            type.is_active
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {type.is_active ? (
                            <Eye className="h-3 w-3" />
                          ) : (
                            <EyeOff className="h-3 w-3" />
                          )}
                          {type.is_active ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditType(type)}
                            className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          {role === "Admin" && (
                            <button
                              onClick={() => handleDeleteType(type)}
                              className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
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
                  {Math.min(endIndex, filteredTypes.length)} of{" "}
                  {filteredTypes.length} contribution types
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
                            ? "bg-purple-600 text-white"
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

      {/* Add Type Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title="Add New Contribution Type"
      >
        <form onSubmit={handleAddType} className="space-y-4">
          {/* 2-column layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type Name *
              </label>
              <input
                type="text"
                name="type_name"
                value={formData.type_name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="e.g., Monthly Contribution"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default Amount (₱)
              </label>
              <input
                type="number"
                name="default_amount"
                value={formData.default_amount}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Optional description of this contribution type..."
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="is_active"
              id="is_active"
              checked={formData.is_active}
              onChange={handleInputChange}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <label
              htmlFor="is_active"
              className="text-sm font-medium text-gray-700"
            >
              Active (available for selection)
            </label>
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
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Add Type
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Type Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingType(null);
          resetForm();
        }}
        title="Edit Contribution Type"
      >
        <form onSubmit={handleUpdateType} className="space-y-4">
          {/* 2-column layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type Name *
              </label>
              <input
                type="text"
                name="type_name"
                value={formData.type_name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="e.g., Monthly Contribution"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default Amount (₱)
              </label>
              <input
                type="number"
                name="default_amount"
                value={formData.default_amount}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Optional description of this contribution type..."
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="is_active"
              id="is_active_edit"
              checked={formData.is_active}
              onChange={handleInputChange}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <label
              htmlFor="is_active_edit"
              className="text-sm font-medium text-gray-700"
            >
              Active (available for selection)
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowEditModal(false);
                setEditingType(null);
                resetForm();
              }}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Update Type
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setTypeToDelete(null);
        }}
        onConfirm={confirmAction}
        title="Delete Contribution Type"
        message={
          typeToDelete
            ? `Are you sure you want to delete "${typeToDelete.type_name}"? This action cannot be undone and will permanently remove this contribution type and affect any associated contributions.`
            : ""
        }
        confirmText="Delete Type"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}

export default ContributionTypes;
