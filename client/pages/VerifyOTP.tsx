import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { BrainCircuit, CheckCircle2, Clock, RefreshCw } from "lucide-react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

// Enhanced API functions
const apiOtpVerify = async (data: { pendingId: string; code: string }): Promise<{ token: string }> => {
  const res = await fetch('/api/auth-v2/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Verification failed');
  }
  
  return res.json();
};

const apiResendCode = async (email: string, purpose: 'signup' | 'login'): Promise<{ pendingId: string; attemptsLeft: number; cooldownSeconds: number }> => {
  const res = await fetch('/api/auth-v2/resend-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, purpose })
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to resend code');
  }
  
  return res.json();
};

export default function VerifyOTP() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Form state
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  
  // Resend functionality
  const [canResend, setCanResend] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(60);
  const [resendLoading, setResendLoading] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  
  // Get data from URL or sessionStorage
  const urlEmail = searchParams.get('email');
  const urlPendingId = searchParams.get('pending');
  const [email] = useState(urlEmail || sessionStorage.getItem('auth_pending_email') || '');
  const [pendingId, setPendingId] = useState(urlPendingId || sessionStorage.getItem('auth_pending_id') || '');
  
  // Determine purpose (signup or login)
  const [purpose] = useState<'signup' | 'login'>(() => {
    // Try to determine from URL or storage
    const currentPath = window.location.pathname;
    if (currentPath.includes('signup') || sessionStorage.getItem('auth_flow') === 'signup') {
      return 'signup';
    }
    return 'login';
  });

  // Countdown timer for resend button
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(prev => {
          if (prev === 1) {
            setCanResend(true);
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pendingId || code.trim().length < 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    setVerifying(true);
    setError("");

    try {
      const { token } = await apiOtpVerify({ pendingId, code: code.trim() });
      localStorage.setItem("auth_token", token);
      // Broadcast auth change so UI updates immediately without refresh
      window.dispatchEvent(new Event('auth-changed'));
      setSuccess(true);
      
      // Clear stored data
      sessionStorage.removeItem("auth_pending_id");
      sessionStorage.removeItem("auth_pending_email");
      sessionStorage.removeItem("auth_flow");
      
      // Auto redirect after success
      setTimeout(() => navigate("/dashboard", { replace: true }), 800);
    } catch (err: any) {
      setError(err.message || "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend || resendLoading) return;

    setResendLoading(true);
    setError("");

    try {
      const result = await apiResendCode(email, purpose);
      setPendingId(result.pendingId);
      sessionStorage.setItem('auth_pending_id', result.pendingId);
      
      setResendCountdown(result.cooldownSeconds || 60);
      setCanResend(false);
      setIsBlocked(false);
      
      // Clear any existing error
      setError("");
    } catch (err: any) {
      if (err.message.includes('temporarily blocked') || err.message.includes('too many')) {
        setError("Please try again later.");
        setCanResend(false);
        setIsBlocked(true);
      } else {
        setError("Unable to resend code. Please try again.");
      }
    } finally {
      setResendLoading(false);
    }
  };

  if (success) {
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
              <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <CardTitle className="text-2xl font-bold text-green-600">Verified Successfully!</CardTitle>
              <CardDescription>
                Welcome to AI-First Academy! Redirecting you to your dashboard...
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary-50/30 to-brand-50/30 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-5"></div>
      
      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center">
            <BrainCircuit className="h-8 w-8 text-primary-600" />
            <span className="ml-2 text-xl font-bold" style={{color: 'white'}}>AI-First Marketing Academy</span>
          </Link>
        </div>

        <Card className="border-gray-200 dark:border-gray-700/50 shadow-2xl bg-background/80 backdrop-blur">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl font-bold">Enter Verification Code</CardTitle>
            <CardDescription>
              We sent a 6-digit code to {email}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleVerify} className="space-y-4">
              {/* Verification Code */}
              <div className="space-y-2">
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="text-center text-lg tracking-wider font-mono"
                  maxLength={6}
                  required
                  autoComplete="one-time-code"
                  autoFocus
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-primary-700 to-brand-700 hover:from-primary-800 hover:to-brand-800 text-white disabled:opacity-50 transition-all duration-200"
                disabled={verifying || code.length < 6}
              >
                {verifying ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Verifying Code...
                  </>
                ) : (
                  "Verify Code"
                )}
              </Button>
            </form>

            {/* Code expiry notice */}
            <div className="text-center text-xs text-muted-foreground bg-amber-50 border border-amber-200 rounded-lg p-3">
              <Clock className="w-4 h-4 inline mr-1" />
              Code expires in 10 minutes
            </div>

            {/* Resend Code Section */}
            <div className="border-t pt-4">
              <div className="text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  Didn't receive the code?
                </p>
                
                {canResend ? (
                  <Button
                    variant="outline"
                    onClick={handleResendCode}
                    disabled={resendLoading}
                    className="w-full"
                  >
                    {resendLoading ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : null}
                    Resend Code
                  </Button>
                ) : (
                  <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>Resend available in {resendCountdown}s</span>
                  </div>
                )}
                
                {isBlocked && (
                  <p className="text-xs text-amber-600">
                    Too many requests. Please wait before trying again.
                  </p>
                )}
              </div>
            </div>

            {/* Back to previous step */}
            <div className="text-center text-sm border-t pt-4">
              <Link 
                to={purpose === 'signup' ? '/signup' : '/login'} 
                className="text-brand-600 hover:text-brand-700 font-medium transition-colors"
              >
                ← Back to {purpose === 'signup' ? 'Sign Up' : 'Sign In'}
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Footer text */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Having trouble? Check your spam folder or{" "}
          <Link to="/support" className="underline hover:text-foreground transition-colors">
            contact support
          </Link>
        </p>
      </div>
    </div>
  );
}

