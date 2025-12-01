import { useState, useEffect } from "react";
import {
  Trash,
  Search,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import Statistics from "../components/Statistics";
import Modal from "../components/Modal";
import ConfirmationModal from "../components/ConfirmationModal";

function DeletedMembers() {
  const [deletedMembers, setDeletedMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  // Fetch deleted members list
  useEffect(() => {
    fetchDeletedMembers();
  }, []);

  const fetchDeletedMembers = async () => {
    setLoading(true);
    try {
      // Fetch deleted members
      const { data: membersData, error: membersError } = await supabase
        .from("members")
        .select("*")
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false });

      if (membersError) throw membersError;

      // Fetch all lots (including released ones) for these deleted members
      const memberIds = (membersData || []).map((member) => member.id);
      if (memberIds.length > 0) {
        const { data: lotsData, error: lotsError } = await supabase
          .from("lots")
          .select("member_id, block_no, lot_no, is_active")
          .in("member_id", memberIds)
          .order("block_no")
          .order("lot_no");

        if (lotsError) throw lotsError;

        // Group lots by member_id
        const lotsByMember = (lotsData || []).reduce((acc, lot) => {
          if (!acc[lot.member_id]) acc[lot.member_id] = [];
          acc[lot.member_id].push({
            name: `${lot.block_no}-${lot.lot_no}`,
            isActive: lot.is_active,
          });
          return acc;
        }, {});

        // Add lots information to members
        const membersWithLots = (membersData || []).map((member) => ({
          ...member,
          lots: lotsByMember[member.id] || [],
        }));

        setDeletedMembers(membersWithLots);
      } else {
        setDeletedMembers(membersData || []);
      }
    } catch (error) {
      console.error("Error fetching deleted members:", error);
      setStatus({
        type: "error",
        message: `Error loading deleted members: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreMember = (member) => {
    setSelectedMember(member);
    setShowRestoreModal(true);
  };

  const confirmRestoreMember = async () => {
    if (!selectedMember) return;

    try {
      const { error } = await supabase
        .from("members")
        .update({ deleted_at: null })
        .eq("id", selectedMember.id);

      if (error) throw error;

      setStatus({
        type: "success",
        message: "Member restored successfully!",
      });

      await fetchDeletedMembers();
      setTimeout(() => setStatus(null), 3000);
    } catch (error) {
      console.error("Error restoring member:", error);
      setStatus({
        type: "error",
        message: `Error restoring member: ${error.message}`,
      });
    } finally {
      setShowRestoreModal(false);
      setSelectedMember(null);
    }
  };

  const handlePermanentDelete = (member) => {
    setSelectedMember(member);
    setShowDeleteModal(true);
  };

  const confirmPermanentDelete = async () => {
    if (!selectedMember) return;

    try {
      const { error } = await supabase
        .from("members")
        .delete()
        .eq("id", selectedMember.id);

      if (error) throw error;

      setStatus({
        type: "success",
        message: "Member permanently deleted!",
      });

      await fetchDeletedMembers();
      setTimeout(() => setStatus(null), 3000);
    } catch (error) {
      console.error("Error permanently deleting member:", error);
      setStatus({
        type: "error",
        message: `Error permanently deleting member: ${error.message}`,
      });
    } finally {
      setShowDeleteModal(false);
      setSelectedMember(null);
    }
  };

  // Filter members based on search term
  const filteredMembers = deletedMembers.filter((member) =>
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

  return (
    <div className="glass-panel rounded-2xl p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trash className="h-5 w-5 text-red-600" />
          <h1 className="text-2xl md:text-3xl font-bold text-black">
            Deleted Members
          </h1>
        </div>
        <button
          onClick={fetchDeletedMembers}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all text-sm font-medium"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      <p className="text-sm text-gray-700 mb-4">
        View and manage deleted HOA members. You can restore members or delete
        them permanently.
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
          <span>{status.message}</span>
        </div>
      )}

      {/* Statistics Cards */}
      <Statistics
        stats={[
          {
            title: searchTerm
              ? "Filtered Deleted Members"
              : "Total Deleted Members",
            value: searchTerm ? filteredMembers.length : deletedMembers.length,
          },
        ]}
      />

      {/* Deleted Members Table */}
      <div className="glass-panel rounded-xl p-4 mt-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold text-black">
            Deleted Members List
          </h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search deleted members by name..."
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
            Loading deleted members...
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            {searchTerm
              ? `No deleted members found matching "${searchTerm}"`
              : "No deleted members found."}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
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
                      Deleted Date
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentMembers.map((member) => (
                    <tr
                      key={member.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
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
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  lot.isActive
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-gray-100 text-gray-500"
                                }`}
                              >
                                {lot.name} {!lot.isActive && "(Released)"}
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
                        <span className="text-gray-700">
                          {new Date(member.deleted_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRestoreMember(member)}
                            className="p-1.5 text-green-600 hover:bg-green-100 rounded transition-colors"
                            title="Restore Member"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handlePermanentDelete(member)}
                            className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors"
                            title="Delete Permanently"
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
                  {Math.min(endIndex, filteredMembers.length)} of{" "}
                  {filteredMembers.length} deleted members
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

      {/* Restore Confirmation Modal */}
      <ConfirmationModal
        isOpen={showRestoreModal}
        onClose={() => {
          setShowRestoreModal(false);
          setSelectedMember(null);
        }}
        onConfirm={confirmRestoreMember}
        title="Restore Member"
        message={
          selectedMember
            ? `Are you sure you want to restore "${selectedMember.member_name}"?\n\nThis will make the member active again and they will appear in the main members list.`
            : ""
        }
        confirmText="Restore Member"
        cancelText="Cancel"
        type="info"
      />

      {/* Permanent Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedMember(null);
        }}
        onConfirm={confirmPermanentDelete}
        title="Permanently Delete Member"
        message={
          selectedMember
            ? `Are you sure you want to PERMANENTLY DELETE "${selectedMember.member_name}"?\n\n⚠️ Warning: This action cannot be undone!\nThe member's data will be completely removed from the database.`
            : ""
        }
        confirmText="Delete Forever"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}

export default DeletedMembers;
