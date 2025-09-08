import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BrainCircuit } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { apiResetComplete } from "@/lib/api";

export default function ResetPassword() {
  const nav = useNavigate();
  const loc = useLocation();
  const params = useMemo(() => new URLSearchParams(loc.search), [loc.search]);
  const [code, setCode] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const p = params.get("pending") || sessionStorage.getItem("reset_pending_id") || "";
    const e = params.get("email") || sessionStorage.getItem("reset_pending_email") || "";
    setPendingId(p || null);
    setEmail(e || null);
  }, [params]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingId || code.length < 6 || pw1.length < 6 || pw1 !== pw2) return;
    setSubmitting(true);
    try {
      await apiResetComplete({ pendingId, code, newPassword: pw1 });
      alert("Password updated. Please sign in.");
      sessionStorage.removeItem("reset_pending_id");
      sessionStorage.removeItem("reset_pending_email");
      nav("/login", { replace: true });
    } catch (err: any) {
      alert(err?.message || "Reset failed");
    } finally {
      setSubmitting(false);
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
            <div className="text-2xl font-bold">Reset password</div>
            <div className="text-sm text-muted-foreground">Enter the code sent to {email || "your email"} and a new password</div>
          </div>
          <Separator />
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Verification code</Label>
              <Input id="code" placeholder="123456" value={code} onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, "").slice(0,6))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pw1">New password</Label>
              <Input id="pw1" type="password" value={pw1} onChange={(e) => setPw1(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pw2">Confirm new password</Label>
              <Input id="pw2" type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={!pendingId || submitting || code.length < 6 || pw1.length < 6 || pw1 !== pw2}>
              Update password
            </Button>
            <div className="text-center text-sm">
              <Link to="/login" className="text-brand-600 hover:text-brand-700">Back to sign in</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
