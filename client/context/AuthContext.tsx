import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { AuthUser, MeResponse } from "@shared/api";
import { apiMe, apiMeCookie } from "@/lib/api";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    // Check for token first to avoid unnecessary API calls
    const token = localStorage.getItem("auth_token");
    if (!token) {
      setUser(null);
      return;
    }

    try {
      // Prefer cookie-based session first (has built-in 2s timeout)
      const meCookie = await apiMeCookie();
      setUser(meCookie.user);
      return;
    } catch {
      // If cookie-based auth fails, try token-based (faster, no timeout needed)
      try {
        const me = await apiMe(token);
        setUser(me.user);
      } catch {
        setUser(null);
        // Clear invalid token
        localStorage.removeItem("auth_token");
      }
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    (async () => {
      setLoading(true);
      await fetchUser();
      if (isMounted) {
        setLoading(false);
      }
    })();

    const onAuthChanged = () => {
      if (!isMounted) return;
      setLoading(true);
      fetchUser().finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });
    };

    // Listen for auth changes within the app and across tabs
    window.addEventListener("auth-changed", onAuthChanged as any);
    window.addEventListener("storage", (e) => {
      if (e.key === "auth_token" && isMounted) {
        onAuthChanged();
      }
    });
    
    // Removed focus event listener to prevent automatic logout/re-authentication
    // This was causing unwanted refreshes and potential logout issues

    return () => {
      isMounted = false;
      window.removeEventListener("auth-changed", onAuthChanged as any);
      window.removeEventListener("storage", onAuthChanged);
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    refresh: async () => {
      setLoading(true);
      await fetchUser();
      setLoading(false);
    },
  }), [user, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}