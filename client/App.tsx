import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { loadAndApplyTheme } from "@/lib/theme";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Learning from "./pages/Learning";
import Sandbox from "./pages/Sandbox";
import Lesson from "./pages/Lesson";
import Community from "./pages/Community";
import Admin from "./pages/Admin";
import Library from "./pages/Library";
import Certificates from "./pages/Certificates";
import Settings from "./pages/Settings";
import ForgotPassword from "./pages/ForgotPassword";
import Product from "./pages/Product";
import VerifyCertificate from "./pages/VerifyCertificate";
import Pricing from "./pages/Pricing";
import Teams from "./pages/Teams";
import Resources from "./pages/Resources";
import FAQ from "./pages/FAQ";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";
import AuthCallback from "./pages/AuthCallback";
import VerifyOTP from "./pages/VerifyOTP";
import ResetPassword from "./pages/ResetPassword";

const queryClient = new QueryClient();

// Initialize and apply theme preference on app startup
loadAndApplyTheme();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/learning" element={<Learning />} />
            <Route path="/learning/:trackId/:moduleId/:lessonId" element={<Lesson />} />
            <Route path="/sandbox" element={<Sandbox />} />
            <Route path="/community" element={<Community />} />
            <Route path="/library" element={<Library />} />
            <Route path="/certificates" element={<Certificates />} />
            <Route path="/verify" element={<VerifyCertificate />} />
            <Route path="/verify/:credentialId" element={<VerifyCertificate />} />
            <Route path="/VerifyCertificate" element={<VerifyCertificate />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/product" element={<Product />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/faq" element={<FAQ />} />

            {/* Auth + recovery routes (canonical) */}
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-otp" element={<VerifyOTP />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Aliases for common variants */}
            <Route path="/ForgotPassword" element={<ForgotPassword />} />
            <Route path="/forgotpassword" element={<ForgotPassword />} />
            <Route path="/VerifyOTP" element={<VerifyOTP />} />
            <Route path="/verifyotp" element={<VerifyOTP />} />
            <Route path="/ResetPassword" element={<ResetPassword />} />
            <Route path="/resetpassword" element={<ResetPassword />} />
            <Route path="/AuthCallBack" element={<AuthCallback />} />
            <Route path="/AuthCallback" element={<AuthCallback />} />
            <Route path="/index" element={<Index />} />

            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
