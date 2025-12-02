import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { BrainCircuit, Eye, EyeOff, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { apiLoginStart, apiOAuthMock, apiOAuthProviders } from "@/lib/api";
import { validatePassword } from "@/lib/password-validation";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [providers, setProviders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Load OAuth providers
    apiOAuthProviders().then(({ providers }) => setProviders(providers)).catch(() => setProviders([]));
    
    // Prevent back navigation after logout - if user tries to go back, redirect to login
    const handlePopState = (e: PopStateEvent) => {
      // Check if user is logged out (no token)
      const token = localStorage.getItem("auth_token");
      if (!token) {
        // Replace current history entry with login to prevent further back navigation
        window.history.replaceState(null, "", "/login");
      }
    };
    
    window.addEventListener("popstate", handlePopState);
    
    // Also replace history entry on mount if no token (prevents back to protected pages)
    const token = localStorage.getItem("auth_token");
    if (!token) {
      window.history.replaceState(null, "", "/login");
    }
    
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setError("");
    setPasswordError(null);

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    // Validate password format
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setPasswordError(passwordValidation.errors[0] || "Password does not meet requirements");
      setError(passwordValidation.errors[0] || "Password does not meet requirements");
      return; // Prevent form submission
    }

    if (isLoading) return; // Prevent double submission
    
    setIsLoading(true);
    try {
      // Use enhanced auth-v2 endpoint
      const res = await fetch('/api/auth-v2/login/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        // Handle password reset required
        if (errorData.code === 'PASSWORD_RESET_REQUIRED' || errorData.requiresReset) {
          setError('Password reset required. Please reset your password to continue.');
          // Redirect to forgot password after a short delay
          setTimeout(() => {
            navigate('/forgot-password?email=' + encodeURIComponent(email));
          }, 2000);
          return;
        }
        // Handle backend password validation errors
        if (errorData.code === 'WEAK_PASSWORD' || (errorData.error && errorData.error.includes('Password'))) {
          setPasswordError(errorData.error || 'Password does not meet requirements');
          setError(errorData.error || 'Password does not meet requirements');
        } else {
          throw new Error(errorData.error || 'Login failed');
        }
        return;
      }
      
      const { pendingId } = await res.json();
      sessionStorage.setItem("auth_pending_id", pendingId);
      sessionStorage.setItem("auth_pending_email", email);
      sessionStorage.setItem("auth_flow", "login"); // Set flow for verification page
      navigate(`/verify-otp?pending=${encodeURIComponent(pendingId)}&email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      const errorMessage = err.message || "Login failed";
      setError(errorMessage);
      if (errorMessage.includes('Password')) {
        setPasswordError(errorMessage);
      }
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: string) => {
    const enabled = new Set(providers);
    const pick = (p: string) => (enabled.has(p) ? p : "");
    let target = provider;
    if (provider === "sso") target = pick("google") || pick("microsoft") || "";
    if (target) {
      window.location.href = `/api/auth/oauth/${target}/start?redirect=/auth/callback`;
      return;
    }
    const email = window.prompt("Enter your work email for SSO:")?.trim();
    if (!email) return;
    try {
      const name = email.split("@")[0];
      const { token } = await apiOAuthMock(provider, email, name);
      localStorage.setItem("auth_token", token);
      window.dispatchEvent(new Event('auth-changed'));
      navigate("/dashboard");
    } catch (e: any) {
      alert(e?.message || "SSO sign-in failed");
    }
  };

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
            <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
            <CardDescription>
              Sign in to continue your AI learning journey
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* OAuth Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <Button
              variant="outline"
              onClick={() => handleOAuthLogin("google")}
              className="bg-black text-white border-white hover:bg-black hover:text-white"
            >
              <svg
                className="w-4 h-4 mr-2 text-white"
                viewBox="0 0 24 24"
              >
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </Button>
              <Button
                variant="outline"
                onClick={() => handleOAuthLogin("microsoft")}
                className="bg-black text-white border-white hover:bg-black hover:text-white"
              >
                <svg
                  className="w-4 h-4 mr-2 text-white hover:opacity-90"
                  viewBox="0 0 24 24"
                >
                  <path fill="currentColor" d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"/>
                </svg>
                Microsoft
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
              </div>
            </div>

            {/* Email Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError(""); // Clear error on input change
                      if (passwordError) setPasswordError(null); // Clear password error on input change
                      // Real-time validation
                      if (e.target.value.length > 0) {
                        const validation = validatePassword(e.target.value);
                        if (!validation.valid) {
                          setPasswordError(validation.errors[0] || null);
                        } else {
                          setPasswordError(null);
                        }
                      }
                    }}
                    required
                    className={error || passwordError ? "border-red-500 focus-visible:ring-red-500" : ""}
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
                {(passwordError || (error && error.includes('Password'))) && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M6.701 2.25c.577-1 2.02-1 2.598 0l5.196 9a1.5 1.5 0 0 1-1.299 2.25H2.804a1.5 1.5 0 0 1-1.3-2.25l5.197-9ZM8 10.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM8 5a.75.75 0 0 1 .75.75v2.5a.75.75 0 0 1-1.5 0v-2.5A.75.75 0 0 1 8 5Z" clipRule="evenodd" />
                    </svg>
                    {passwordError || error}
                  </p>
                )}
                {error && !error.includes('Password') && (
                  <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M6.701 2.25c.577-1 2.02-1 2.598 0l5.196 9a1.5 1.5 0 0 1-1.299 2.25H2.804a1.5 1.5 0 0 1-1.3-2.25l5.197-9ZM8 10.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM8 5a.75.75 0 0 1 .75.75v2.5a.75.75 0 0 1-1.5 0v-2.5A.75.75 0 0 1 8 5Z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </p>
                )}
                {password.length > 0 && password.length < 8 && !passwordError && (
                  <p className="text-xs text-muted-foreground">
                    Password must be at least 8 characters long
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded border-gray-300" />
                  <span className="text-muted-foreground">Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-brand-600 hover:text-brand-700 transition-colors">
                  Forgot password?
                </Link>
              </div>

              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-primary-600 to-brand-600 hover:from-primary-700 hover:to-brand-700 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <Separator />

            {/* Enterprise SSO */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-3">
                Enterprise user?
              </p>
              <Button
                variant="outline"
                onClick={() => handleOAuthLogin("sso")}
                className="w-full bg-black text-white border-white hover:bg-black hover:text-white"
              >
                Sign in with SSO
              </Button>
            </div>

            {/* Sign up link */}
            <div className="text-center text-sm">
              <span className="text-muted-foreground">Don't have an account? </span>
              <Link to="/signup" className="text-brand-600 hover:text-brand-700 font-medium transition-colors">
                Sign up for free
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Footer text */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          By signing in, you agree to our{" "}
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

