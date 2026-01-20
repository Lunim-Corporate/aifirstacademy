import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { BrainCircuit, Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { apiOAuthMock, apiOAuthProviders } from "@/lib/api";
import { validatePassword } from "@/lib/password-validation";

// Enhanced signup API function
const apiSignupStartEnhanced = async (name: string, email: string, password: string): Promise<{ pendingId: string }> => {
  const res = await fetch('/api/auth-v2/signup/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, role: 'marketer' })
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Signup failed');
  }
  
  return res.json();
};

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  company: string;
}



export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [providers, setProviders] = useState<string[]>([]);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    apiOAuthProviders().then(({ providers }) => setProviders(providers)).catch(() => setProviders([]));
  }, []);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    company: "",
  });

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Real-time password validation
    if (field === "password") {
      const validation = validatePassword(value);
      setPasswordError(validation.valid ? null : validation.errors[0] || null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password before proceeding
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.valid) {
      setPasswordError(passwordValidation.errors[0] || "Password does not meet requirements");
      return; // Prevent form submission
    }
    
    // If already authenticated (e.g., via SSO), just proceed
    const existing = localStorage.getItem("auth_token");
    if (existing) {
      sessionStorage.setItem("just_signed_in", "true");
      navigate("/learning");
      return;
    }
    
    try {
      const name = `${formData.firstName} ${formData.lastName}`.trim();
      const { pendingId } = await apiSignupStartEnhanced(name, formData.email, formData.password);
      sessionStorage.setItem("auth_pending_id", pendingId);
      sessionStorage.setItem("auth_pending_email", formData.email);
      sessionStorage.setItem("auth_flow", "signup"); // Set flow for verification page
      navigate(`/verify-otp?pending=${encodeURIComponent(pendingId)}&email=${encodeURIComponent(formData.email)}`);
    } catch (err: any) {
      // Handle backend validation errors
      if (err.message && err.message.includes("Password")) {
        setPasswordError(err.message);
      } else {
        alert(err.message || "Signup failed");
      }
    }
  };

  const handleOAuthSignup = async (provider: string) => {
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
      const name = `${formData.firstName || email.split("@")[0]} ${formData.lastName || ""}`.trim();
      const { token } = await apiOAuthMock(provider, email, name);
      localStorage.setItem("auth_token", token);
      window.dispatchEvent(new Event('auth-changed'));
      sessionStorage.setItem("just_signed_in", "true");
      navigate("/learning");
    } catch (e: any) {
      alert(e?.message || "SSO sign-up failed");
    }
  };

  const canProceed = () => {
    const passwordValidation = validatePassword(formData.password);
    return formData.firstName && formData.lastName && formData.email && formData.password && passwordValidation.valid;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary-50/30 to-brand-50/30 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-5"></div>
      
      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center">
            <BrainCircuit className="h-8 w-8 text-primary-600" />
            <span className="ml-2 text-xl font-bold" style={{background: 'linear-gradient(to right, #2563eb, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'white'}}>AI-First Marketing Academy</span>
          </Link>
        </div>

        <Card className="border-gray-200 dark:border-gray-700/50 shadow-2xl bg-background/80 backdrop-blur">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl font-bold">
              Create your account
            </CardTitle>
            <CardDescription>
              Start your AI mastery journey today
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* OAuth Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                onClick={() => handleOAuthSignup("google")}
                className="relative"
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleOAuthSignup("microsoft")}
                className="relative"
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
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

            {/* Personal Info Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a secure password (min. 8 chars, 1 uppercase, 1 digit, 1 special char)"
                    value={formData.password}
                    onChange={(e) => {
                      handleInputChange("password", e.target.value);

                      // Password validation
                      const value = e.target.value;
                      let errorMsg = "";
                      if (value.length < 8) {
                        errorMsg = "Password must be at least 8 characters long";
                      } else if (!/[A-Z]/.test(value)) {
                        errorMsg = "Password must contain at least one uppercase letter";
                      } else if (!/[0-9]/.test(value)) {
                        errorMsg = "Password must contain at least one digit";
                      } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
                        errorMsg = "Password must contain at least one special character";
                      }
                      setPasswordError(errorMsg);
                    }}
                    required
                    className={passwordError ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>

                {passwordError && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                      <path
                        fillRule="evenodd"
                        d="M6.701 2.25c.577-1 2.02-1 2.598 0l5.196 9a1.5 1.5 0 0 1-1.299 2.25H2.804a1.5 1.5 0 0 1-1.3-2.25l5.197-9ZM8 10.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM8 5a.75.75 0 0 1 .75.75v2.5a.75.75 0 0 1-1.5 0v-2.5A.75.75 0 0 1 8 5Z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {passwordError}
                  </p>
                )}
              </div>


              <div className="space-y-2">
                <Label htmlFor="company">Company (Optional)</Label>
                <Input
                  id="company"
                  placeholder="Your company name"
                  value={formData.company}
                  onChange={(e) => handleInputChange("company", e.target.value)}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-[#bdeeff] hover:bg-[#bdeeff]/90 text-black"
                disabled={!canProceed()}
              >
                Create Account
              </Button>
            </form>

            <Separator />

            {/* Enterprise SSO */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-3">
                Enterprise team?
              </p>
              <Button variant="outline" className="w-full" onClick={() => handleOAuthSignup("sso")}>
                Sign up with SSO
              </Button>
            </div>

            {/* Sign in link */}
            <div className="text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <Link to="/login" className="text-white hover:text-white font-medium transition-colors">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Footer text */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          By signing up, you agree to our{" "}
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

