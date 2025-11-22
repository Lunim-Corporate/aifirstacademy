import type {
  AuthResponse,
  MeResponse,
  SandboxRunRequest,
  SandboxRunResponse,
  LibraryResourcesResponse,
  CreateLibraryResourceRequest,
  CreateLibraryResourceResponse,
  DeleteLibraryResourceResponse,
  ListPromptsResponse,
  ListPromptCommentsResponse,
  CreatePromptCommentRequest,
  CreatePromptCommentResponse,
  ListDiscussionsResponse,
  CreateDiscussionRequest,
  CreateDiscussionResponse,
  ListDiscussionRepliesResponse,
  CreateDiscussionReplyRequest,
  CreateDiscussionReplyResponse,
  DiscussionViewResponse,
  ListChallengesResponse,
  GetChallengeResponse,
  SubmitChallengeEntryRequest,
  SubmitChallengeEntryResponse,
  PromptMetricResponse,
  ChallengeMetricResponse,
  OTPStartResponse,
  OTPVerifyRequest,
  ForgotPasswordStartResponse,
  ResetPasswordCompleteRequest,
  ResetPasswordCompleteResponse,
  SearchResponse,
  ListNotificationsResponse,
  MarkReadResponse,
  MarketingProductResponse,
  PricingResponse,
  CheckoutStartRequest,
  CheckoutStartResponse,
  TeamInquiryRequest,
  TeamInquiryResponse,
  MarketingResourcesResponse,
  NewsletterRequest,
  NewsletterResponse,
} from "@shared/api";
import { supabase } from './supabaseClient';
// Certificate types
interface CertificateRequirements {
  completion: {
    progress: number;
    total: number;
    percentage: number;
    weight: number;
    description: string;
  };
  assessment: {
    progress: number;
    total: number;
    percentage: number;
    weight: number;
    description: string;
  };
  projects: {
    progress: number;
    total: number;
    percentage: number;
    weight: number;
    description: string;
  };
  timeCommitment: {
    progress: number;
    total: number;
    percentage: number;
    weight: number;
    description: string;
  };
  engagement: {
    progress: number;
    total: number;
    percentage: number;
    weight: number;
    description: string;
  };
}

interface CertificateRequirementsResponse {
  track: any;
  requirements: CertificateRequirements;
  overallProgress: number;
  isEligible: boolean;
  completedRequirements: number;
}

interface Certificate {
  id: string;
  certificateId: string;
  userId: string;
  trackId: string;
  trackTitle: string;
  userRole: string;
  completionDate: string;
  verificationHash: string;
  isVerified: boolean;
  metadata: {
    completedLessons: number;
    totalLessons: number;
    completionPercentage: number;
    generatedAt: string;
  };
}

interface GenerateCertificateResponse {
  certificate: Certificate;
  message: string;
}

interface UserCertificatesResponse {
  certificates: Certificate[];
}

const headers = { "Content-Type": "application/json" };

// Helper function to clear all auth state
export function clearAuthState() {
  localStorage.removeItem('auth_token');
  // Note: HttpOnly cookies can't be cleared from JavaScript - server handles this
  // Clear any session storage
  sessionStorage.removeItem('auth_pending_id');
  sessionStorage.removeItem('auth_pending_email');
}

function authHeaders() {
  const token = localStorage.getItem("auth_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}
async function fetchJsonOnce<T = any>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  // Standard JSON fetch function

  let res: Response;
  try {
    res = await fetch(input, init);
  } catch (e: any) {
    // Normalize network-level failures (CORS, DNS, offline) to a friendly error
    throw new Error(e?.message || "Network request failed");
  }
  let text = "";
  try {
    text = await (typeof (res as any).clone === "function" ? (res as any).clone().text() : res.text());
  } catch {
    text = "";
  }
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }
  if (!res.ok) {
    if (res.status === 401) throw new Error("Unauthorized");
    if (res.status === 403) throw new Error("Forbidden");
    throw new Error(data?.error || data?.message || `Request failed (${res.status})`);
  }
  if (text) return data as T;
  try {
    return (await res.json()) as T;
  } catch {
    return {} as T;
  }
}

