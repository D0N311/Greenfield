import { useState, useEffect } from "react";
import {
  Users,
  Shield,
  ShieldCheck,
  UserCheck,
  UserX,
  Plus,
  Edit,
  Trash2,
  Search,
  AlertCircle,
  CheckCircle,
  Crown,
  User,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import Modal from "../components/Modal";
import Statistics from "../components/Statistics";
import ConfirmationModal from "../components/ConfirmationModal";

function Authorize() {
  const [authorizations, setAuthorizations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("add");
  const [selectedAuth, setSelectedAuth] = useState(null);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [formData, setFormData] = useState({
    email: "",
    role: "User",
    is_active: true,
  });
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  useEffect(() => {
    checkUserAuthorization();
  }, []);

  useEffect(() => {
    if (userRole === "Admin") {
      fetchAuthorizations();
    }
  }, [userRole]);

  // Fetch registered users after authorizations are loaded
  useEffect(() => {
    if (userRole === "Admin" && authorizations.length >= 0) {
      fetchRegisteredUsers();
    }
  }, [userRole, authorizations]);

  const checkUserAuthorization = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Please sign in to access this page.");
        return;
      }

      setCurrentUser(user);

      // Check user authorization using our custom function
      const { data: authData, error: authError } = await supabase.rpc(
        "get_user_authorization",
        { user_uuid: user.id }
      );

      if (authError) throw authError;

      if (!authData || authData.length === 0 || !authData[0].authorized) {
        setError("You are not authorized to access this page.");
        return;
      }

      setUserRole(authData[0].user_role);
    } catch (error) {
      console.error("Authorization check error:", error);
      setError(error.message);
    }
  };

  const fetchAuthorizations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("v_user_authorizations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAuthorizations(data || []);
    } catch (error) {
      console.error("Error fetching authorizations:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRegisteredUsers = async () => {
    try {
      const { data, error } = await supabase.rpc("get_registered_users");

      if (error) throw error;

      setRegisteredUsers(data || []);
    } catch (error) {
      console.error("Error fetching registered users:", error);
      // If we can't fetch registered users, provide option for manual entry
      setRegisteredUsers([]);
    }
  };

  const openModal = (type, auth = null) => {
    setModalType(type);
    setSelectedAuth(auth);
    setShowModal(true);

    if (type === "edit" && auth) {
      setFormData({
        email: auth.email,
        role: auth.role,
        is_active: auth.is_active,
      });
    } else {
      setFormData({
        email: "",
        role: "User",
        is_active: true,
      });
      // Refresh available users when opening add modal
      if (type === "add") {
        fetchRegisteredUsers();
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedAuth(null);
    setFormData({
      email: "",
      role: "User",
      is_active: true,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (modalType === "add") {
        // Use the database function to handle user authorization
        const { data: result, error } = await supabase.rpc(
          "add_user_authorization",
          {
            user_email: formData.email,
            user_role: formData.role,
            is_user_active: formData.is_active,
            creator_id: currentUser.id,
          }
        );

        if (error) throw error;

        // Show success message based on result
        if (result && !result.user_found) {
          setError(
            "User will be authorized when they sign up with this email."
          );
          setTimeout(() => setError(null), 3000);
        }
      } else {
        // Update existing authorization
        const { error } = await supabase
          .from("authorize")
          .update({
            email: formData.email,
            role: formData.role,
            is_active: formData.is_active,
          })
          .eq("id", selectedAuth.id);

        if (error) throw error;
      }

      closeModal();
      fetchAuthorizations();
    } catch (error) {
      console.error("Error saving authorization:", error);
      setError(error.message);
    }
  };

  const handleDelete = (auth) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Authorization",
      message: `Are you sure you want to remove authorization for ${auth.email}? This will prevent them from accessing the dashboard.`,
      onConfirm: () => confirmDelete(auth.id),
    });
  };

  const confirmDelete = async (authId) => {
    try {
      const { error } = await supabase
        .from("authorize")
        .delete()
        .eq("id", authId);

      if (error) throw error;

      setConfirmModal({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: null,
      });
      fetchAuthorizations();
    } catch (error) {
      console.error("Error deleting authorization:", error);
      setError(error.message);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const filteredAuthorizations = authorizations.filter(
    (auth) =>
      auth.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      auth.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = [
    {
      title: "Total Authorized Users",
      value: authorizations.length,
      subtitle: `${authorizations.filter((a) => a.is_active).length} active`,
    },
    {
      title: "Administrators",
      value: authorizations.filter((a) => a.role === "Admin").length,
      subtitle: "Full access users",
    },
    {
      title: "Standard Users",
      value: authorizations.filter((a) => a.role === "User").length,
      subtitle: "Limited access users",
    },
    {
      title: "Active Sessions",
      value: authorizations.filter((a) => a.is_active).length,
      subtitle: `${authorizations.filter((a) => !a.is_active).length} inactive`,
    },
  ];

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (userRole !== "Admin") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Admin Access Required
          </h2>
          <p className="text-gray-600 mb-4">
            Only administrators can manage user authorizations.
          </p>
          <p className="text-sm text-gray-500">Your role: {userRole}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <ShieldCheck className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  User Authorization
                </h1>
                <p className="text-gray-600">
                  Manage dashboard access and user roles
                </p>
              </div>
            </div>
            <button
              onClick={() => openModal("add")}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add User
            </button>
          </div>
        </div>

        {/* Statistics */}
        <Statistics stats={stats} />

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search by email or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Authorization Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Authorized Users ({filteredAuthorizations.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading authorizations...</p>
            </div>
          ) : filteredAuthorizations.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No authorized users found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-4 font-semibold text-gray-700">
                      User
                    </th>
                    <th className="text-left p-4 font-semibold text-gray-700">
                      Role
                    </th>
                    <th className="text-left p-4 font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="text-left p-4 font-semibold text-gray-700">
                      Permissions
                    </th>
                    <th className="text-left p-4 font-semibold text-gray-700">
                      Created
                    </th>
                    <th className="text-left p-4 font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredAuthorizations.map((auth) => (
                    <tr key={auth.id} className="hover:bg-gray-50">
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {auth.email}
                          </p>
                          <p className="text-sm text-gray-500">
                            Auth: {auth.auth_email || "Not linked"}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            auth.role === "Admin"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {auth.role === "Admin" ? (
                            <Crown className="h-3 w-3" />
                          ) : (
                            <User className="h-3 w-3" />
                          )}
                          {auth.role}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            auth.is_active
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {auth.is_active ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <UserX className="h-3 w-3" />
                          )}
                          {auth.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-gray-700">
                          {auth.role_description}
                        </p>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-gray-700">
                          {new Date(auth.created_at).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openModal("edit", auth)}
                            className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                            title="Edit Authorization"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(auth)}
                            className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors"
                            title="Delete Authorization"
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
          )}
        </div>

        {/* Add/Edit Modal */}
        <Modal isOpen={showModal} onClose={closeModal}>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {modalType === "add"
                ? "Add User Authorization"
                : "Edit User Authorization"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Select User
                </label>
                {modalType === "add" ? (
                  <div className="space-y-2">
                    <select
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Choose a registered user...</option>
                      {registeredUsers.map((user) => (
                        <option key={user.user_id} value={user.email}>
                          {user.email}
                        </option>
                      ))}
                      <option value="custom">Enter custom email...</option>
                    </select>

                    {formData.email === "custom" && (
                      <input
                        type="email"
                        name="customEmail"
                        placeholder="Enter email address"
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    )}

                    <p className="text-xs text-gray-500">
                      {registeredUsers.length > 0
                        ? `${registeredUsers.length} registered users available. Use "custom" for pre-authorization.`
                        : "No unauthorized users found. Use custom option to pre-authorize users."}
                    </p>
                  </div>
                ) : (
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="user@example.com"
                  />
                )}
              </div>

              <div>
                <label
                  htmlFor="role"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Role
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="User">
                    User - Limited Access (Soft Delete Only)
                  </option>
                  <option value="Admin">
                    Admin - Full Access (Hard Delete Allowed)
                  </option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="is_active"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Active (User can access the dashboard)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {modalType === "add" ? "Add User" : "Update User"}
                </button>
              </div>
            </form>
          </div>
        </Modal>

        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          onConfirm={confirmModal.onConfirm}
          onCancel={() =>
            setConfirmModal({
              isOpen: false,
              title: "",
              message: "",
              onConfirm: null,
            })
          }
        />
      </div>
    </div>
  );
}

export default Authorize;
