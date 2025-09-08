import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BrainCircuit, CheckCircle2 } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { apiOtpVerify } from "@/lib/api";

export default function VerifyOTP() {
  const nav = useNavigate();
  const loc = useLocation();
  const params = useMemo(() => new URLSearchParams(loc.search), [loc.search]);
  const [code, setCode] = useState("");
  const [email, setEmail] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const p = params.get("pending") || sessionStorage.getItem("auth_pending_id") || "";
    const e = params.get("email") || sessionStorage.getItem("auth_pending_email") || "";
    setPendingId(p || null);
    setEmail(e || null);
  }, [params]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingId || code.trim().length < 6) return;
    setVerifying(true);
    try {
      const { token } = await apiOtpVerify({ pendingId, code: code.trim() });
      localStorage.setItem("auth_token", token);
      setOk(true);
      sessionStorage.removeItem("auth_pending_id");
      sessionStorage.removeItem("auth_pending_email");
      setTimeout(() => nav("/dashboard", { replace: true }), 800);
    } catch (err: any) {
      alert(err?.message || "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary-50/30 to-brand-50/30 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-5" />
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center">
            <BrainCircuit className="h-8 w-8 text-brand-600" />
            <span className="ml-2 text-xl font-bold gradient-text">AI-First Academy</span>
          </Link>
        </div>
        <div className="border border-border/50 shadow-2xl bg-background/80 backdrop-blur rounded-lg">
          <div className="p-6 text-center space-y-2">
            <div className="text-2xl font-bold">Enter verification code</div>
            <div className="text-sm text-muted-foreground">We sent a 6-digit code to {email || "your email"}</div>
          </div>
          <Separator />
          <form onSubmit={handleVerify} className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">One-time code</Label>
              <Input id="code" placeholder="123456" value={code} onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, "").slice(0,6))} />
            </div>
            <Button type="submit" className="w-full" disabled={!pendingId || verifying || code.length < 6}>
              Verify
            </Button>
            <div className="text-center text-xs text-muted-foreground">Code expires in 10 minutes.</div>
          </form>
          {ok && (
            <div className="px-6 pb-6">
              <div className="flex items-center justify-center text-green-600 gap-2">
                <CheckCircle2 className="h-5 w-5" /> Verified
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