export async function apiLogin(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`/api/auth/login`, { method: "POST", headers, body: JSON.stringify({ email, password }) });
  if (!res.ok) throw new Error((await res.json()).error || "Login failed");
  return res.json();
}

export async function apiLoginStart(email: string, password: string): Promise<OTPStartResponse> {
  return fetchJsonOnce<OTPStartResponse>(`/api/auth/login/start`, { method: "POST", headers, body: JSON.stringify({ email, password }) });
}

export async function apiSignup(name: string, email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`/api/auth/signup`, {
    method: "POST",
    headers,
    body: JSON.stringify({ name, email, password }),
  });
  if (!res.ok) throw new Error((await res.json()).error || "Signup failed");
  return res.json();
}

export async function apiSignupStart(name: string, email: string, password: string): Promise<OTPStartResponse> {
  return fetchJsonOnce<OTPStartResponse>(`/api/auth/signup/start`, { method: "POST", headers, body: JSON.stringify({ name, email, password }) });
}

export async function apiOtpVerify(body: OTPVerifyRequest): Promise<AuthResponse> {
  return fetchJsonOnce<AuthResponse>(`/api/auth/otp/verify`, { method: "POST", headers, body: JSON.stringify(body) });
}

export async function apiOAuthMock(provider: string, email: string, name?: string): Promise<AuthResponse> {
  return fetchJsonOnce<AuthResponse>(`/api/auth/oauth/mock`, { method: "POST", headers, body: JSON.stringify({ provider, email, name }) });
}
export async function apiOAuthProviders(): Promise<{ providers: ("google"|"microsoft")[] }> {
  return fetchJsonOnce<{ providers: ("google"|"microsoft")[] }>(`/api/auth/oauth/providers`);
}

export async function apiMe(token?: string): Promise<MeResponse> {
  const authToken = token || localStorage.getItem('auth_token');
  if (!authToken) throw new Error('No authentication token found');
  
  const res = await fetch(`/api/auth/me`, { headers: { Authorization: `Bearer ${authToken}` } });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Authentication failed' }));
    
    // Clear invalid tokens on auth failure
    if (res.status === 401 || res.status === 404) {
      localStorage.removeItem('auth_token');
      // Clear auth cookie by setting it to expire
      document.cookie = 'auth_token=; Path=/; Max-Age=0; HttpOnly=false; SameSite=Lax';
    }
    
    throw new Error(errorData.error || 'User not found');
  }
  return res.json();
}
export async function apiMeCookie(): Promise<MeResponse> {
  // Add timeout to prevent hanging requests
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout (reduced from 5s)
  
  try {
    // Use fetch directly with timeout support
    const res = await fetch(`/api/auth/me`, { 
      credentials: "include",
      headers: { ...headers },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'Authentication failed' }));
      
      // Clear invalid tokens on auth failure
      if (res.status === 401 || res.status === 404) {
        localStorage.removeItem('auth_token');
      }
      
      throw new Error(errorData.error || 'User not found');
    }
    
    return res.json();
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    // If request was aborted or failed, don't throw if we're on login page
    if (error.name === 'AbortError' || error.message?.includes('Network')) {
      // Silently fail - user is likely logged out
      throw new Error('Authentication check failed');
    }
    
    // Server will handle clearing HttpOnly cookies
    // Just clean up client-side storage
    localStorage.removeItem('auth_token');
    throw error;
  }
}

export async function apiUpdateMe(name: string): Promise<MeResponse> {
  return fetchJsonOnce<MeResponse>(`/api/auth/me`, {
    method: "PUT",
    headers: { ...headers, ...authHeaders() },
    body: JSON.stringify({ name }),
  });
}

