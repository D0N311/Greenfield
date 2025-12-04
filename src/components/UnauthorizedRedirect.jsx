import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { AlertCircle, Shield } from "lucide-react";

function UnauthorizedRedirect() {
  const navigate = useNavigate();
  const { user, loading, authorized } = useAuth();

  useEffect(() => {
    // If not loading and user is not authorized, redirect to YourLost immediately
    if (!loading && (!user || !authorized)) {
      const errorType = !user ? "unauthenticated" : "unauthorized";
      navigate("/yourlost", {
        replace: true,
        state: { type: errorType },
      });
    }
  }, [loading, user, authorized, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authorization...</p>
        </div>
      </div>
    );
  }

  // This component now just handles the redirect logic
  // The actual UI is handled by YourLost.jsx
  return null;
}

export default UnauthorizedRedirect;
