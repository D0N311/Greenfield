import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  User,
  ArrowLeft,
  MapPin,
  Phone,
  Calendar,
  Heart,
  Receipt,
  AlertTriangle,
  Home,
  CheckCircle2,
  Clock,
  AlertCircle,
  DollarSign,
  FileText,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import Statistics from "../components/Statistics";

function MemberProfile() {
  const { memberId } = useParams();
  const [member, setMember] = useState(null);
  const [contributions, setContributions] = useState([]);
  const [lots, setLots] = useState([]);
  const [penalties, setPenalties] = useState([]);
  const [lotPayments, setLotPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (memberId) {
      fetchMemberData();
    }
  }, [memberId]);

  const fetchMemberData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch member details
      const { data: memberData, error: memberError } = await supabase
        .from("members")
        .select("*")
        .eq("id", memberId)
        .single();

      if (memberError) throw memberError;
      setMember(memberData);

      // Fetch member's contributions
      const { data: contributionsData, error: contributionsError } =
        await supabase
          .from("contributions")
          .select(
            `
            *,
            contribution_types (
              id,
              type_name
            )
          `
          )
          .eq("member_id", memberId)
          .order("created_at", { ascending: false });

      if (contributionsError) throw contributionsError;
      setContributions(contributionsData || []);

      // Fetch member's lots
      const { data: lotsData, error: lotsError } = await supabase
        .from("lots")
        .select("*")
        .eq("member_id", memberId)
        .order("created_at", { ascending: false });

      if (lotsError) throw lotsError;
      setLots(lotsData || []);

      // Fetch member's penalties
      const { data: penaltiesData, error: penaltiesError } = await supabase
        .from("penalties")
        .select("*")
        .eq("member_id", memberId)
        .order("created_at", { ascending: false });

      if (penaltiesError) throw penaltiesError;
      setPenalties(penaltiesData || []);

      // Fetch lot payments for member's lots
      if (lotsData && lotsData.length > 0) {
        const lotIds = lotsData.map((lot) => lot.id);
        const { data: paymentsData, error: paymentsError } = await supabase
          .from("lot_payments")
          .select(
            `
            *,
            lots (
              id,
              block_no,
              lot_no
            )
          `
          )
          .in("lot_id", lotIds)
          .order("payment_date", { ascending: false });

        if (paymentsError) throw paymentsError;
        setLotPayments(paymentsData || []);
      }
    } catch (error) {
      console.error("Error fetching member data:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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

  // Calculate statistics
  const totalContributions = contributions.reduce(
    (sum, contrib) => sum + parseFloat(contrib.amount || 0),
    0
  );
  const paidContributions = contributions
    .filter((contrib) => contrib.is_paid)
    .reduce((sum, contrib) => sum + parseFloat(contrib.amount || 0), 0);

  const totalPenalties = penalties.reduce(
    (sum, penalty) => sum + parseFloat(penalty.amount || 0),
    0
  );
  const paidPenalties = penalties
    .filter((penalty) => penalty.penalty_status === "paid")
    .reduce((sum, penalty) => sum + parseFloat(penalty.amount || 0), 0);

  const totalLotPayments = lotPayments.reduce(
    (sum, payment) => sum + parseFloat(payment.amount || 0),
    0
  );

  const totalPropertyValue = lots.reduce(
    (sum, lot) => sum + parseFloat(lot.property_price || 0),
    0
  );
  const totalBalance = lots.reduce(
    (sum, lot) => sum + parseFloat(lot.balance || 0),
    0
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading member profile...</p>
        </div>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">{error || "Member not found."}</p>
          <Link
            to="/members"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Members
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {member.member_name}
                </h1>
                <p className="text-gray-600">Member Profile</p>
              </div>
            </div>
            <Link
              to="/dashboard/members"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Members
            </Link>
          </div>

          {/* Member Information */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-4">
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600 text-sm">Birthday</span>
                </div>
                <p className="font-medium text-gray-900">
                  {formatDate(member.birthday)}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600 text-sm">Contact</span>
                </div>
                <p className="font-medium text-gray-900">
                  {member.contact_num || "N/A"}
                </p>
              </div>
              <div>
                <span className="text-gray-600 text-sm">Gender</span>
                <p className="font-medium text-gray-900">
                  {member.gender || "N/A"}
                </p>
              </div>
              <div>
                <span className="text-gray-600 text-sm">Citizenship</span>
                <p className="font-medium text-gray-900">
                  {member.citizenship || "N/A"}
                </p>
              </div>
              <div>
                <span className="text-gray-600 text-sm">Status</span>
                <span
                  className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                    member.status === "active"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {member.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Overview */}
        <Statistics
          stats={[
            {
              title: "Total Contributions",
              value: `₱${totalContributions.toLocaleString()}`,
              subtitle: `₱${paidContributions.toLocaleString()} paid`,
            },
            {
              title: "Total Penalties",
              value: `₱${totalPenalties.toLocaleString()}`,
              subtitle: `₱${paidPenalties.toLocaleString()} paid`,
            },
            {
              title: "Lot Payments",
              value: `₱${totalLotPayments.toLocaleString()}`,
              subtitle: `${lotPayments.length} payments`,
            },
            {
              title: "Property Value",
              value: `₱${totalPropertyValue.toLocaleString()}`,
              subtitle: `₱${totalBalance.toLocaleString()} balance`,
            },
          ]}
        />

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <div className="flex space-x-8 px-6">
              {[
                { id: "overview", label: "Overview", icon: User },
                { id: "lots", label: "Lots", icon: Home },
                { id: "contributions", label: "Contributions", icon: Heart },
                { id: "penalties", label: "Penalties", icon: AlertTriangle },
                { id: "payments", label: "Lot Payments", icon: Receipt },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Activity Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Home className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="text-2xl font-bold text-blue-900">
                        {lots.length}
                      </p>
                      <p className="text-blue-700 text-sm">Lots Owned</p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Heart className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="text-2xl font-bold text-green-900">
                        {contributions.length}
                      </p>
                      <p className="text-green-700 text-sm">Contributions</p>
                    </div>
                  </div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                    <div>
                      <p className="text-2xl font-bold text-red-900">
                        {penalties.length}
                      </p>
                      <p className="text-red-700 text-sm">Penalties</p>
                    </div>
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Receipt className="h-8 w-8 text-purple-600" />
                    <div>
                      <p className="text-2xl font-bold text-purple-900">
                        {lotPayments.length}
                      </p>
                      <p className="text-purple-700 text-sm">Lot Payments</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "lots" && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Owned Lots ({lots.length})
              </h3>
              {lots.length === 0 ? (
                <div className="text-center py-8">
                  <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    No lots found for this member.
                  </p>
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
                      </tr>
                    </thead>
                    <tbody>
                      {lots.map((lot) => (
                        <tr
                          key={lot.id}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="p-3 font-medium text-gray-900">
                            {lot.block_no}-{lot.lot_no}
                          </td>
                          <td className="p-3 text-gray-700">
                            {lot.size_sqm || "N/A"}
                          </td>
                          <td className="p-3 font-semibold text-green-600">
                            ₱
                            {parseFloat(
                              lot.property_price || 0
                            ).toLocaleString()}
                          </td>
                          <td className="p-3">
                            <span
                              className={`font-semibold ${
                                parseFloat(lot.balance || 0) > 0
                                  ? "text-red-600"
                                  : "text-green-600"
                              }`}
                            >
                              ₱{parseFloat(lot.balance || 0).toLocaleString()}
                            </span>
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                lot.is_active
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {lot.is_active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="p-3 text-gray-700">
                            {formatDate(lot.acquired_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === "contributions" && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Contributions ({contributions.length})
              </h3>
              {contributions.length === 0 ? (
                <div className="text-center py-8">
                  <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    No contributions found for this member.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left p-3 font-semibold text-gray-700">
                          Type
                        </th>
                        <th className="text-left p-3 font-semibold text-gray-700">
                          Amount
                        </th>
                        <th className="text-left p-3 font-semibold text-gray-700">
                          Month/Year
                        </th>
                        <th className="text-left p-3 font-semibold text-gray-700">
                          Status
                        </th>
                        <th className="text-left p-3 font-semibold text-gray-700">
                          Paid Date
                        </th>
                        <th className="text-left p-3 font-semibold text-gray-700">
                          Remarks
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {contributions.map((contribution) => (
                        <tr
                          key={contribution.id}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="p-3 text-gray-900">
                            {contribution.contribution_types?.type_name ||
                              "N/A"}
                          </td>
                          <td className="p-3 font-semibold text-green-600">
                            ₱
                            {parseFloat(
                              contribution.amount || 0
                            ).toLocaleString()}
                          </td>
                          <td className="p-3 text-gray-700">
                            {contribution.month && contribution.year
                              ? `${contribution.month}/${contribution.year}`
                              : "N/A"}
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                contribution.is_paid
                                  ? "bg-green-100 text-green-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {contribution.is_paid ? "Paid" : "Unpaid"}
                            </span>
                          </td>
                          <td className="p-3 text-gray-700">
                            {contribution.paid_at
                              ? formatDate(contribution.paid_at)
                              : "N/A"}
                          </td>
                          <td className="p-3 text-gray-700">
                            {contribution.remarks || "N/A"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === "penalties" && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Penalties ({penalties.length})
              </h3>
              {penalties.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    No penalties found for this member.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left p-3 font-semibold text-gray-700">
                          Amount
                        </th>
                        <th className="text-left p-3 font-semibold text-gray-700">
                          Reason
                        </th>
                        <th className="text-left p-3 font-semibold text-gray-700">
                          Status
                        </th>
                        <th className="text-left p-3 font-semibold text-gray-700">
                          Created Date
                        </th>
                        <th className="text-left p-3 font-semibold text-gray-700">
                          Notes
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {penalties.map((penalty) => (
                        <tr
                          key={penalty.id}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="p-3 font-semibold text-red-600">
                            ₱{parseFloat(penalty.amount || 0).toLocaleString()}
                          </td>
                          <td className="p-3 text-gray-900">
                            {penalty.reason || "N/A"}
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${getStatusColor(
                                penalty.penalty_status
                              )}`}
                            >
                              {getStatusIcon(penalty.penalty_status)}
                              {penalty.penalty_status?.charAt(0).toUpperCase() +
                                penalty.penalty_status?.slice(1)}
                            </span>
                          </td>
                          <td className="p-3 text-gray-700">
                            {formatDate(penalty.created_at)}
                          </td>
                          <td className="p-3 text-gray-700">
                            {penalty.notes || "N/A"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === "payments" && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Lot Payments ({lotPayments.length})
              </h3>
              {lotPayments.length === 0 ? (
                <div className="text-center py-8">
                  <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    No lot payments found for this member.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left p-3 font-semibold text-gray-700">
                          Lot
                        </th>
                        <th className="text-left p-3 font-semibold text-gray-700">
                          Receipt Number
                        </th>
                        <th className="text-left p-3 font-semibold text-gray-700">
                          Amount
                        </th>
                        <th className="text-left p-3 font-semibold text-gray-700">
                          Payment Date
                        </th>
                        <th className="text-left p-3 font-semibold text-gray-700">
                          Notes
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {lotPayments.map((payment) => (
                        <tr
                          key={payment.id}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="p-3 font-medium text-gray-900">
                            {payment.lots
                              ? `${payment.lots.block_no}-${payment.lots.lot_no}`
                              : "N/A"}
                          </td>
                          <td className="p-3 text-gray-700">
                            {payment.receipt_number}
                          </td>
                          <td className="p-3 font-semibold text-green-600">
                            ₱{parseFloat(payment.amount || 0).toLocaleString()}
                          </td>
                          <td className="p-3 text-gray-700">
                            {formatDate(payment.payment_date)}
                          </td>
                          <td className="p-3 text-gray-700">
                            {payment.notes || "N/A"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MemberProfile;
