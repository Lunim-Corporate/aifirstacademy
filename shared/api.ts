/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

// Auth
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "student" | "instructor" | "admin";
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface MeResponse {
  user: AuthUser;
}

export interface OTPStartResponse { next: "otp"; pendingId: string; email: string }
export interface OTPVerifyRequest { pendingId: string; code: string }
export interface ForgotPasswordStartResponse { next: "reset"; pendingId?: string; email?: string; message: string }
export interface ResetPasswordCompleteRequest { pendingId: string; code: string; newPassword: string }
export interface ResetPasswordCompleteResponse { success: boolean }

// Sandbox
export interface SandboxRunRequest {
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  system?: string;
}

export interface SandboxRunResponse {
  id: string;
  prompt: string;
  system: string;
  settings: { temperature: number; maxTokens: number };
  timings: { start: number; end: number; latencyMs: number };
  tokens: { input: number; output: number; total: number };
  cost: number;
  content: string;
  feedback: { clarity: number; specificity: number; constraints: number; score: number; notes: string };
}

// Library
export type ResourceType = "prompt" | "template" | "guide" | "video";
export interface ResourceBase {
  id: string;
  type: ResourceType;
  title: string;
  tags: string[];
  createdAt: string;
}
export interface PromptResource extends ResourceBase {
  type: "prompt";
  content: string;
}
export interface TemplateResource extends ResourceBase {
  type: "template";
  content: string;
}
export interface GuideResource extends ResourceBase {
  type: "guide";
  url?: string;
  description: string;
  content?: string;
  author?: string;
  category?: string;
}
export interface VideoResource extends ResourceBase {
  type: "video";
  url: string;
  duration: string;
  category?: string;
  author?: string;
  platform?: string;
  embedUrl?: string;
  mp4Url?: string;
}
export type LibraryResource = PromptResource | TemplateResource | GuideResource | VideoResource;
export interface LibraryResourcesResponse {
  academy: LibraryResource[];
  user: LibraryResource[];
}
export interface CreateLibraryResourceRequest {
  resource: Omit<LibraryResource, "id" | "createdAt">;
}
export interface CreateLibraryResourceResponse { resource: LibraryResource }
export interface DeleteLibraryResourceResponse { success: boolean }

// Community: Prompts
export interface CommunityPrompt {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName?: string;
  tags: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  likes: number;
  saves: number;
  views: number;
  runs: number;
  createdAt: string;
}
export interface ListPromptsResponse { prompts: CommunityPrompt[] }
export interface PromptComment {
  id: string;
  promptId: string;
  userId: string;
  content: string;
  createdAt: string;
}
export interface ListPromptCommentsResponse { comments: PromptComment[] }
export interface CreatePromptCommentRequest { content: string }
export interface CreatePromptCommentResponse { comment: PromptComment }
export interface PromptMetricResponse { likes?: number; saves?: number; views?: number; runs?: number }

// Community: Discussions
export interface Discussion {
  id: string;
  title: string;
  authorId: string;
  authorName?: string;
  category: string;
  tags: string[];
  views: number;
  replies: number;
  isPinned?: boolean;
  createdAt: string;
  lastActivityAt: string;
}
export interface DiscussionReply {
  id: string;
  discussionId: string;
  authorId: string;
  content: string;
  createdAt: string;
}
export interface ListDiscussionsResponse { discussions: Discussion[] }
export interface CreateDiscussionRequest { title: string; category: string; tags?: string[]; content?: string }
export interface CreateDiscussionResponse { discussion: Discussion }
export interface ListDiscussionRepliesResponse { replies: DiscussionReply[] }
export interface CreateDiscussionReplyRequest { content: string }
export interface CreateDiscussionReplyResponse { reply: DiscussionReply }
export interface DiscussionViewResponse { views: number }

// Community: Challenges
export interface ChallengeCriteria {
  likesWeight: number;
  savesWeight: number;
  runsWeight: number;
  viewsWeight: number;
}
export interface Challenge {
  id: string;
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  criteria: ChallengeCriteria;
}
export interface ChallengeEntryMetrics { likes: number; saves: number; runs: number; views: number }
export interface ChallengeEntry {
  id: string;
  challengeId: string;
  authorId: string;
  title: string;
  content: string;
  metrics: ChallengeEntryMetrics;
  createdAt: string;
}
export interface ChallengeWithEntries extends Challenge { entries: ChallengeEntry[] }
export interface ListChallengesResponse { challenges: Challenge[] }
export interface GetChallengeResponse { challenge: ChallengeWithEntries; winner?: { entryId: string; score: number } }
export interface SubmitChallengeEntryRequest { title: string; content: string }
export interface SubmitChallengeEntryResponse { entry: ChallengeEntry }
export interface ChallengeMetricResponse { metrics: ChallengeEntryMetrics }

