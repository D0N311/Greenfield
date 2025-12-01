import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import useStore from '../stores/useStore';

export function useAuth() {
  const { user, setUser, clearUser } = useStore();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [setUser]);

  const signOut = async () => {
    await supabase.auth.signOut();
    clearUser();
  };

  return { user, signOut };
}

