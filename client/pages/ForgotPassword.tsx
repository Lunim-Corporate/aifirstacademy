import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { BrainCircuit, Mail } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
// We'll create a new API function for the enhanced auth
const apiForgotPasswordStart = async (email: string): Promise<{ pendingId?: string; message: string }> => {
  const res = await fetch('/api/auth-v2/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to send reset code');
  }
  
  return res.json();
};

export default function ForgotPassword() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiForgotPasswordStart(email);
      if (res.pendingId) {
        sessionStorage.setItem("reset_pending_id", res.pendingId);
        sessionStorage.setItem("reset_pending_email", email);
        nav(`/reset-password?pending=${encodeURIComponent(res.pendingId)}&email=${encodeURIComponent(email)}`);
        return;
      }
      setSent(true);
    } catch (err: any) {
      alert(err.message || "Request failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary-50/30 to-brand-50/30 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-5"></div>
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center">
            <BrainCircuit className="h-8 w-8 text-brand-600" />
            <span className="ml-2 text-xl font-bold gradient-text">AI-First Academy</span>
          </Link>
        </div>
        <Card className="border-gray-200 dark:border-gray-700/50 shadow-2xl bg-background/80 backdrop-blur">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl font-bold">Reset your password</CardTitle>
            <CardDescription>We'll send a verification code to your email</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {sent ? (
              <div className="text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center mx-auto">
                  <Mail className="h-6 w-6" />
                </div>
                <p className="text-sm text-muted-foreground">If an account exists for {email}, you will receive an email with instructions.</p>
                <Link to="/login" className="text-brand-600 hover:text-brand-700 font-medium">Back to sign in</Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full">Send code</Button>
                <Separator />
                <div className="text-center text-sm">
                  <Link to="/login" className="text-brand-600 hover:text-brand-700">Back to sign in</Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

