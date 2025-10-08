import { useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { apiMeCookie, apiMe } from "@/lib/api";

export default function AuthCallback() {
  const nav = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    (async () => {
      // 1) Try query param ?token=
      const params = new URLSearchParams(loc.search);
      const qToken = params.get("token");
      if (qToken) {
        try { localStorage.setItem("auth_token", qToken); } catch {}
        nav("/dashboard", { replace: true });
        return;
      }
      // 2) Try hash fragment #token=
      const hash = new URLSearchParams((loc.hash || "").replace(/^#/, ""));
      const hToken = hash.get("token");
      if (hToken) {
        try { localStorage.setItem("auth_token", hToken); } catch {}
        nav("/dashboard", { replace: true });
        return;
      }
      // 3) If local token exists and valid
      const local = localStorage.getItem("auth_token");
      if (local) {
        try { await apiMe(local); nav("/dashboard", { replace: true }); return; } catch {}
      }
      // 4) Try cookie-based session (server sets cookie on OAuth)
      try {
        await apiMeCookie();
        // We still prefer storing a token for API calls; but if absent, proceed to dashboard
        nav("/dashboard", { replace: true });
        return;
      } catch {}
      // If everything fails, stay and show button
    })();
  }, [loc.search, loc.hash, nav]);

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="space-y-4 text-center">
        <div className="text-xl font-semibold">Completing sign-in…</div>
        <div className="text-sm text-muted-foreground">If you are not redirected automatically, click below.</div>
        <Button onClick={() => nav("/dashboard", { replace: true })}>Continue</Button>
        <div className="text-xs text-muted-foreground">If this keeps happening, return to the <Link to="/login" className="underline">login</Link> page.</div>
      </div>
    </div>
  );
}