// Marketing
export interface MarketingHero { title: string; subtitle: string; ctas: { label: string; href: string; variant?: "default" | "outline" }[] }
export interface MarketingFeature { id: string; title: string; description: string; icon: string }
export interface MarketingTestimonial { id: string; name: string; role: string; quote: string }
export interface MarketingFAQ { q: string; a: string }
export interface MarketingCaseStudy { id: string; title: string; company: string; metric: string; summary: string }
export interface MarketingProductResponse {
  hero: MarketingHero;
  features: MarketingFeature[];
  testimonials: MarketingTestimonial[];
  logos?: string[];
  integrations?: string[];
  caseStudies?: MarketingCaseStudy[];
  faqs?: MarketingFAQ[];
}

export interface PricingPlan { id: string; name: string; price: number | null; interval: "month" | "year" | "custom"; features: string[]; cta: { label: string; action: "signup" | "checkout" | "contact" } }
export interface PricingComparisonFeature { key: string; label: string; availability: Record<string, boolean | "limited"> }
export interface PricingFAQ { q: string; a: string }
export interface PricingResponse { currency: string; plans: PricingPlan[]; comparison?: PricingComparisonFeature[]; faqs?: PricingFAQ[] }
export interface CheckoutStartRequest { planId: string; email: string }
export interface CheckoutStartResponse { id: string; url: string }
export interface TeamInquiryRequest { name: string; email: string; company?: string; teamSize?: string | number; message?: string }
export interface TeamInquiryResponse { success: boolean }
export interface MarketingResourcesResponse { guides: GuideResource[]; videos: VideoResource[] }
export interface NewsletterRequest { email: string }
export interface NewsletterResponse { success: boolean }

// Global search
export type SearchKind = "prompt" | "discussion" | "library" | "track" | "challenge";
export interface SearchItem {
  id: string;
  kind: SearchKind;
  title: string;
  snippet?: string;
  href: string;
  meta?: Record<string, string | number>;
}
export interface SearchResponse { query: string; items: SearchItem[] }

// Notifications
export type NotificationType = "system" | "like" | "reply" | "save" | "achievement";
export interface NotificationItem {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  href?: string;
  createdAt: string;
  readAt?: string;
}
export interface ListNotificationsResponse { notifications: NotificationItem[]; unread: number }
export interface MarkReadResponse { success: boolean; unread: number }

// Dashboard
export interface DashboardSkill { name: string; progress: number; level: "Beginner" | "Intermediate" | "Advanced" }
export interface DashboardRecommendation { title: string; track: string; duration: string; difficulty: "Beginner" | "Intermediate" | "Advanced" }
export type DashboardActivityType = "completed" | "shared" | "certificate" | "challenge";
export interface DashboardActivityItem {
  type: DashboardActivityType;
  title: string;
  time: string;
  points?: number;
  upvotes?: number;
  badge?: string;
  rank?: string;
}
export interface DashboardEventItem {
  title: string;
  date: string;
  instructor?: string;
  attendees?: number;
  participants?: number;
}
export interface DashboardCurrentModule {
  id: string;
  track: string;
  title: string;
  progress: number;
  lessonIndex: number;
  lessonsTotal: number;
  remainingMin: number;
}
export interface DashboardResponse {
  streakDays: number;
  progress: { overall: number; deltaWeek: number };
  modules: { completed: number; total: number; percent: number };
  sandboxScore: { average: number };
  currentModule: DashboardCurrentModule | null;
  skills: DashboardSkill[];
  recommendations: DashboardRecommendation[];
  activity: DashboardActivityItem[];
  events: DashboardEventItem[];
}

// Learning
export type LessonType = "text" | "sandbox" | "quiz" | "video" | "assessment";
export interface TrackModuleLesson {
  id: string;
  title: string;
  durationMin: number;
  type?: LessonType;
  status?: "completed" | "in-progress" | "locked";
}
export interface TrackModule {
  id: string;
  title: string;
  description: string;
  lessons: TrackModuleLesson[];
}
export interface Track {
  id: string;
  title: string;
  level: "beginner" | "intermediate" | "advanced";
  modules: TrackModule[];
}
export interface LessonContent {
  trackId: string;
  moduleId: string;
  lesson: TrackModuleLesson & { type: LessonType; content?: string; videoUrl?: string; quiz?: { questions: { id: string; q: string; options: string[]; answerIndex: number }[] } };
  next?: { trackId: string; moduleId: string; lessonId: string } | null;
  prev?: { trackId: string; moduleId: string; lessonId: string } | null;
}
export interface UserLessonProgress {
  userId: string;
  trackId: string;
  moduleId: string;
  lessonId: string;
  status: "not_started" | "in_progress" | "completed";
  startedAt?: string;
  completedAt?: string;
  updatedAt: string;
}
export interface ProgressResponse { progress: UserLessonProgress[] }