export async function apiLogout(): Promise<{ success: boolean }> {
  const res = await fetch(`/api/auth/logout`, { method: "POST", headers: { ...authHeaders() } });
  if (!res.ok) throw new Error((await res.json()).error || "Logout failed");
  try { localStorage.removeItem("auth_token"); } catch {}
  return res.json();
}

export async function apiForgot(email: string): Promise<ForgotPasswordStartResponse> {
  return fetchJsonOnce<ForgotPasswordStartResponse>(`/api/auth/forgot`, { method: "POST", headers, body: JSON.stringify({ email }) });
}

export async function apiResetComplete(body: ResetPasswordCompleteRequest): Promise<ResetPasswordCompleteResponse> {
  return fetchJsonOnce<ResetPasswordCompleteResponse>(`/api/auth/reset/complete`, { method: "POST", headers, body: JSON.stringify(body) });
}

export async function apiSandboxRun(req: SandboxRunRequest): Promise<SandboxRunResponse> {
  const res = await fetch(`/api/sandbox/run`, { method: "POST", headers, body: JSON.stringify(req) });
  if (!res.ok) throw new Error((await res.json()).error || "Run failed");
  return res.json();
}

// Library
export async function apiLibraryList(): Promise<LibraryResourcesResponse> {
  return fetchJsonOnce<LibraryResourcesResponse>(`/api/library/resources`, { headers: { ...authHeaders() } });
}
export async function apiLibraryCreate(resource: CreateLibraryResourceRequest["resource"]): Promise<CreateLibraryResourceResponse> {
  return fetchJsonOnce<CreateLibraryResourceResponse>(`/api/library/resources`, { method: "POST", headers: { ...headers, ...authHeaders() }, body: JSON.stringify({ resource }) });
}
export async function apiLibraryDelete(id: string): Promise<DeleteLibraryResourceResponse> {
  return fetchJsonOnce<DeleteLibraryResourceResponse>(`/api/library/resources/${id}`, { method: "DELETE", headers: { ...authHeaders() } });
}
export async function apiShareTemplate(template: {
  id: string;
  title: string;
  description: string;
  prompt: string;
  variables: string[];
  category: string;
}): Promise<{ success: boolean }> {
  const token = localStorage.getItem("auth_token");
  return fetchJsonOnce<{ success: boolean }>(`/api/community/share-template`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ template }),
  });
}

