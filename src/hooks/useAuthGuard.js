import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./useAuth";

export function useAuthGuard(requireAdmin = false) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, authorized, isAdmin } = useAuth();

  useEffect(() => {
    if (loading) return; // Wait for auth check to complete

    // Check if trying to access protected routes
    const protectedPaths = ["/dashboard", "/members", "/lot-payment-history"];
    const isProtectedPath = protectedPaths.some((path) =>
      location.pathname.startsWith(path)
    );

    if (!isProtectedPath) return; // Not a protected route

    // Redirect if not authenticated
    if (!user) {
      navigate("/signin", {
        replace: true,
        state: { from: location.pathname },
      });
      return;
    }

    // Redirect if not authorized
    if (!authorized) {
      navigate("/", {
        replace: true,
        state: {
          message:
            "You are not authorized to access the dashboard. Contact an administrator for access.",
          type: "unauthorized",
        },
      });
      return;
    }

    // Redirect if admin is required but user is not admin
    if (requireAdmin && !isAdmin) {
      navigate("/dashboard", {
        replace: true,
        state: {
          message: "Administrator privileges required for this feature.",
          type: "admin-required",
        },
      });
      return;
    }
  }, [
    user,
    loading,
    authorized,
    isAdmin,
    location.pathname,
    navigate,
    requireAdmin,
  ]);

  return {
    user,
    loading,
    authorized,
    isAdmin,
    canAccess: !loading && user && authorized && (!requireAdmin || isAdmin),
  };
}
