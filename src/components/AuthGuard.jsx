import { useAuth } from "../hooks/useAuth";
import { AlertCircle, Shield, Loader } from "lucide-react";
import UnauthorizedRedirect from "./UnauthorizedRedirect";

function AuthGuard({ children, requireAdmin = false, fallback = null }) {
  const { user, loading, authorized, role, isAdmin } = useAuth();

  // Show loading state
  if (loading) {
    return (
      fallback || (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Checking authorization...</p>
          </div>
        </div>
      )
    );
  }

  // Check if user is signed in or authorized
  if (!user || !authorized) {
    return fallback || <UnauthorizedRedirect />;
  }

  // Check admin requirement
  if (requireAdmin && !isAdmin) {
    if (fallback) return fallback;

    // Redirect to YourLost for admin-required pages
    window.location.href = "/yourlost?type=admin-required";
    return null;
  }

  // User is authorized, render children
  return children;
}

export default AuthGuard;
