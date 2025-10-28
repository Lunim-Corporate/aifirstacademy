import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { AuthUser } from "@shared/api";
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
    try {
      // Prefer cookie-based session first
      const meCookie = await apiMeCookie();
      setUser(meCookie.user);
      return;
    } catch {}

    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        setUser(null);
        return;
      }
      const me = await apiMe(token);
      setUser(me.user);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchUser();
      setLoading(false);
    })();

    const onAuthChanged = () => {
      setLoading(true);
      fetchUser().finally(() => setLoading(false));
    };

    // Listen for auth changes within the app and across tabs
    window.addEventListener("auth-changed", onAuthChanged as any);
    window.addEventListener("storage", (e) => {
      if (e.key === "auth_token") onAuthChanged();
    });
    window.addEventListener("focus", onAuthChanged);

    return () => {
      window.removeEventListener("auth-changed", onAuthChanged as any);
      window.removeEventListener("focus", onAuthChanged);
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