// Prompts
export async function apiListPrompts(): Promise<ListPromptsResponse> {
  const res = await fetch(`/api/community/prompts`);
  if (!res.ok) throw new Error((await res.json()).error || "Fetch failed");
  return res.json();
}
export async function apiListSavedPrompts(): Promise<ListPromptsResponse> {
  return fetchJsonOnce<ListPromptsResponse>(`/api/community/prompts/saved`, { headers: { ...authHeaders() } });
}
export async function apiCreatePrompt(body: { title: string; content: string; tags?: string[]; difficulty?: "beginner"|"intermediate"|"advanced"; }): Promise<{ prompt: any }> {
  const res = await fetch(`/api/community/prompts`, { method: "POST", headers: { ...headers, ...authHeaders() }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error((await res.json()).error || "Create failed");
  return res.json();
}
export async function apiUpdatePrompt(id: string, body: { title?: string; content?: string; tags?: string[]; difficulty?: "beginner"|"intermediate"|"advanced"; }): Promise<{ prompt: any }> {
  const res = await fetch(`/api/community/prompts/${id}`, { method: "PUT", headers: { ...headers, ...authHeaders() }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error((await res.json()).error || "Update failed");
  return res.json();
}
export async function apiDeletePrompt(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`/api/community/prompts/${id}`, { method: "DELETE", headers: { ...authHeaders() } });
  if (!res.ok) throw new Error((await res.json()).error || "Delete failed");
  return res.json();
}
export async function apiLikePrompt(id: string): Promise<PromptMetricResponse> {
  const res = await fetch(`/api/community/prompts/${id}/like`, { method: "POST", headers: { ...authHeaders() } });
  if (!res.ok) throw new Error((await res.json()).error || "Like failed");
  return res.json();
}
export async function apiSavePrompt(id: string): Promise<PromptMetricResponse> {
  const res = await fetch(`/api/community/prompts/${id}/save`, { method: "POST", headers: { ...authHeaders() } });
  if (!res.ok) throw new Error((await res.json()).error || "Save failed");
  return res.json();
}
export async function apiViewPrompt(id: string): Promise<PromptMetricResponse> {
  const res = await fetch(`/api/community/prompts/${id}/view`, { method: "POST" });
  if (!res.ok) throw new Error((await res.json()).error || "View failed");
  return res.json();
}
export async function apiListPromptComments(id: string): Promise<ListPromptCommentsResponse> {
  const res = await fetch(`/api/community/prompts/${id}/comments`);
  if (!res.ok) throw new Error((await res.json()).error || "Fetch failed");
  return res.json();
}
export async function apiCreatePromptComment(id: string, content: string): Promise<CreatePromptCommentResponse> {
  const res = await fetch(`/api/community/prompts/${id}/comments`, { method: "POST", headers: { ...headers, ...authHeaders() }, body: JSON.stringify({ content }) });
  if (!res.ok) throw new Error((await res.json()).error || "Create failed");
  return res.json();
}

// Discussions
export async function apiListDiscussions(): Promise<ListDiscussionsResponse> {
  const res = await fetch(`/api/community/discussions`);
  if (!res.ok) throw new Error((await res.json()).error || "Fetch failed");
  return res.json();
}
export async function apiCreateDiscussion(body: CreateDiscussionRequest): Promise<CreateDiscussionResponse> {
  const res = await fetch(`/api/community/discussions`, { method: "POST", headers: { ...headers, ...authHeaders() }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error((await res.json()).error || "Create failed");
  return res.json();
}
export async function apiUpdateDiscussion(id: string, body: Partial<{ title: string; category: string; tags: string[]; isPinned: boolean }>): Promise<CreateDiscussionResponse> {
  const res = await fetch(`/api/community/discussions/${id}`, { method: "PUT", headers: { ...headers, ...authHeaders() }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error((await res.json()).error || "Update failed");
  return res.json();
}
export async function apiDeleteDiscussion(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`/api/community/discussions/${id}`, { method: "DELETE", headers: { ...authHeaders() } });
  if (!res.ok) throw new Error((await res.json()).error || "Delete failed");
  return res.json();
}
export async function apiListDiscussionReplies(id: string): Promise<ListDiscussionRepliesResponse> {
  const res = await fetch(`/api/community/discussions/${id}/replies`);
  if (!res.ok) throw new Error((await res.json()).error || "Fetch failed");
  return res.json();
}
export async function apiCreateDiscussionReply(id: string, content: string): Promise<CreateDiscussionReplyResponse> {
  const res = await fetch(`/api/community/discussions/${id}/replies`, { method: "POST", headers: { ...headers, ...authHeaders() }, body: JSON.stringify({ content }) });
  if (!res.ok) throw new Error((await res.json()).error || "Create failed");
  return res.json();
}
export async function apiViewDiscussion(id: string): Promise<DiscussionViewResponse> {
  const res = await fetch(`/api/community/discussions/${id}/view`, { method: "POST" });
  if (!res.ok) throw new Error((await res.json()).error || "View failed");
  return res.json();
}

// Challenges
export async function apiListChallenges(): Promise<ListChallengesResponse> {
  const res = await fetch(`/api/community/challenges`);
  if (!res.ok) throw new Error((await res.json()).error || "Fetch failed");
  return res.json();
}
export async function apiGetChallenge(id: string): Promise<GetChallengeResponse> {
  const res = await fetch(`/api/community/challenges/${id}`);
  if (!res.ok) throw new Error((await res.json()).error || "Fetch failed");
  return res.json();
}
export async function apiSubmitChallengeEntry(id: string, body: SubmitChallengeEntryRequest): Promise<SubmitChallengeEntryResponse> {
  const res = await fetch(`/api/community/challenges/${id}/entries`, { method: "POST", headers: { ...headers, ...authHeaders() }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error((await res.json()).error || "Submit failed");
  return res.json();
}
export async function apiLikeEntry(id: string, entryId: string): Promise<ChallengeMetricResponse> {
  const res = await fetch(`/api/community/challenges/${id}/entries/${entryId}/like`, { method: "POST" });
  if (!res.ok) throw new Error((await res.json()).error || "Like failed");
  return res.json();
}
export async function apiSaveEntry(id: string, entryId: string): Promise<ChallengeMetricResponse> {
  const res = await fetch(`/api/community/challenges/${id}/entries/${entryId}/save`, { method: "POST" });
  if (!res.ok) throw new Error((await res.json()).error || "Save failed");
  return res.json();
}
export async function apiRunEntry(id: string, entryId: string): Promise<ChallengeMetricResponse> {
  const res = await fetch(`/api/community/challenges/${id}/entries/${entryId}/run`, { method: "POST" });
  if (!res.ok) throw new Error((await res.json()).error || "Run failed");
  return res.json();
}
export async function apiViewEntry(id: string, entryId: string): Promise<ChallengeMetricResponse> {
  const res = await fetch(`/api/community/challenges/${id}/entries/${entryId}/view`, { method: "POST" });
  if (!res.ok) throw new Error((await res.json()).error || "View failed");
  return res.json();
}
export async function apiCreateChallenge(body: { title: string; description: string; startAt: string; endAt: string; criteria?: any }): Promise<{ challenge: any }> {
  const res = await fetch(`/api/admin/challenges`, { method: "POST", headers: { ...headers, ...authHeaders() }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error((await res.json()).error || "Create failed");
  return res.json();
}
export async function apiListChallengesAdmin(): Promise<{ challenges: any[] }> {
  const res = await fetch(`/api/admin/challenges`, { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error((await res.json()).error || "Fetch failed");
  return res.json();
}
export async function apiGetChallengeAdmin(id: string): Promise<{ challenge: any }> {
  const res = await fetch(`/api/admin/challenges/${id}`, { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error((await res.json()).error || "Fetch failed");
  return res.json();
}
export async function apiUpdateChallenge(id: string, body: { title?: string; description?: string; startAt?: string; endAt?: string; criteria?: any }): Promise<{ challenge: any }> {
  const res = await fetch(`/api/admin/challenges/${id}`, { method: "PUT", headers: { ...headers, ...authHeaders() }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error((await res.json()).error || "Update failed");
  return res.json();
}
export async function apiDeleteChallenge(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`/api/admin/challenges/${id}`, { method: "DELETE", headers: { ...authHeaders() } });
  if (!res.ok) throw new Error((await res.json()).error || "Delete failed");
  return res.json();
}

// Analytics API functions
export async function apiGetUserAnalytics(period: string = '30d'): Promise<any> {
  const res = await fetch(`/api/analytics/user?period=${period}`, { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error((await res.json()).error || "Analytics fetch failed");
  return res.json();
}

export async function apiGetAdminAnalytics(period: string = '30d'): Promise<any> {
  const res = await fetch(`/api/analytics/admin?period=${period}`, { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error((await res.json()).error || "Analytics fetch failed");
  return res.json();
}

export async function apiGetTeamAnalytics(teamId: string, period: string = '30d'): Promise<any> {
  const res = await fetch(`/api/analytics/team/${teamId}?period=${period}`, { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error((await res.json()).error || "Analytics fetch failed");
  return res.json();
}

// Search
export async function apiSearch(q: string): Promise<SearchResponse> {
  const usp = new URLSearchParams({ q });
  return fetchJsonOnce<SearchResponse>(`/api/search?${usp.toString()}`);
}

// Marketing
export async function apiMarketingProduct(): Promise<MarketingProductResponse> {
  return fetchJsonOnce<MarketingProductResponse>(`/api/marketing/product`);
}
export async function apiPricing(): Promise<PricingResponse> {
  return fetchJsonOnce<PricingResponse>(`/api/marketing/pricing`);
}
export async function apiCheckoutStart(body: CheckoutStartRequest): Promise<CheckoutStartResponse> {
  return fetchJsonOnce<CheckoutStartResponse>(`/api/marketing/checkout/start`, { method: "POST", headers, body: JSON.stringify(body) });
}
export async function apiTeamInquiry(body: TeamInquiryRequest): Promise<TeamInquiryResponse> {
  return fetchJsonOnce<TeamInquiryResponse>(`/api/marketing/inquiry`, { method: "POST", headers, body: JSON.stringify(body) });
}
export async function apiMarketingResources(): Promise<MarketingResourcesResponse> {
  return fetchJsonOnce<MarketingResourcesResponse>(`/api/marketing/resources`);
}
export async function apiNewsletter(body: NewsletterRequest): Promise<NewsletterResponse> {
  return fetchJsonOnce<NewsletterResponse>(`/api/marketing/newsletter`, { method: "POST", headers, body: JSON.stringify(body) });
}

// Notifications
export async function apiListNotifications(): Promise<ListNotificationsResponse> {
  return fetchJsonOnce<ListNotificationsResponse>(`/api/notifications`, { headers: { ...authHeaders() } });
}
export async function apiMarkNotificationRead(id: string): Promise<MarkReadResponse> {
  return fetchJsonOnce<MarkReadResponse>(`/api/notifications/${id}/read`, { method: "POST", headers: { ...authHeaders() } });
}
export async function apiMarkAllNotificationsRead(): Promise<MarkReadResponse> {
  return fetchJsonOnce<MarkReadResponse>(`/api/notifications/read-all`, { method: "POST", headers: { ...authHeaders() } });
}

// Settings API - Comprehensive
export async function apiGetSettingsProfile(): Promise<{ profile: any }> {
  return fetchJsonOnce<{ profile: any }>(`/api/settings/profile`, { 
    headers: { ...authHeaders() },
    credentials: "include"
  });
}
export async function apiSaveSettingsProfile(profileData: any): Promise<{ profile: any }> {
  return fetchJsonOnce<{ profile: any }>(`/api/settings/profile`, { 
    method: "PUT", 
    headers: { ...headers, ...authHeaders() }, 
    body: JSON.stringify(profileData),
    credentials: "include"
  });
}

// Notifications Settings
export async function apiGetNotificationSettings(): Promise<{ settings: any }> {
  return fetchJsonOnce<{ settings: any }>(`/api/settings/notifications`, { 
    headers: { ...authHeaders() },
    credentials: "include"
  });
}
export async function apiSaveNotificationSettings(settings: any): Promise<{ settings: any }> {
  return fetchJsonOnce<{ settings: any }>(`/api/settings/notifications`, { 
    method: "PUT", 
    headers: { ...headers, ...authHeaders() }, 
    body: JSON.stringify(settings),
    credentials: "include"
  });
}

// Security Settings
export async function apiGetSecuritySettings(): Promise<{ settings: any }> {
  return fetchJsonOnce<{ settings: any }>(`/api/settings/security`, { 
    headers: { ...authHeaders() },
    credentials: "include"
  });
}
export async function apiSaveSecuritySettings(settings: any): Promise<{ settings: any }> {
  return fetchJsonOnce<{ settings: any }>(`/api/settings/security`, { 
    method: "PUT", 
    headers: { ...headers, ...authHeaders() }, 
    body: JSON.stringify(settings),
    credentials: "include"
  });
}
export async function apiChangePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
  return fetchJsonOnce<{ message: string }>(`/api/settings/security/change-password`, { method: "POST", headers: { ...headers, ...authHeaders() }, body: JSON.stringify({ currentPassword, newPassword }) });
}

// Billing Settings
export async function apiGetBillingSettings(): Promise<{ settings: any }> {
  return fetchJsonOnce<{ settings: any }>(`/api/settings/billing`, { 
    headers: { ...authHeaders() },
    credentials: "include"
  });
}
export async function apiSaveBillingSettings(settings: any): Promise<{ settings: any }> {
  return fetchJsonOnce<{ settings: any }>(`/api/settings/billing`, { 
    method: "PUT", 
    headers: { ...headers, ...authHeaders() }, 
    body: JSON.stringify(settings),
    credentials: "include"
  });
}

// Preferences Settings
export async function apiGetPreferences(): Promise<{ preferences: any }> {
  return fetchJsonOnce<{ preferences: any }>(`/api/settings/preferences`, { 
    headers: { ...authHeaders() },
    credentials: "include"
  });
}
export async function apiSavePreferences(preferences: any): Promise<{ preferences: any }> {
  return fetchJsonOnce<{ preferences: any }>(`/api/settings/preferences`, { 
    method: "PUT", 
    headers: { ...headers, ...authHeaders() }, 
    body: JSON.stringify(preferences),
    credentials: "include"
  });
}

// Data Export & Account Management
export async function apiExportData(): Promise<{ data: any }> {
  return fetchJsonOnce<{ data: any }>(`/api/settings/export`, { headers: { ...authHeaders() } });
}
export async function apiDeleteAccount(confirmPassword: string): Promise<{ message: string }> {
  return fetchJsonOnce<{ message: string }>(`/api/settings/account`, { method: "DELETE", headers: { ...headers, ...authHeaders() }, body: JSON.stringify({ confirmPassword }) });
}

// Legacy Support
export async function apiGetSettingsPreferences(): Promise<{ preferences: any }> {
  return apiGetPreferences();
}
export async function apiSaveSettingsPreferences(prefs: any): Promise<{ preferences: any }> {
  return apiSavePreferences(prefs);
}

// Dashboard
import type { DashboardResponse, Track, LessonContent, ProgressResponse, UserLessonProgress } from "@shared/api";
export async function apiDashboard(): Promise<DashboardResponse> {
  return fetchJsonOnce<DashboardResponse>(`/api/dashboard`, { headers: { ...authHeaders() } });
}

// Certificates - Comprehensive
export async function apiListCertificates(): Promise<{ certificates: any[] }> {
  return fetchJsonOnce<{ certificates: any[] }>(`/api/certificates`, { headers: { ...authHeaders() } });
}
export async function apiGetCertificate(id: string): Promise<{ certificate: any }> {
  return fetchJsonOnce<{ certificate: any }>(`/api/certificates/${id}`, { headers: { ...authHeaders() } });
}
export async function apiIssueCertificate(trackId: string, title: string, score?: number): Promise<{ certificate: any }> {
  return fetchJsonOnce<{ certificate: any }>(`/api/certificates/issue`, { method: "POST", headers: { ...headers, ...authHeaders() }, body: JSON.stringify({ trackId, title, score }) });
}
export async function apiGenerateCertificate(trackId: string, title: string, score?: number): Promise<{ certificate: any }> {
  return fetchJsonOnce<{ certificate: any }>(`/api/certificates/generate`, { method: "POST", headers: { ...headers, ...authHeaders() }, body: JSON.stringify({ trackId, title, score }) });
}
export async function apiVerifyCertificate(credentialId: string): Promise<{ valid: boolean; certificate?: any; verifyUrl?: string }> {
  return fetchJsonOnce<{ valid: boolean; certificate?: any; verifyUrl?: string }>(`/api/certificates/verify/${encodeURIComponent(credentialId)}`);
}
export async function apiShareCertificate(certificateId: string, platform: string): Promise<{ url: string }> {
  return fetchJsonOnce<{ url: string }>(`/api/certificates/${certificateId}/share`, { method: "POST", headers: { ...headers, ...authHeaders() }, body: JSON.stringify({ platform }) });
}

// Learning
export async function apiLearningTracks(): Promise<{ tracks: Track[] }> {
  return fetchJsonOnce<{ tracks: Track[] }>(`/api/learning/tracks`);
}
export async function apiGetTrack(trackId: string): Promise<{ track: Track | null }> {
  return fetchJsonOnce<{ track: Track | null }>(`/api/learning/tracks/${trackId}`);
}
export async function apiGetLesson(trackId: string, moduleId: string, lessonId: string) {
  try {
    const { data, error } = await supabase
      .from('track_lessons')
      .select('*')
      .eq('id', lessonId)
      .single();
    if (error) throw error;
    // Map Supabase row to frontend LessonContent object
    const lesson = {
      id: data.id,
      title: data.title,
      type: data.type,                   // 'video', 'text', etc.
      content: data.content,
      durationMin: data.duration_minutes,
      videoUrl: data.video_url?.includes("player.vimeo.com/video")
    ? data.video_url
    : data.video_url?.replace("player.vimeo.com/", "player.vimeo.com/video/") || '',
      prev: null,
      next: null
    };
    return lesson;
  } catch (err) {
    console.error('Failed to fetch lesson:', err);
    return null;
  }
}
export async function apiSetLessonProgress(body: Omit<UserLessonProgress, "userId"|"updatedAt"|"startedAt"|"completedAt"> & { status: UserLessonProgress["status"] }): Promise<ProgressResponse> {
  return fetchJsonOnce<ProgressResponse>(`/api/learning/progress`, { 
    method: "POST", 
    headers: { ...headers, ...authHeaders() }, 
    body: JSON.stringify(body),
    credentials: "include"
  });
}
export async function apiGetProgress(trackId?: string): Promise<ProgressResponse> {
  const usp = new URLSearchParams(trackId ? { trackId } : {} as any);
  return fetchJsonOnce<ProgressResponse>(`/api/learning/progress${usp.toString()?`?${usp}`:""}`, { 
    headers: { ...authHeaders() },
    credentials: "include"
  });
}

// Enhanced Certificate API Functions
export async function apiGetCertificateRequirements(trackId: string): Promise<CertificateRequirementsResponse> {
  return fetchJsonOnce<CertificateRequirementsResponse>(`/api/certificates/requirements/${trackId}`, {
    headers: { ...authHeaders() },
    credentials: "include"
  });
}

export async function apiGenerateCertificateNew(trackId: string): Promise<GenerateCertificateResponse> {
  return fetchJsonOnce<GenerateCertificateResponse>(`/api/certificates/generate`, {
    method: "POST",
    headers: { ...headers, ...authHeaders() },
    body: JSON.stringify({ trackId }),
    credentials: "include"
  });
}

export async function apiGetUserCertificates(): Promise<UserCertificatesResponse> {
  return fetchJsonOnce<UserCertificatesResponse>(`/api/certificates/user`, {
    headers: { ...authHeaders() },
    credentials: "include"
  });
}

export async function apiVerifyCertificateNew(certificateId: string): Promise<{
  valid: boolean;
  certificate?: Certificate;
  verificationInfo?: {
    certificateId: string;
    trackTitle: string;
    completionDate: string;
    verificationStatus: 'VERIFIED' | 'INVALID';
  };
  verifyUrl?: string;
  error?: string;
}> {
  return fetchJsonOnce(`/api/certificates/verify/${encodeURIComponent(certificateId)}`);
}

