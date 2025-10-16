import { supabaseAdmin, withRetry } from './supabase';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

// ========================================
// TYPE DEFINITIONS
// ========================================

export interface User {
  phone?: string;
  id: string;
  email: string;
  name: string;
  role: "student" | "instructor" | "admin";
  created_at: string;
  updated_at: string;
  is_verified?: boolean;
  // Profile fields
  persona_role?: "engineer" | "manager" | "designer" | "marketer" | "researcher";
  display_name?: string;
  bio?: string;
  location?: string;
  website?: string;
  company?: string;
  job_title?: string;
  skills?: string[];
  interests?: string[];
  timezone?: string;
  language?: string;
  avatar?: string;
  // Social media links
  twitter?: string;
  linkedin?: string;
  github?: string;
  // Privacy settings
  profile_visible?: boolean;
  email_visible?: boolean;
  activity_visible?: boolean;
}

export interface Prompt {
  id: string;
  title: string;
  content: string;
  author_id: string;
  tags: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  likes_count: number;
  saves_count: number;
  views_count: number;
  runs_count: number;
  created_at: string;
  updated_at: string;
}

export type ResourceType = "prompt" | "template" | "guide" | "video";
export interface LibraryResource {
  id: string;
  type: ResourceType;
  title: string;
  content?: string;
  url?: string;
  description?: string;
  author?: string;
  category?: string;
  duration?: string; // for videos
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface PromptComment {
  id: string;
  prompt_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface Discussion {
  id: string;
  title: string;
  author_id: string;
  category: string;
  tags: string[];
  views_count: number;
  replies_count: number;
  is_pinned?: boolean;
  created_at: string;
  updated_at: string;
  last_activity_at: string;
}

export interface DiscussionReply {
  id: string;
  discussion_id: string;
  author_id: string;
  content: string;
  created_at: string;
}

export interface Track {
  id: string;
  title: string;
  description?: string;
  level: "beginner" | "intermediate" | "advanced";
  role?: string;
  estimated_hours?: number;
  certificate_available?: boolean;
  created_at: string;
  updated_at: string;
}

export interface TrackModule {
  id: string;
  track_id: string;
  title: string;
  description: string;
  estimated_hours?: number;
  order_index: number;
  created_at: string;
}

export type LessonType = "video" | "text" | "reading" | "sandbox" | "quiz" | "interactive";
export interface TrackLesson {
  id: string;
  module_id: string;
  title: string;
  duration_minutes: number;
  type?: LessonType;
  level?: "beginner" | "intermediate" | "advanced";
  content?: string;
  video_url?: string;
  order_index: number;
  created_at: string;
}

export interface UserLessonProgress {
  id: string;
  user_id: string;
  track_id: string;
  module_id: string;
  lesson_id: string;
  status: "not_started" | "in_progress" | "completed";
  started_at?: string;
  completed_at?: string;
  updated_at: string;
}

export interface Certificate {
  id: string;
  user_id: string;
  track_id: string;
  title: string;
  issued_at: string;
  score: number;
  credential_id: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  starts_at: string;
  ends_at: string;
  likes_weight: number;
  saves_weight: number;
  runs_weight: number;
  views_weight: number;
  created_at: string;
}

export interface ChallengeEntry {
  id: string;
  challenge_id: string;
  author_id: string;
  title: string;
  content: string;
  likes_count: number;
  saves_count: number;
  runs_count: number;
  views_count: number;
  created_at: string;
}

export interface OTPChallenge {
  id: string;
  pending_id: string;
  email: string;
  user_id?: string;
  purpose: "signup" | "login" | "reset";
  code: string;
  expires_at: string;
  consumed_at?: string;
  created_at: string;
}

export type NotificationType = "system" | "like" | "reply" | "save" | "achievement";
export interface NotificationItem {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body?: string;
  href?: string;
  created_at: string;
  read_at?: string;
}

export interface ResendAttempt {
  id: string;
  email: string;
  purpose: "signup" | "login" | "reset";
  attempt_count: number;
  last_attempt_at: string;
  blocked_until?: string;
  created_at: string;
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

export function createId(prefix?: string): string {
  const id = uuidv4();
  return prefix ? `${prefix}_${id}` : id;
}

export function createOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function hashPassword(password: string, salt: string): string {
  return crypto.createHash('sha256').update(salt + password).digest('hex');
}

// ========================================
// DATABASE OPERATIONS
// ========================================

// Users
export async function getUsers(): Promise<User[]> {
  return withRetry(async () => {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  });
}

export async function getUserById(id: string): Promise<User | null> {
  return withRetry(async () => {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  });
}

export async function getUserByEmail(email: string): Promise<User | null> {
  return withRetry(async () => {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  });
}

export async function createUser(user: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
  return withRetry(async () => {
    const newUser = {
      ...user,
      id: createId(),
      email: user.email.toLowerCase(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('users')
      .insert([newUser])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  });
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User> {
  return withRetry(async () => {
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  });
}

// OTP Challenges
export async function createOTPChallenge(challenge: Omit<OTPChallenge, 'id' | 'created_at'>): Promise<OTPChallenge> {
  return withRetry(async () => {
    const newChallenge = {
      ...challenge,
      id: createId(),
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('otp_challenges')
      .insert([newChallenge])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  });
}

export async function getOTPChallenge(pendingId: string): Promise<OTPChallenge | null> {
  return withRetry(async () => {
    const { data, error } = await supabaseAdmin
      .from('otp_challenges')
      .select('*')
      .eq('pending_id', pendingId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  });
}

export async function consumeOTPChallenge(id: string): Promise<void> {
  return withRetry(async () => {
    const { error } = await supabaseAdmin
      .from('otp_challenges')
      .update({ consumed_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) throw error;
  });
}

export async function cleanupExpiredOTPs(): Promise<void> {
  return withRetry(async () => {
    const { error } = await supabaseAdmin
      .from('otp_challenges')
      .delete()
      .lt('expires_at', new Date().toISOString());
    
    if (error) throw error;
  });
}

// Prompts
export async function getPrompts(options?: {
  limit?: number;
  offset?: number;
  authorId?: string;
  tags?: string[];
  difficulty?: string;
  sortBy?: 'created_at' | 'likes_count' | 'views_count';
  sortOrder?: 'asc' | 'desc';
}): Promise<Prompt[]> {
  return withRetry(async () => {
    let query = supabaseAdmin.from('prompts').select('*');

    if (options?.authorId) {
      query = query.eq('author_id', options.authorId);
    }

    if (options?.difficulty) {
      query = query.eq('difficulty', options.difficulty);
    }

    if (options?.tags && options.tags.length > 0) {
      query = query.overlaps('tags', options.tags);
    }

    // Sorting
    const sortBy = options?.sortBy || 'created_at';
    const sortOrder = options?.sortOrder || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  });
}

export async function getPromptById(id: string): Promise<Prompt | null> {
  return withRetry(async () => {
    const { data, error } = await supabaseAdmin
      .from('prompts')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  });
}

export async function createPrompt(prompt: Omit<Prompt, 'id' | 'created_at' | 'updated_at' | 'likes_count' | 'saves_count' | 'views_count' | 'runs_count'>): Promise<Prompt> {
  return withRetry(async () => {
    const newPrompt = {
      ...prompt,
      id: createId(),
      likes_count: 0,
      saves_count: 0,
      views_count: 0,
      runs_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('prompts')
      .insert([newPrompt])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  });
}

export async function updatePrompt(id: string, updates: Partial<Prompt>): Promise<Prompt> {
  return withRetry(async () => {
    const { data, error } = await supabaseAdmin
      .from('prompts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  });
}

export async function deletePrompt(id: string): Promise<void> {
  return withRetry(async () => {
    const { error } = await supabaseAdmin
      .from('prompts')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  });
}

// Prompt Interactions
export async function recordPromptInteraction(
  promptId: string, 
  userId: string, 
  interactionType: 'like' | 'save' | 'view' | 'run'
): Promise<void> {
  return withRetry(async () => {
    const { error } = await supabaseAdmin
      .from('prompt_interactions')
      .upsert([{
        id: createId(),
        prompt_id: promptId,
        user_id: userId,
        interaction_type: interactionType,
        created_at: new Date().toISOString(),
      }], { onConflict: 'prompt_id,user_id,interaction_type' });
    
    if (error) throw error;
  });
}

export async function removePromptInteraction(
  promptId: string, 
  userId: string, 
  interactionType: 'like' | 'save' | 'view' | 'run'
): Promise<void> {
  return withRetry(async () => {
    const { error } = await supabaseAdmin
      .from('prompt_interactions')
      .delete()
      .eq('prompt_id', promptId)
      .eq('user_id', userId)
      .eq('interaction_type', interactionType);
    
    if (error) throw error;
  });
}

export async function getUserPromptInteractions(userId: string, promptId: string): Promise<string[]> {
  return withRetry(async () => {
    const { data, error } = await supabaseAdmin
      .from('prompt_interactions')
      .select('interaction_type')
      .eq('prompt_id', promptId)
      .eq('user_id', userId);
    
    if (error) throw error;
    return (data || []).map((row: any) => row.interaction_type);
  });
}

// Comments
export async function getPromptComments(promptId: string): Promise<(PromptComment & { user: Pick<User, 'id' | 'name' | 'avatar'> })[]> {
  return withRetry(async () => {
    const { data, error } = await supabaseAdmin
      .from('prompt_comments')
      .select(`
        *,
        users!user_id (id, name, avatar)
      `)
      .eq('prompt_id', promptId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return (data || []).map((comment: any) => ({
      ...comment,
      user: comment.users
    }));
  });
}

export async function createPromptComment(comment: Omit<PromptComment, 'id' | 'created_at'>): Promise<PromptComment> {
  return withRetry(async () => {
    const newComment = {
      ...comment,
      id: createId(),
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('prompt_comments')
      .insert([newComment])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  });
}

export async function deletePromptComment(id: string): Promise<void> {
  return withRetry(async () => {
    const { error } = await supabaseAdmin
      .from('prompt_comments')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  });
}

// Library Resources
export async function getLibraryResources(options?: {
  type?: ResourceType;
  category?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
}): Promise<LibraryResource[]> {
  return withRetry(async () => {
    let query = supabaseAdmin.from('library_resources').select('*');

    if (options?.type) {
      query = query.eq('type', options.type);
    }

    if (options?.category) {
      query = query.eq('category', options.category);
    }

    if (options?.tags && options.tags.length > 0) {
      query = query.overlaps('tags', options.tags);
    }

    query = query.order('created_at', { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  });
}

export async function createLibraryResource(resource: Omit<LibraryResource, 'id' | 'created_at' | 'updated_at'>): Promise<LibraryResource> {
  return withRetry(async () => {
    const newResource = {
      ...resource,
      id: createId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('library_resources')
      .insert([newResource])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  });
}

// Notifications
export async function createNotification(notification: Omit<NotificationItem, 'id' | 'created_at'>): Promise<NotificationItem> {
  return withRetry(async () => {
    const newNotification = {
      ...notification,
      id: createId(),
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert([newNotification])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  });
}

export async function getUserNotifications(userId: string, limit = 50): Promise<NotificationItem[]> {
  return withRetry(async () => {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  });
}

export async function markNotificationAsRead(id: string): Promise<void> {
  return withRetry(async () => {
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) throw error;
  });
}

// Tracks
export async function createTrack(track: Omit<Track, 'id' | 'created_at' | 'updated_at'>): Promise<Track> {
  return withRetry(async () => {
    const newTrack = {
      ...track,
      id: createId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('tracks')
      .insert([newTrack])
      .select()
      .single();

    if (error) throw error;
    return data as Track;
  });
}

export async function createTrackModule(module: Omit<TrackModule, 'id' | 'created_at'>): Promise<TrackModule> {
  return withRetry(async () => {
    const newModule = {
      ...module,
      id: createId(),
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('track_modules')
      .insert([newModule])
      .select()
      .single();

    if (error) throw error;
    return data as TrackModule;
  });
}

export async function createTrackLesson(lesson: Omit<TrackLesson, 'id' | 'created_at'>): Promise<TrackLesson> {
  return withRetry(async () => {
    const newLesson = {
      ...lesson,
      id: createId(),
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('track_lessons')
      .insert([newLesson])
      .select()
      .single();

    if (error) throw error;
    return data as TrackLesson;
  });
}

// Discussions
export async function createDiscussion(discussion: Omit<Discussion, 'id' | 'created_at' | 'updated_at' | 'last_activity_at' | 'views_count' | 'replies_count'> & { views_count?: number; replies_count?: number; }): Promise<Discussion> {
  return withRetry(async () => {
    const newDiscussion = {
      ...discussion,
      id: createId(),
      views_count: discussion.views_count ?? 0,
      replies_count: discussion.replies_count ?? 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('discussions')
      .insert([newDiscussion])
      .select()
      .single();

    if (error) throw error;
    return data as Discussion;
  });
}

export async function createDiscussionReply(reply: Omit<DiscussionReply, 'id' | 'created_at'>): Promise<DiscussionReply> {
  return withRetry(async () => {
    const newReply = {
      ...reply,
      id: createId(),
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('discussion_replies')
      .insert([newReply])
      .select()
      .single();

    if (error) throw error;
    return data as DiscussionReply;
  });
}

// Challenges
export async function createChallenge(challenge: Omit<Challenge, 'id' | 'created_at'>): Promise<Challenge> {
  return withRetry(async () => {
    const newChallenge = {
      ...challenge,
      id: createId(),
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('challenges')
      .insert([newChallenge])
      .select()
      .single();

    if (error) throw error;
    return data as Challenge;
  });
}

export async function createChallengeEntry(entry: Omit<ChallengeEntry, 'id' | 'created_at' | 'likes_count' | 'saves_count' | 'runs_count' | 'views_count'> & { likes_count?: number; saves_count?: number; runs_count?: number; views_count?: number; }): Promise<ChallengeEntry> {
  return withRetry(async () => {
    const newEntry = {
      ...entry,
      id: createId(),
      likes_count: entry.likes_count ?? 0,
      saves_count: entry.saves_count ?? 0,
      runs_count: entry.runs_count ?? 0,
      views_count: entry.views_count ?? 0,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('challenge_entries')
      .insert([newEntry])
      .select()
      .single();

    if (error) throw error;
    return data as ChallengeEntry;
  });
}

// ========================================
// RESEND ATTEMPT TRACKING
// ========================================

export async function getResendAttempt(email: string, purpose: "signup" | "login" | "reset"): Promise<ResendAttempt | null> {
  return withRetry(async () => {
    const { data, error } = await supabaseAdmin
      .from('resend_attempts')
      .select('*')
      .eq('email', email)
      .eq('purpose', purpose)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as ResendAttempt | null;
  });
}

export async function createResendAttempt(attempt: Omit<ResendAttempt, 'id' | 'created_at'>): Promise<ResendAttempt> {
  return withRetry(async () => {
    const newAttempt: ResendAttempt = {
      ...attempt,
      id: createId('resend'),
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('resend_attempts')
      .insert([newAttempt])
      .select()
      .single();

    if (error) throw error;
    return data as ResendAttempt;
  });
}

export async function updateResendAttempt(id: string, updates: Partial<ResendAttempt>): Promise<ResendAttempt> {
  return withRetry(async () => {
    const { data, error } = await supabaseAdmin
      .from('resend_attempts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as ResendAttempt;
  });
}

export async function cleanupExpiredResendAttempts(): Promise<void> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  await withRetry(async () => {
    const { error } = await supabaseAdmin
      .from('resend_attempts')
      .delete()
      .lt('created_at', oneDayAgo);

    if (error) throw error;
  });
}

// Health check and maintenance functions
export async function performDatabaseMaintenance(): Promise<void> {
  console.log('Starting database maintenance...');
  
  // Clean up expired OTPs
  await cleanupExpiredOTPs();
  
  // Clean up old resend attempts
  await cleanupExpiredResendAttempts();
  
  console.log('Database maintenance completed');
}

// Legacy compatibility - these functions will be called by existing code
export function readDB(): any {
  throw new Error('readDB() is deprecated. Use Supabase functions instead.');
}

export function writeDB(data: any): void {
  throw new Error('writeDB() is deprecated. Use Supabase functions instead.');
}
