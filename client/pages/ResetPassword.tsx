import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { BrainCircuit, Eye, EyeOff, Clock, RefreshCw } from "lucide-react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { validatePassword } from "@/lib/password-validation";

// Enhanced API functions
const apiResetPassword = async (pendingId: string, code: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
  const res = await fetch('/api/auth-v2/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pendingId, code, newPassword })
  });
  
  if (!res.ok) {
    const error = await res.json();
    const errorObj = new Error(error.error || 'Password reset failed');
    // Attach response and error data for better error handling
    (errorObj as any).response = res;
    (errorObj as any).errorData = error;
    throw errorObj;
  }
  
  return res.json();
};

const apiResendCode = async (email: string, purpose: 'reset'): Promise<{ pendingId: string; attemptsLeft: number; cooldownSeconds: number }> => {
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

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Form state
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  
  // Resend functionality
  const [canResend, setCanResend] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(60);
  const [resendLoading, setResendLoading] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  
  // Get email and pendingId from URL or sessionStorage
  const urlEmail = searchParams.get('email');
  const urlPendingId = searchParams.get('pending');
  const [email] = useState(urlEmail || sessionStorage.getItem('reset_pending_email') || '');
  const [pendingId, setPendingId] = useState(urlPendingId || sessionStorage.getItem('reset_pending_id') || '');

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

  // Validate form with complexity requirements
  const isFormValid = () => {
    if (code.length !== 6) return false;
    if (newPassword !== confirmPassword) return false;
    
    const passwordValidation = validatePassword(newPassword);
    return passwordValidation.valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password before submission
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      setPasswordError(passwordValidation.errors[0] || "Password does not meet requirements");
      setPasswordErrors(passwordValidation.errors);
      setError("Please fix the password errors below");
      return;
    }

    if (code.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");
    setPasswordError(null);
    setPasswordErrors([]);

    try {
      await apiResetPassword(pendingId, code, newPassword);
      setSuccess(true);
      
      // Clear stored data
      sessionStorage.removeItem('reset_pending_id');
      sessionStorage.removeItem('reset_pending_email');
      
      // Auto redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      let errorMessage = err.message || "Password reset failed";
      
      // Try to get error data from the attached errorData
      if (err.errorData) {
        const errorData = err.errorData;
        errorMessage = errorData.error || errorMessage;
        
        // Handle migration required error
        if (errorData.code === 'MIGRATION_REQUIRED') {
          setError('Database migration required. Please contact support.');
          console.error('Migration required:', errorData.details);
          return;
        }
        
        // Handle backend validation errors with details
        if (errorData.details && Array.isArray(errorData.details)) {
          setPasswordErrors(errorData.details);
        }
      }
      
      setError(errorMessage);
      
      // Handle backend validation errors with details
      if (errorMessage.includes('Password') || errorMessage.includes('requirements') || errorMessage.includes('Migration')) {
        setPasswordError(errorMessage);
      }
      
      console.error('Password reset error:', err);
      console.error('Error details:', err.errorData);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend || resendLoading) return;

    setResendLoading(true);
    setError("");

    try {
      const result = await apiResendCode(email, 'reset');
      setPendingId(result.pendingId);
      sessionStorage.setItem('reset_pending_id', result.pendingId);
      
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
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <CardTitle className="text-2xl font-bold text-green-600">Password Reset Successfully!</CardTitle>
              <CardDescription>
                Your password has been updated. You'll be redirected to sign in shortly.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <Button asChild className="w-full">
                  <Link to="/login">Sign In Now</Link>
                </Button>
              </div>
            </CardContent>
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
            <BrainCircuit className="h-8 w-8 text-brand-600" />
            <span className="ml-2 text-xl font-bold gradient-text">AI-First Academy</span>
          </Link>
        </div>

        <Card className="border-gray-200 dark:border-gray-700/50 shadow-2xl bg-background/80 backdrop-blur">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl font-bold">Reset Your Password</CardTitle>
            <CardDescription>
              Enter the verification code sent to {email}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
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
                />
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password (min. 8 chars with complexity)"
                    value={newPassword}
                    onChange={(e) => {
                      const value = e.target.value;
                      setNewPassword(value);
                      
                      // Real-time validation
                      if (value.length > 0) {
                        const validation = validatePassword(value);
                        if (!validation.valid) {
                          setPasswordError(validation.errors[0] || null);
                          setPasswordErrors(validation.errors);
                        } else {
                          setPasswordError(null);
                          setPasswordErrors([]);
                        }
                      } else {
                        setPasswordError(null);
                        setPasswordErrors([]);
                      }
                      
                      if (error) setError("");
                    }}
                    required
                    className={passwordError ? "border-red-500 focus-visible:ring-red-500" : ""}
                    minLength={8}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                
                {/* Password Requirements */}
                {newPassword.length > 0 && (
                  <div className="text-xs space-y-1">
                    <p className="text-muted-foreground font-medium">Password must contain:</p>
                    <ul className="list-disc list-inside space-y-0.5 ml-2">
                      <li className={newPassword.length >= 8 ? "text-green-600" : "text-red-500"}>
                        At least 8 characters
                      </li>
                      <li className={/[a-z]/.test(newPassword) ? "text-green-600" : "text-red-500"}>
                        One lowercase letter
                      </li>
                      <li className={/[A-Z]/.test(newPassword) ? "text-green-600" : "text-red-500"}>
                        One uppercase letter
                      </li>
                      <li className={/[0-9]/.test(newPassword) ? "text-green-600" : "text-red-500"}>
                        One number
                      </li>
                      <li className={/[!@#$%^&*(),.?":{}|<>]/.test(newPassword) ? "text-green-600" : "text-red-500"}>
                        One special character (!@#$%^&*(),.?":{}|&lt;&gt;)
                      </li>
                    </ul>
                  </div>
                )}
                
                {/* Password Validation Errors */}
                {passwordError && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M6.701 2.25c.577-1 2.02-1 2.598 0l5.196 9a1.5 1.5 0 0 1-1.299 2.25H2.804a1.5 1.5 0 0 1-1.3-2.25l5.197-9ZM8 10.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM8 5a.75.75 0 0 1 .75.75v2.5a.75.75 0 0 1-1.5 0v-2.5A.75.75 0 0 1 8 5Z" clipRule="evenodd" />
                    </svg>
                    {passwordError}
                  </p>
                )}
                
                {/* Show all errors if multiple */}
                {passwordErrors.length > 1 && (
                  <div className="text-xs text-red-500 space-y-1">
                    {passwordErrors.slice(1).map((err, idx) => (
                      <p key={idx} className="flex items-center gap-1">
                        <span>•</span> {err}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-500">Passwords do not match</p>
                )}
              </div>

              {/* Error Message */}
              {error && !error.includes('Password') && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-primary-600 to-brand-600 hover:from-primary-700 hover:to-brand-700"
                disabled={loading || !isFormValid()}
              >
                {loading ? "Resetting Password..." : "Reset Password"}
              </Button>
            </form>

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

            {/* Back to Login */}
            <div className="text-center text-sm border-t pt-4">
              <Link to="/login" className="text-brand-600 hover:text-brand-700 font-medium transition-colors">
                ← Back to Sign In
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Footer text */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          By resetting your password, you agree to our{" "}
          <Link to="/terms" className="underline hover:text-foreground transition-colors">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link to="/privacy" className="underline hover:text-foreground transition-colors">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}

