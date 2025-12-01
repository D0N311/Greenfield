import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Heart,
  Plus,
  Search,
  Filter,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle,
  Edit,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  RotateCcw,
  Settings,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import Modal from "../components/Modal";
import Statistics from "../components/Statistics";

function Contribution() {
  const navigate = useNavigate();
  // State management
  const [contributions, setContributions] = useState([]);
  const [members, setMembers] = useState([]);
  const [contributionTypes, setContributionTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [editingContribution, setEditingContribution] = useState(null);

  // Filters and search
  const [searchTerm, setSearchTerm] = useState("");
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterMonth, setFilterMonth] = useState("");
  const [filterStatus, setFilterStatus] = useState(""); // all, paid, unpaid
  const [filterContributionType, setFilterContributionType] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  // Statistics
  const [stats, setStats] = useState({
    totalAmount: 0,
    yearlyAmount: 0,
    paidAmount: 0,
    unpaidAmount: 0,
    totalContributions: 0,
  });

  // Form data
  const [formData, setFormData] = useState({
    member_id: "",
    contribution_type_id: "",
    amount: 300,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    is_paid: false,
    paid_at: "",
    remarks: "",
  });

  // Generate form data
  const [generateFormData, setGenerateFormData] = useState({
    contribution_type_id: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  // Load data on component mount
  useEffect(() => {
    fetchMembers();
    fetchContributionTypes();
    fetchContributions();
    fetchStatistics();
  }, [filterYear, filterContributionType]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const fetchContributionTypes = async () => {
    try {
      const { data, error } = await supabase
        .from("contribution_types")
        .select("*")
        .eq("is_active", true)
        .order("type_name");

      if (error) throw error;
      setContributionTypes(data || []);
    } catch (error) {
      console.error("Error fetching contribution types:", error);
    }
  };

  const fetchContributions = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("contributions")
        .select(
          `
          *,
          members (
            id,
            member_name
          ),
          contribution_types (
            id,
            type_name,
            default_amount
          )
        `
        )
        .order("year", { ascending: false })
        .order("month", { ascending: false })
        .order("created_at", { ascending: false });

      if (filterYear) {
        query = query.eq("year", filterYear);
      }

      const { data, error } = await query;

      if (error) throw error;
      setContributions(data || []);
    } catch (error) {
      console.error("Error fetching contributions:", error);
      setStatus({
        type: "error",
        message: `Error loading contributions: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      // Build query for total contributions with optional type filter
      let totalQuery = supabase.from("contributions").select("amount");
      if (filterContributionType) {
        totalQuery = totalQuery.eq(
          "contribution_type_id",
          filterContributionType
        );
      }
      const { data: totalData, error: totalError } = await totalQuery;

      if (totalError) throw totalError;

      // Build query for yearly contributions with optional type filter
      let yearlyQuery = supabase
        .from("contributions")
        .select("amount, is_paid")
        .eq("year", filterYear);
      if (filterContributionType) {
        yearlyQuery = yearlyQuery.eq(
          "contribution_type_id",
          filterContributionType
        );
      }
      const { data: yearlyData, error: yearlyError } = await yearlyQuery;

      if (yearlyError) throw yearlyError;

      const totalAmount =
        totalData?.reduce(
          (sum, item) => sum + parseFloat(item.amount || 0),
          0
        ) || 0;
      const yearlyAmount =
        yearlyData?.reduce(
          (sum, item) => sum + parseFloat(item.amount || 0),
          0
        ) || 0;
      const paidAmount =
        yearlyData
          ?.filter((item) => item.is_paid)
          .reduce((sum, item) => sum + parseFloat(item.amount || 0), 0) || 0;
      const unpaidAmount =
        yearlyData
          ?.filter((item) => !item.is_paid)
          .reduce((sum, item) => sum + parseFloat(item.amount || 0), 0) || 0;

      setStats({
        totalAmount,
        yearlyAmount,
        paidAmount,
        unpaidAmount,
        totalContributions: totalData?.length || 0,
      });
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  };

  const generateMonthlyContributions = async (e) => {
    e.preventDefault();

    if (!generateFormData.contribution_type_id) {
      setStatus({
        type: "error",
        message: "Please select a contribution type.",
      });
      return;
    }

    try {
      // Get all active members
      const { data: activeMembers, error: membersError } = await supabase
        .from("members")
        .select("id")
        .is("deleted_at", null)
        .eq("status", "active");

      if (membersError) throw membersError;

      // Get the selected contribution type details
      const { data: contributionType, error: typeError } = await supabase
        .from("contribution_types")
        .select("default_amount")
        .eq("id", generateFormData.contribution_type_id)
        .single();

      if (typeError) throw typeError;

      // Check for existing contributions to avoid duplicates
      const { data: existingContributions, error: existingError } =
        await supabase
          .from("contributions")
          .select("member_id")
          .eq("month", generateFormData.month)
          .eq("year", generateFormData.year)
          .eq("contribution_type_id", generateFormData.contribution_type_id);

      if (existingError) throw existingError;

      const existingMemberIds = new Set(
        existingContributions.map((c) => c.member_id)
      );

      // Filter out members who already have contributions for this period and type
      const membersToGenerate = activeMembers.filter(
        (member) => !existingMemberIds.has(member.id)
      );

      if (membersToGenerate.length === 0) {
        setStatus({
          type: "error",
          message:
            "All active members already have contributions for the selected period and type.",
        });
        return;
      }

      // Generate contributions for remaining members
      const contributionsToInsert = membersToGenerate.map((member) => ({
        member_id: member.id,
        contribution_type_id: generateFormData.contribution_type_id,
        amount: contributionType.default_amount || 0,
        month: parseInt(generateFormData.month),
        year: parseInt(generateFormData.year),
        is_paid: false,
        paid_at: null,
        remarks: null,
      }));

      const { error: insertError } = await supabase
        .from("contributions")
        .insert(contributionsToInsert);

      if (insertError) throw insertError;

      setStatus({
        type: "success",
        message: `Generated ${membersToGenerate.length} contributions successfully!`,
      });

      setShowGenerateModal(false);
      resetGenerateForm();
      await fetchContributions();
      await fetchStatistics();

      setTimeout(() => setStatus(null), 3000);
    } catch (error) {
      console.error("Error generating contributions:", error);
      setStatus({
        type: "error",
        message: `Error generating contributions: ${error.message}`,
      });
    }
  };

  const handleAddContribution = async (e) => {
    e.preventDefault();
    try {
      const contributionData = {
        ...formData,
        paid_at: formData.is_paid && formData.paid_at ? formData.paid_at : null,
      };

      const { error } = await supabase
        .from("contributions")
        .insert([contributionData]);

      if (error) throw error;

      setStatus({
        type: "success",
        message: "Contribution added successfully!",
      });

      resetForm();
      setShowAddModal(false);
      await fetchContributions();
      await fetchStatistics();

      setTimeout(() => setStatus(null), 3000);
    } catch (error) {
      console.error("Error adding contribution:", error);
      setStatus({
        type: "error",
        message: `Error adding contribution: ${error.message}`,
      });
    }
  };

  const handleEditContribution = (contribution) => {
    setEditingContribution(contribution.id);
    setFormData({
      member_id: contribution.member_id,
      contribution_type_id: contribution.contribution_type_id || "",
      amount: contribution.amount,
      month: contribution.month,
      year: contribution.year,
      is_paid: contribution.is_paid,
      paid_at: contribution.paid_at ? contribution.paid_at.split("T")[0] : "",
      remarks: contribution.remarks || "",
    });
    setShowEditModal(true);
  };

  const handleUpdateContribution = async (e) => {
    e.preventDefault();
    try {
      const contributionData = {
        ...formData,
        paid_at: formData.is_paid && formData.paid_at ? formData.paid_at : null,
      };

      const { error } = await supabase
        .from("contributions")
        .update(contributionData)
        .eq("id", editingContribution);

      if (error) throw error;

      setStatus({
        type: "success",
        message: "Contribution updated successfully!",
      });

      resetForm();
      setShowEditModal(false);
      setEditingContribution(null);
      await fetchContributions();
      await fetchStatistics();

      setTimeout(() => setStatus(null), 3000);
    } catch (error) {
      console.error("Error updating contribution:", error);
      setStatus({
        type: "error",
        message: `Error updating contribution: ${error.message}`,
      });
    }
  };

  const togglePaymentStatus = async (contribution) => {
    try {
      const newPaidStatus = !contribution.is_paid;
      const updateData = {
        is_paid: newPaidStatus,
        paid_at: newPaidStatus ? new Date().toISOString() : null,
      };

      const { error } = await supabase
        .from("contributions")
        .update(updateData)
        .eq("id", contribution.id);

      if (error) throw error;

      setStatus({
        type: "success",
        message: `Payment status ${
          newPaidStatus ? "marked as paid" : "marked as unpaid"
        }!`,
      });

      await fetchContributions();
      await fetchStatistics();

      setTimeout(() => setStatus(null), 2000);
    } catch (error) {
      console.error("Error updating payment status:", error);
      setStatus({
        type: "error",
        message: `Error updating payment status: ${error.message}`,
      });
    }
  };

  const resetForm = () => {
    setFormData({
      member_id: "",
      contribution_type_id: "",
      amount: 300,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      is_paid: false,
      paid_at: "",
      remarks: "",
    });
  };

  const resetGenerateForm = () => {
    setGenerateFormData({
      contribution_type_id: "",
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
    });
  };

  const handleGenerateInputChange = (e) => {
    const { name, value } = e.target;
    setGenerateFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Auto-fill amount when contribution type changes
    if (name === "contribution_type_id" && value) {
      const selectedType = contributionTypes.find((type) => type.id === value);
      if (selectedType && selectedType.default_amount) {
        setFormData((prev) => ({
          ...prev,
          [name]: value,
          amount: selectedType.default_amount,
        }));
        return;
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Filter contributions based on search and filters
  const filteredContributions = contributions.filter((contribution) => {
    const memberName = contribution.members?.member_name?.toLowerCase() || "";
    const matchesSearch = memberName.includes(searchTerm.toLowerCase());
    const matchesMonth =
      !filterMonth || contribution.month === parseInt(filterMonth);
    const matchesStatus =
      !filterStatus ||
      (filterStatus === "paid" && contribution.is_paid) ||
      (filterStatus === "unpaid" && !contribution.is_paid);
    const matchesContributionType =
      !filterContributionType ||
      contribution.contribution_type_id === filterContributionType;

    return (
      matchesSearch && matchesMonth && matchesStatus && matchesContributionType
    );
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredContributions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentContributions = filteredContributions.slice(
    startIndex,
    endIndex
  );

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const getMonthName = (month) => {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return months[month - 1] || "";
  };

  return (
    <div className="glass-panel rounded-2xl p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-green-600" />
          <h1 className="text-2xl md:text-3xl font-bold text-black">
            Contributions
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            <span>Add Contribution</span>
          </button>
          <button
            onClick={() => navigate("/dashboard/contribution-types")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all text-sm font-medium"
          >
            <Settings className="h-4 w-4" />
            <span>Contribution Types</span>
          </button>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all text-sm font-medium"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Generate Contributions</span>
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-700 mb-4">
        Track and manage monthly member contributions to community projects and
        initiatives.
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
            title: filterContributionType
              ? `${
                  contributionTypes.find((t) => t.id === filterContributionType)
                    ?.type_name || "Selected Type"
                } - All Time`
              : "Total All Time",
            value: `₱${stats.totalAmount.toLocaleString()}`,
            subtitle: `${stats.totalContributions} contributions`,
          },
          {
            title: filterContributionType
              ? `${
                  contributionTypes.find((t) => t.id === filterContributionType)
                    ?.type_name || "Selected Type"
                } - ${filterYear}`
              : `${filterYear} Total`,
            value: `₱${stats.yearlyAmount.toLocaleString()}`,
          },
          {
            title: filterContributionType
              ? `${
                  contributionTypes.find((t) => t.id === filterContributionType)
                    ?.type_name || "Selected Type"
                } - Paid ${filterYear}`
              : `Paid This Year`,
            value: `₱${stats.paidAmount.toLocaleString()}`,
          },
          {
            title: filterContributionType
              ? `${
                  contributionTypes.find((t) => t.id === filterContributionType)
                    ?.type_name || "Selected Type"
                } - Unpaid ${filterYear}`
              : `Unpaid This Year`,
            value: `₱${stats.unpaidAmount.toLocaleString()}`,
          },
        ]}
      />

      {/* Filters */}
      <div className="glass-panel rounded-xl p-4 mt-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search members..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            />
          </div>

          <select
            value={filterYear}
            onChange={(e) => setFilterYear(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {[2023, 2024, 2025, 2026, 2027].map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Months</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {getMonthName(i + 1)}
              </option>
            ))}
          </select>

          <select
            value={filterContributionType}
            onChange={(e) => setFilterContributionType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            {contributionTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.type_name}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
          </select>
        </div>
      </div>

      {/* Contributions Table */}
      <div className="glass-panel rounded-xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold text-black">
            Contributions List
          </h3>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-600">
            Loading contributions...
          </div>
        ) : filteredContributions.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            No contributions found. Add some contributions to get started!
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
                      Month/Year
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-700">
                      Type
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-700">
                      Amount
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-700">
                      Paid Date
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentContributions.map((contribution, index) => (
                    <tr
                      key={contribution.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="p-3 text-gray-600 font-medium">
                        {startIndex + index + 1}
                      </td>
                      <td className="p-3">
                        <span className="font-medium text-gray-900">
                          {contribution.members?.member_name || "N/A"}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-gray-700">
                          {getMonthName(contribution.month)} {contribution.year}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-sm px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                          {contribution.contribution_types?.type_name || "N/A"}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-gray-900">
                          ₱{parseFloat(contribution.amount).toLocaleString()}
                        </span>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => togglePaymentStatus(contribution)}
                          className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 transition-colors ${
                            contribution.is_paid
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : "bg-red-100 text-red-700 hover:bg-red-200"
                          }`}
                        >
                          {contribution.is_paid ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <Clock className="h-3 w-3" />
                          )}
                          {contribution.is_paid ? "Paid" : "Unpaid"}
                        </button>
                      </td>
                      <td className="p-3">
                        <span className="text-gray-700">
                          {contribution.paid_at
                            ? new Date(
                                contribution.paid_at
                              ).toLocaleDateString()
                            : "-"}
                        </span>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => handleEditContribution(contribution)}
                          className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
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
                  {Math.min(endIndex, filteredContributions.length)} of{" "}
                  {filteredContributions.length} contributions
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

      {/* Add Contribution Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title="Add New Contribution"
      >
        <form onSubmit={handleAddContribution} className="space-y-4">
          <div className="col-span-2">
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

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contribution Type *
            </label>
            <select
              name="contribution_type_id"
              value={formData.contribution_type_id}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Contribution Type</option>
              {contributionTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.type_name}{" "}
                  {type.default_amount &&
                    `(₱${parseFloat(type.default_amount).toLocaleString()})`}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Month *
              </label>
              <select
                name="month"
                value={formData.month}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {getMonthName(i + 1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year *
              </label>
              <select
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[2023, 2024, 2025, 2026, 2027].map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-7">
              <input
                type="checkbox"
                name="is_paid"
                id="is_paid"
                checked={formData.is_paid}
                onChange={handleInputChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label
                htmlFor="is_paid"
                className="text-sm font-medium text-gray-700"
              >
                Mark as Paid
              </label>
            </div>

            {formData.is_paid && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Paid Date
                </label>
                <input
                  type="date"
                  name="paid_at"
                  value={formData.paid_at}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div className={formData.is_paid ? "" : "col-span-2"}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Remarks
              </label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional notes or comments..."
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
              Add Contribution
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Contribution Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingContribution(null);
          resetForm();
        }}
        title="Edit Contribution"
      >
        <form onSubmit={handleUpdateContribution} className="space-y-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Member *
            </label>
            <input
              type="text"
              value={
                members.find((m) => m.id === formData.member_id)?.member_name ||
                ""
              }
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contribution Type *
            </label>
            <input
              type="text"
              value={
                contributionTypes.find(
                  (t) => t.id === formData.contribution_type_id
                )?.type_name || ""
              }
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Month *
              </label>
              <select
                name="month"
                value={formData.month}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {getMonthName(i + 1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year *
              </label>
              <select
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[2023, 2024, 2025, 2026, 2027].map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-7">
              <input
                type="checkbox"
                name="is_paid"
                id="is_paid_edit"
                checked={formData.is_paid}
                onChange={handleInputChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label
                htmlFor="is_paid_edit"
                className="text-sm font-medium text-gray-700"
              >
                Mark as Paid
              </label>
            </div>

            {formData.is_paid && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Paid Date
                </label>
                <input
                  type="date"
                  name="paid_at"
                  value={formData.paid_at}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div className={formData.is_paid ? "" : "col-span-2"}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Remarks
              </label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional notes or comments..."
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowEditModal(false);
                setEditingContribution(null);
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
              Update Contribution
            </button>
          </div>
        </form>
      </Modal>

      {/* Generate Contributions Modal */}
      <Modal
        isOpen={showGenerateModal}
        onClose={() => {
          setShowGenerateModal(false);
          resetGenerateForm();
        }}
        title="Generate Contributions"
      >
        <form onSubmit={generateMonthlyContributions} className="space-y-4">
          <p className="text-sm text-gray-600 mb-4">
            Generate contributions for all active members who don't already have
            an entry for the selected period and type.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contribution Type *
            </label>
            <select
              name="contribution_type_id"
              value={generateFormData.contribution_type_id}
              onChange={handleGenerateInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Select Contribution Type</option>
              {contributionTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.type_name}{" "}
                  {type.default_amount &&
                    `(₱${parseFloat(type.default_amount).toLocaleString()})`}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Month *
              </label>
              <select
                name="month"
                value={generateFormData.month}
                onChange={handleGenerateInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {getMonthName(i + 1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year *
              </label>
              <select
                name="year"
                value={generateFormData.year}
                onChange={handleGenerateInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {[2023, 2024, 2025, 2026, 2027].map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Generation Rules:</p>
                <ul className="list-disc list-inside space-y-0.5 text-xs">
                  <li>Only active members will be included</li>
                  <li>
                    Members with existing contributions for the selected period
                    and type will be skipped
                  </li>
                  <li>
                    Default amount from the contribution type will be used
                  </li>
                  <li>All contributions will be marked as unpaid initially</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowGenerateModal(false);
                resetGenerateForm();
              }}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Generate Contributions
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Contribution;
