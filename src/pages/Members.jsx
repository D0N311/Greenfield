import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Users,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  Trash,
  User,
} from "lucide-react";
import Papa from "papaparse";
import { supabase } from "../lib/supabase";
import Modal from "../components/Modal";
import Statistics from "../components/Statistics";
import { useAuth } from "../hooks/useAuth";
import ConfirmationModal from "../components/ConfirmationModal";

function Members() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const [totalMembers, setTotalMembers] = useState(0);
  const [activeMembers, setActiveMembers] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    member_name: "",
    birthday: "",
    contact_num: "",
    status: "active",
    gender: "",
    citizenship: "",
    civil_status: "",
  });

  // Confirmation modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [memberToDelete, setMemberToDelete] = useState(null);

  // Fetch member statistics and members list
  useEffect(() => {
    fetchMemberStats();
    fetchMembers();
  }, []);

  const fetchMemberStats = async () => {
    try {
      const { data: allMembers, error: allError } = await supabase
        .from("members")
        .select("id, status, created_at")
        .is("deleted_at", null);

      if (allError) throw allError;

      const total = allMembers?.length || 0;
      const active =
        allMembers?.filter((m) => m.status === "active").length || 0;

      setTotalMembers(total);
      setActiveMembers(active);
    } catch (error) {
      console.error("Error fetching member stats:", error);
    }
  };

  const fetchMembers = async () => {
    setLoading(true);
    try {
      // Fetch members with their active lots
      const { data: membersData, error: membersError } = await supabase
        .from("members")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (membersError) throw membersError;

      // Fetch all active lots
      const { data: lotsData, error: lotsError } = await supabase
        .from("lots")
        .select("member_id, block_no, lot_no")
        .eq("is_active", true)
        .order("block_no")
        .order("lot_no");

      if (lotsError) throw lotsError;

      // Group lots by member_id
      const lotsByMember = (lotsData || []).reduce((acc, lot) => {
        if (!acc[lot.member_id]) acc[lot.member_id] = [];
        acc[lot.member_id].push(`${lot.block_no}-${lot.lot_no}`);
        return acc;
      }, {});

      // Add lots information to members
      const membersWithLots = (membersData || []).map((member) => ({
        ...member,
        lots: lotsByMember[member.id] || [],
      }));

      setMembers(membersWithLots);
    } catch (error) {
      console.error("Error fetching members:", error);
      setImportStatus({
        type: "error",
        message: `Error loading members: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      setImportStatus({
        type: "error",
        message: "Please upload a CSV file.",
      });
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setImportStatus({
            type: "error",
            message: `CSV parsing error: ${results.errors[0].message}`,
          });
          return;
        }

        const parsedData = results.data;
        if (parsedData.length === 0) {
          setImportStatus({
            type: "error",
            message: "CSV file is empty or has no valid data.",
          });
          return;
        }

        // Map CSV data to database format
        const mappedData = parsedData.map((row) => {
          // Normalize status: "Active" -> "active", "Inactive" -> "inactive"
          let status = row.Status?.toLowerCase().trim();
          if (status === "active") status = "active";
          else if (status === "inactive") status = "inactive";
          else status = "active"; // default

          return {
            member_name: row["Member Name"]?.trim() || "",
            gender: row.Gender?.trim() || null,
            citizenship: row.Citizenship?.trim() || null,
            civil_status: row["Civil Status"]?.trim() || null,
            contact_num: row["Contact Num"]?.trim() || null,
            birthday: row.Birthday?.trim() || null,
            status: status,
          };
        });

        // Filter out rows with empty member_name
        const validData = mappedData.filter((row) => row.member_name);

        if (validData.length === 0) {
          setImportStatus({
            type: "error",
            message:
              "No valid member data found. Please ensure 'Member Name' column has data.",
          });
          return;
        }

        setPreviewData(validData);
        setShowPreview(true);
        setImportStatus(null);
      },
      error: (error) => {
        setImportStatus({
          type: "error",
          message: `Error reading file: ${error.message}`,
        });
      },
    });

    // Reset file input
    event.target.value = "";
  };

  const handleImport = async () => {
    if (previewData.length === 0) return;

    setIsImporting(true);
    setImportStatus(null);

    try {
      const { data, error } = await supabase
        .from("members")
        .insert(previewData)
        .select();

      if (error) throw error;

      setImportStatus({
        type: "success",
        message: `Successfully imported ${data.length} member(s)!`,
      });

      // Refresh statistics and members list
      await fetchMemberStats();
      await fetchMembers();

      // Clear preview
      setPreviewData([]);
      setShowPreview(false);

      // Clear status message after 5 seconds
      setTimeout(() => {
        setImportStatus(null);
      }, 5000);
    } catch (error) {
      console.error("Import error:", error);
      setImportStatus({
        type: "error",
        message: `Import failed: ${error.message}`,
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleCancelPreview = () => {
    setPreviewData([]);
    setShowPreview(false);
    setImportStatus(null);
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from("members")
        .insert([formData])
        .select();

      if (error) throw error;

      setImportStatus({
        type: "success",
        message: "Member added successfully!",
      });

      // Reset form and close modal
      setFormData({
        member_name: "",
        birthday: "",
        contact_num: "",
        status: "active",
        gender: "",
        citizenship: "",
        civil_status: "",
      });
      setShowAddModal(false);

      // Refresh data
      await fetchMemberStats();
      await fetchMembers();

      // Clear status after 3 seconds
      setTimeout(() => setImportStatus(null), 3000);
    } catch (error) {
      console.error("Error adding member:", error);
      setImportStatus({
        type: "error",
        message: `Error adding member: ${error.message}`,
      });
    }
  };

  const handleEditMember = (member) => {
    setEditingMember(member.id);
    setFormData({
      member_name: member.member_name || "",
      birthday: member.birthday || "",
      contact_num: member.contact_num || "",
      status: member.status || "active",
      gender: member.gender || "",
      citizenship: member.citizenship || "",
      civil_status: member.civil_status || "",
    });
    setShowEditModal(true);
  };

  const handleUpdateMember = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from("members")
        .update(formData)
        .eq("id", editingMember);

      if (error) throw error;

      setImportStatus({
        type: "success",
        message: "Member updated successfully!",
      });

      setEditingMember(null);
      setShowEditModal(false);
      await fetchMembers();
      await fetchMemberStats();

      setTimeout(() => setImportStatus(null), 3000);
    } catch (error) {
      console.error("Error updating member:", error);
      setImportStatus({
        type: "error",
        message: `Error updating member: ${error.message}`,
      });
    }
  };

  const handleDeleteMember = (member) => {
    setMemberToDelete(member);
    setConfirmAction(() => async () => {
      try {
        const { error } = await supabase
          .from("members")
          .update({ deleted_at: new Date().toISOString() })
          .eq("id", member.id);

        if (error) throw error;

        setImportStatus({
          type: "success",
          message: "Member deleted successfully!",
        });

        await fetchMembers();
        await fetchMemberStats();
        setShowConfirmModal(false);
        setMemberToDelete(null);

        setTimeout(() => setImportStatus(null), 3000);
      } catch (error) {
        console.error("Error deleting member:", error);
        setImportStatus({
          type: "error",
          message: `Error deleting member: ${error.message}`,
        });
        setShowConfirmModal(false);
        setMemberToDelete(null);
      }
    });
    setShowConfirmModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Filter members based on search term
  const filteredMembers = members.filter((member) =>
    member.member_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination calculations
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMembers = filteredMembers.slice(startIndex, endIndex);

  // Reset to first page when search changes
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleViewDeleted = () => {
    navigate("/dashboard/deleted-members");
  };

  return (
    <div className="glass-panel rounded-2xl p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-green-600" />
          <h1 className="text-2xl md:text-3xl font-bold text-black">Members</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            <span>Add Member</span>
          </button>
          <button
            onClick={handleViewDeleted}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all text-sm font-medium"
          >
            <Trash className="h-4 w-4" />
            <span>View Deleted</span>
          </button>
          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all text-sm font-medium cursor-pointer">
            <Upload className="h-4 w-4" />
            <span>Import CSV</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      <p className="text-sm text-gray-700 mb-4">
        View and manage HOA members and their information.
      </p>

      {/* Status Messages */}
      {importStatus && (
        <div
          className={`mb-3 p-2.5 rounded-lg flex items-center gap-2 text-sm ${
            importStatus.type === "success"
              ? "bg-green-100 border border-green-400 text-green-700"
              : "bg-red-100 border border-red-400 text-red-700"
          }`}
        >
          {importStatus.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{importStatus.message}</span>
        </div>
      )}

      {/* Preview Section */}
      {showPreview && previewData.length > 0 && (
        <div className="mb-4 glass-panel rounded-xl p-3 border border-green-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <FileSpreadsheet className="h-4 w-4 text-green-600" />
              <h3 className="text-sm font-bold text-black">
                Preview ({previewData.length} member(s) ready to import)
              </h3>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCancelPreview}
                className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={isImporting}
                className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isImporting ? "Importing..." : "Import"}
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left p-1.5 font-semibold text-gray-700">
                    Member Name
                  </th>
                  <th className="text-left p-1.5 font-semibold text-gray-700">
                    Gender
                  </th>
                  <th className="text-left p-1.5 font-semibold text-gray-700">
                    Citizenship
                  </th>
                  <th className="text-left p-1.5 font-semibold text-gray-700">
                    Civil Status
                  </th>
                  <th className="text-left p-1.5 font-semibold text-gray-700">
                    Contact Num
                  </th>
                  <th className="text-left p-1.5 font-semibold text-gray-700">
                    Birthday
                  </th>
                  <th className="text-left p-1.5 font-semibold text-gray-700">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {previewData.slice(0, 5).map((row, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="p-1.5 text-gray-700">{row.member_name}</td>
                    <td className="p-1.5 text-gray-600">{row.gender || "-"}</td>
                    <td className="p-1.5 text-gray-600">
                      {row.citizenship || "-"}
                    </td>
                    <td className="p-1.5 text-gray-600">
                      {row.civil_status || "-"}
                    </td>
                    <td className="p-1.5 text-gray-600">
                      {row.contact_num || "-"}
                    </td>
                    <td className="p-1.5 text-gray-600">
                      {row.birthday || "-"}
                    </td>
                    <td className="p-1.5">
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
                          row.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {previewData.length > 5 && (
              <p className="mt-1.5 text-xs text-gray-500">
                Showing first 5 of {previewData.length} members...
              </p>
            )}
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <Statistics
        stats={[
          {
            title: searchTerm ? "Filtered Members" : "Total Members",
            value: searchTerm ? filteredMembers.length : totalMembers,
          },
          {
            title: "Active Members",
            value: searchTerm
              ? filteredMembers.filter((m) => m.status === "active").length
              : activeMembers,
          },
        ]}
      />

      {/* Members Table */}
      <div className="glass-panel rounded-xl p-4 mt-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold text-black">Members List</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search members by name..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
            />
          </div>
        </div>

        {searchTerm && (
          <div className="mb-3 text-sm text-gray-600">
            Showing {filteredMembers.length} result(s) for "{searchTerm}"
          </div>
        )}
        {loading ? (
          <div className="text-center py-8 text-gray-600">
            Loading members...
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            {searchTerm
              ? `No members found matching "${searchTerm}"`
              : "No members found. Add some members to get started!"}
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
                      Name
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-700">
                      Birthday
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-700">
                      Contact
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-700">
                      Lots
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
                  {currentMembers.map((member, index) => (
                    <tr
                      key={member.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="p-3 text-gray-600 font-medium">
                        {startIndex + index + 1}
                      </td>
                      <td className="p-3">
                        <span className="font-medium text-gray-900">
                          {member.member_name}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-gray-700">
                          {member.birthday || "-"}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-gray-700">
                          {member.contact_num || "-"}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {member.lots && member.lots.length > 0 ? (
                            member.lots.map((lot, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
                              >
                                {lot}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-500 text-sm">
                              No lots
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            member.status === "active"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {member.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Link
                            to={`/members/${member.id}/profile`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-green-600 hover:bg-green-100 rounded transition-colors"
                            title="View Profile (Opens in new tab)"
                          >
                            <User className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleEditMember(member)}
                            className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          {role === "Admin" && (
                            <button
                              onClick={() => handleDeleteMember(member)}
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
                  {Math.min(endIndex, filteredMembers.length)} of{" "}
                  {filteredMembers.length} members
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

      {/* Add Member Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setFormData({
            member_name: "",
            birthday: "",
            contact_num: "",
            status: "active",
            gender: "",
            citizenship: "",
            civil_status: "",
          });
        }}
        title="Add New Member"
      >
        <form onSubmit={handleAddMember} className="space-y-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Member Name *
            </label>
            <input
              type="text"
              name="member_name"
              value={formData.member_name}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Birthday
              </label>
              <input
                type="date"
                name="birthday"
                value={formData.birthday}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Number
              </label>
              <input
                type="text"
                name="contact_num"
                value={formData.contact_num}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Citizenship
              </label>
              <input
                type="text"
                name="citizenship"
                value={formData.citizenship}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Civil Status
              </label>
              <select
                name="civil_status"
                value={formData.civil_status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Civil Status</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Divorced">Divorced</option>
                <option value="Widowed">Widowed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowAddModal(false);
                setFormData({
                  member_name: "",
                  birthday: "",
                  contact_num: "",
                  status: "active",
                  gender: "",
                  citizenship: "",
                  civil_status: "",
                });
              }}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Member
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Member Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingMember(null);
          setFormData({
            member_name: "",
            birthday: "",
            contact_num: "",
            status: "active",
            gender: "",
            citizenship: "",
            civil_status: "",
          });
        }}
        title="Edit Member"
      >
        <form onSubmit={handleUpdateMember} className="space-y-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Member Name *
            </label>
            <input
              type="text"
              name="member_name"
              value={formData.member_name}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Birthday
              </label>
              <input
                type="date"
                name="birthday"
                value={formData.birthday}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Number
              </label>
              <input
                type="text"
                name="contact_num"
                value={formData.contact_num}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Citizenship
              </label>
              <input
                type="text"
                name="citizenship"
                value={formData.citizenship}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Civil Status
              </label>
              <select
                name="civil_status"
                value={formData.civil_status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Civil Status</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Divorced">Divorced</option>
                <option value="Widowed">Widowed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowEditModal(false);
                setEditingMember(null);
                setFormData({
                  member_name: "",
                  birthday: "",
                  contact_num: "",
                  status: "active",
                  gender: "",
                  citizenship: "",
                  civil_status: "",
                });
              }}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Update Member
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setMemberToDelete(null);
        }}
        onConfirm={confirmAction}
        title="Delete Member"
        message={
          memberToDelete
            ? `Are you sure you want to delete "${memberToDelete.member_name}"? This will move the member to the deleted members list. This action can be reversed later.`
            : ""
        }
        confirmText="Delete Member"
        cancelText="Cancel"
        type="warning"
      />
    </div>
  );
}

export default Members;
