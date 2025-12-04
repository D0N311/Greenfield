import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import useStore from "../stores/useStore";

export function useAuth() {
  const { user, setUser, clearUser } = useStore();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [role, setRole] = useState(null);
  const [canHardDelete, setCanHardDelete] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAuthorization(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAuthorization(session.user.id);
      } else {
        clearAuthState();
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser]);

  const checkAuthorization = async (userId) => {
    try {
      setLoading(true);

      // Check authorization using our custom function
      const { data: authData, error: authError } = await supabase.rpc(
        "get_user_authorization",
        { user_uuid: userId }
      );

      if (authError) throw authError;

      if (authData && authData.length > 0) {
        const auth = authData[0];
        setAuthorized(auth.authorized);
        setRole(auth.user_role);
        setCanHardDelete(auth.can_hard_delete);
      } else {
        setAuthorized(false);
        setRole("Unauthorized");
        setCanHardDelete(false);
      }
    } catch (error) {
      console.error("Authorization check error:", error);
      setAuthorized(false);
      setRole("Unauthorized");
      setCanHardDelete(false);
    } finally {
      setLoading(false);
    }
  };

  const clearAuthState = () => {
    setAuthorized(false);
    setRole(null);
    setCanHardDelete(false);
    setLoading(false);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    clearUser();
    clearAuthState();
  };

  return {
    user,
    loading,
    authorized,
    role,
    canHardDelete,
    isAdmin: role === "Admin",
    isUser: role === "User",
    signOut,
    refresh: () => user && checkAuthorization(user.id),
  };
}
