import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  Shield,
  Home,
  ArrowLeft,
  AlertTriangle,
  MapPin,
  Clock,
  User,
  Lock,
  Search,
  RefreshCw,
  Mail,
  Phone,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";

function YourLost() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, authorized, role, signOut } = useAuth();
  const [countdown, setCountdown] = useState(10);
  const [errorType, setErrorType] = useState("404");
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Determine error type based on location state or URL
    const state = location.state;
    if (state?.type) {
      setErrorType(state.type);
    } else if (
      location.pathname.includes("dashboard") ||
      location.pathname.includes("members")
    ) {
      if (!user) {
        setErrorType("unauthenticated");
      } else if (!authorized) {
        setErrorType("unauthorized");
      }
    }
  }, [location, user, authorized]);

  useEffect(() => {
    // Countdown timer for auto-redirect
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      // Auto redirect based on error type
      if (errorType === "unauthenticated") {
        navigate("/signin");
      } else {
        navigate("/");
      }
    }
  }, [countdown, errorType, navigate]);

  const getErrorConfig = () => {
    switch (errorType) {
      case "unauthenticated":
        return {
          icon: <User className="h-20 w-20 text-blue-500" />,
          title: "Authentication Required",
          subtitle: "Please sign in to continue",
          message:
            "You need to be signed in to access this page. Sign in with your account to continue to the dashboard.",
          bgColor: "from-blue-50 to-indigo-100",
          accentColor: "text-blue-600",
          borderColor: "border-blue-200",
          buttonPrimary: {
            text: "Sign In",
            action: () => navigate("/signin"),
            className: "bg-blue-600 hover:bg-blue-700 text-white",
          },
          buttonSecondary: {
            text: "Sign Up",
            action: () => navigate("/signup"),
            className: "bg-gray-100 hover:bg-gray-200 text-gray-700",
          },
        };
      case "unauthorized":
        return {
          icon: <Shield className="h-20 w-20 text-orange-500" />,
          title: "Access Denied",
          subtitle: "You don't have permission to access this page",
          message: `Your account (${user?.email}) is not authorized to access the dashboard. Contact an administrator to request access.`,
          bgColor: "from-orange-50 to-red-100",
          accentColor: "text-orange-600",
          borderColor: "border-orange-200",
          buttonPrimary: {
            text: "Go Home",
            action: () => navigate("/"),
            className: "bg-orange-600 hover:bg-orange-700 text-white",
          },
          buttonSecondary: {
            text: "Contact Admin",
            action: () => setShowDetails(true),
            className: "bg-gray-100 hover:bg-gray-200 text-gray-700",
          },
        };
      case "admin-required":
        return {
          icon: <Lock className="h-20 w-20 text-purple-500" />,
          title: "Administrator Access Required",
          subtitle: "This feature requires admin privileges",
          message: `Your current role (${role}) doesn't have permission to access this feature. Only administrators can access this page.`,
          bgColor: "from-purple-50 to-pink-100",
          accentColor: "text-purple-600",
          borderColor: "border-purple-200",
          buttonPrimary: {
            text: "Back to Dashboard",
            action: () => navigate("/dashboard"),
            className: "bg-purple-600 hover:bg-purple-700 text-white",
          },
          buttonSecondary: {
            text: "Contact Admin",
            action: () => setShowDetails(true),
            className: "bg-gray-100 hover:bg-gray-200 text-gray-700",
          },
        };
      default: // 404
        return {
          icon: <MapPin className="h-20 w-20 text-gray-500" />,
          title: "Page Not Found",
          subtitle: "The page you're looking for doesn't exist",
          message:
            "The page you requested could not be found. It may have been moved, deleted, or you entered the wrong URL.",
          bgColor: "from-gray-50 to-slate-100",
          accentColor: "text-gray-600",
          borderColor: "border-gray-200",
          buttonPrimary: {
            text: "Go Home",
            action: () => navigate("/"),
            className: "bg-gray-600 hover:bg-gray-700 text-white",
          },
          buttonSecondary: {
            text: "Go Back",
            action: () => navigate(-1),
            className: "bg-gray-100 hover:bg-gray-200 text-gray-700",
          },
        };
    }
  };

  const config = getErrorConfig();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600 text-lg">Checking your access...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-gradient-to-br ${config.bgColor} flex items-center justify-center p-4`}
    >
      <div className="max-w-2xl w-full">
        {/* Main Error Card */}
        <div
          className={`bg-white rounded-2xl shadow-2xl p-8 md:p-12 border ${config.borderColor} relative overflow-hidden`}
        >
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/20 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-white/20 to-transparent rounded-full translate-y-12 -translate-x-12"></div>

          <div className="relative z-10">
            {/* Icon and Header */}
            <div className="text-center mb-8">
              <div className="mb-6 flex justify-center">{config.icon}</div>
              <h1
                className={`text-4xl md:text-5xl font-bold ${config.accentColor} mb-3`}
              >
                {config.title}
              </h1>
              <p className="text-xl text-gray-600 mb-6">{config.subtitle}</p>
              <div
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${config.borderColor} bg-white/50`}
              >
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  Auto-redirecting in {countdown}s
                </span>
              </div>
            </div>

            {/* Message */}
            <div className="bg-gray-50 rounded-xl p-6 mb-8 border border-gray-100">
              <p className="text-gray-700 leading-relaxed text-center">
                {config.message}
              </p>

              {user && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>{user.email}</span>
                    </div>
                    {role && (
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        <span>Role: {role}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <button
                onClick={config.buttonPrimary.action}
                className={`flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 ${config.buttonPrimary.className}`}
              >
                <Home className="h-5 w-5" />
                {config.buttonPrimary.text}
              </button>
              <button
                onClick={config.buttonSecondary.action}
                className={`flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 ${config.buttonSecondary.className}`}
              >
                <ArrowLeft className="h-5 w-5" />
                {config.buttonSecondary.text}
              </button>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <Link
                to="/"
                className="flex flex-col items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-center"
              >
                <Home className="h-5 w-5 text-gray-600 mb-1" />
                <span className="text-xs text-gray-600">Home</span>
              </Link>
              <Link
                to="/about"
                className="flex flex-col items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-center"
              >
                <Search className="h-5 w-5 text-gray-600 mb-1" />
                <span className="text-xs text-gray-600">About</span>
              </Link>
              {!user && (
                <>
                  <Link
                    to="/signin"
                    className="flex flex-col items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-center"
                  >
                    <User className="h-5 w-5 text-gray-600 mb-1" />
                    <span className="text-xs text-gray-600">Sign In</span>
                  </Link>
                  <Link
                    to="/signup"
                    className="flex flex-col items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-center"
                  >
                    <Shield className="h-5 w-5 text-gray-600 mb-1" />
                    <span className="text-xs text-gray-600">Sign Up</span>
                  </Link>
                </>
              )}
              {user && (
                <button
                  onClick={signOut}
                  className="flex flex-col items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-center"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-600 mb-1" />
                  <span className="text-xs text-gray-600">Sign Out</span>
                </button>
              )}
            </div>

            {/* Help Section */}
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">
                Need help? Contact our support team
              </p>
              <div className="flex items-center justify-center gap-4 text-sm">
                <a
                  href="mailto:support@greenfield.com"
                  className="flex items-center gap-1 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  support@greenfield.com
                </a>
                <a
                  href="tel:+1234567890"
                  className="flex items-center gap-1 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  (123) 456-7890
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info Card for Admin Contact */}
        {showDetails &&
          (errorType === "unauthorized" || errorType === "admin-required") && (
            <div className="mt-6 bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Request Access
                </h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  ×
                </button>
              </div>
              <p className="text-gray-600 mb-4">
                To request access to the dashboard, please contact an
                administrator with the following information:
              </p>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <div>
                  <strong>Your Email:</strong> {user?.email}
                </div>
                <div>
                  <strong>Current Role:</strong> {role || "None"}
                </div>
                <div>
                  <strong>Requested Access:</strong> Dashboard Access
                </div>
                <div>
                  <strong>Timestamp:</strong> {new Date().toLocaleString()}
                </div>
              </div>
              <div className="mt-4 flex gap-3">
                <a
                  href={`mailto:admin@greenfield.com?subject=Dashboard Access Request&body=Hello,%0D%0A%0D%0AI would like to request access to the Greenfield HOA Dashboard.%0D%0A%0D%0AUser Email: ${
                    user?.email
                  }%0D%0ACurrent Role: ${
                    role || "None"
                  }%0D%0ATimestamp: ${new Date().toLocaleString()}%0D%0A%0D%0AThank you.`}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  Email Admin
                </a>
              </div>
            </div>
          )}

        {/* Debug Info (only in development) */}
        {/* {process.env.NODE_ENV === "development" && (
          <div className="mt-6 bg-gray-800 text-white rounded-xl p-4 text-xs font-mono">
            <div>
              <strong>Error Type:</strong> {errorType}
            </div>
            <div>
              <strong>Path:</strong> {location.pathname}
            </div>
            <div>
              <strong>User:</strong> {user?.email || "Not signed in"}
            </div>
            <div>
              <strong>Authorized:</strong> {authorized ? "Yes" : "No"}
            </div>
            <div>
              <strong>Role:</strong> {role || "None"}
            </div>
          </div>
        )} */}
      </div>
    </div>
  );
}

export default YourLost;
