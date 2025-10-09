-- ========================================
-- Row Level Security (RLS) Policies - FIXED VERSION
-- ========================================
-- Run this script AFTER the main schema
-- This version fixes the OLD reference issue and improves security

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.track_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.track_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ========================================
-- HELPER FUNCTIONS FOR POLICIES
-- ========================================

-- Function to get current user role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS user_role AS $$
DECLARE
    role user_role;
BEGIN
    SELECT users.role INTO role FROM public.users WHERE id = user_id;
    RETURN role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role(user_id) = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is instructor or admin
CREATE OR REPLACE FUNCTION is_instructor_or_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role(user_id) IN ('instructor', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- USER POLICIES
-- ========================================

-- Users can view all public profiles but can only edit their own
CREATE POLICY "Users can view all profiles" ON public.users
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid()::uuid = id)
    WITH CHECK (auth.uid()::uuid = id);

-- Only service role can insert users (handled by auth system)
CREATE POLICY "Only service role can insert users" ON public.users
    FOR INSERT WITH CHECK (false);

-- Users cannot delete themselves (prevent accidental deletion)
CREATE POLICY "Users cannot delete profiles" ON public.users
    FOR DELETE USING (false);

-- ========================================
-- OTP CHALLENGES POLICIES
-- ========================================

-- Only service role can manage OTP challenges (disable all user access)
CREATE POLICY "Only service role can manage OTP challenges" ON public.otp_challenges
    FOR ALL USING (false);

-- ========================================
-- PROMPT POLICIES
-- ========================================

-- Anyone can view prompts
CREATE POLICY "Anyone can view prompts" ON public.prompts
    FOR SELECT USING (true);

-- Authenticated users can create prompts
CREATE POLICY "Authenticated users can create prompts" ON public.prompts
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND 
        auth.uid()::uuid = author_id
    );

-- Users can update their own prompts
CREATE POLICY "Users can update their own prompts" ON public.prompts
    FOR UPDATE USING (auth.uid()::uuid = author_id)
    WITH CHECK (auth.uid()::uuid = author_id);

-- Users can delete their own prompts, admins can delete any
CREATE POLICY "Users can delete their own prompts" ON public.prompts
    FOR DELETE USING (
        auth.uid()::uuid = author_id OR 
        is_admin(auth.uid()::uuid)
    );

-- ========================================
-- PROMPT INTERACTION POLICIES
-- ========================================

-- Anyone can view interactions (for counts)
CREATE POLICY "Anyone can view prompt interactions" ON public.prompt_interactions
    FOR SELECT USING (true);

-- Authenticated users can create interactions for themselves
CREATE POLICY "Users can create their own interactions" ON public.prompt_interactions
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND 
        auth.uid()::uuid = user_id
    );

-- Users can delete their own interactions
CREATE POLICY "Users can delete their own interactions" ON public.prompt_interactions
    FOR DELETE USING (auth.uid()::uuid = user_id);

-- No updates allowed on interactions (they are immutable)
CREATE POLICY "No updates on interactions" ON public.prompt_interactions
    FOR UPDATE USING (false);

-- ========================================
-- PROMPT COMMENT POLICIES
-- ========================================

-- Anyone can view comments
CREATE POLICY "Anyone can view prompt comments" ON public.prompt_comments
    FOR SELECT USING (true);

-- Authenticated users can create comments
CREATE POLICY "Authenticated users can create comments" ON public.prompt_comments
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND 
        auth.uid()::uuid = user_id
    );

-- Users can update their own comments
CREATE POLICY "Users can update their own comments" ON public.prompt_comments
    FOR UPDATE USING (auth.uid()::uuid = user_id)
    WITH CHECK (auth.uid()::uuid = user_id);

-- Users can delete their own comments, admins can delete any
CREATE POLICY "Users can delete their own comments" ON public.prompt_comments
    FOR DELETE USING (
        auth.uid()::uuid = user_id OR 
        is_admin(auth.uid()::uuid)
    );

-- ========================================
-- LIBRARY RESOURCE POLICIES
-- ========================================

-- Anyone can view library resources
CREATE POLICY "Anyone can view library resources" ON public.library_resources
    FOR SELECT USING (true);

-- Only instructors and admins can create library resources
CREATE POLICY "Instructors can create library resources" ON public.library_resources
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND 
        is_instructor_or_admin(auth.uid()::uuid)
    );

-- Only instructors and admins can update library resources
CREATE POLICY "Instructors can update library resources" ON public.library_resources
    FOR UPDATE USING (is_instructor_or_admin(auth.uid()::uuid))
    WITH CHECK (is_instructor_or_admin(auth.uid()::uuid));

-- Only admins can delete library resources
CREATE POLICY "Admins can delete library resources" ON public.library_resources
    FOR DELETE USING (is_admin(auth.uid()::uuid));

-- ========================================
-- DISCUSSION POLICIES
-- ========================================

-- Anyone can view discussions
CREATE POLICY "Anyone can view discussions" ON public.discussions
    FOR SELECT USING (true);

-- Authenticated users can create discussions
CREATE POLICY "Authenticated users can create discussions" ON public.discussions
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND 
        auth.uid()::uuid = author_id
    );

-- Users can update their own discussions, admins can update any
CREATE POLICY "Users can update their own discussions" ON public.discussions
    FOR UPDATE USING (
        auth.uid()::uuid = author_id OR 
        is_admin(auth.uid()::uuid)
    )
    WITH CHECK (
        auth.uid()::uuid = author_id OR 
        is_admin(auth.uid()::uuid)
    );

-- Users can delete their own discussions, admins can delete any
CREATE POLICY "Users can delete their own discussions" ON public.discussions
    FOR DELETE USING (
        auth.uid()::uuid = author_id OR 
        is_admin(auth.uid()::uuid)
    );

-- ========================================
-- DISCUSSION REPLY POLICIES
-- ========================================

-- Anyone can view replies
CREATE POLICY "Anyone can view discussion replies" ON public.discussion_replies
    FOR SELECT USING (true);

-- Authenticated users can create replies
CREATE POLICY "Authenticated users can create replies" ON public.discussion_replies
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND 
        auth.uid()::uuid = author_id
    );

-- Users can update their own replies
CREATE POLICY "Users can update their own replies" ON public.discussion_replies
    FOR UPDATE USING (auth.uid()::uuid = author_id)
    WITH CHECK (auth.uid()::uuid = author_id);

-- Users can delete their own replies, admins can delete any
CREATE POLICY "Users can delete their own replies" ON public.discussion_replies
    FOR DELETE USING (
        auth.uid()::uuid = author_id OR 
        is_admin(auth.uid()::uuid)
    );

-- ========================================
-- LEARNING TRACK POLICIES
-- ========================================

-- Anyone can view tracks
CREATE POLICY "Anyone can view tracks" ON public.tracks
    FOR SELECT USING (true);

-- Only instructors and admins can create tracks
CREATE POLICY "Instructors can create tracks" ON public.tracks
    FOR INSERT WITH CHECK (is_instructor_or_admin(auth.uid()::uuid));

-- Only instructors and admins can update tracks
CREATE POLICY "Instructors can update tracks" ON public.tracks
    FOR UPDATE USING (is_instructor_or_admin(auth.uid()::uuid))
    WITH CHECK (is_instructor_or_admin(auth.uid()::uuid));

-- Only admins can delete tracks
CREATE POLICY "Admins can delete tracks" ON public.tracks
    FOR DELETE USING (is_admin(auth.uid()::uuid));

-- ========================================
-- TRACK MODULE POLICIES
-- ========================================

-- Anyone can view modules
CREATE POLICY "Anyone can view track modules" ON public.track_modules
    FOR SELECT USING (true);

-- Only instructors and admins can manage modules
CREATE POLICY "Instructors can create modules" ON public.track_modules
    FOR INSERT WITH CHECK (is_instructor_or_admin(auth.uid()::uuid));

CREATE POLICY "Instructors can update modules" ON public.track_modules
    FOR UPDATE USING (is_instructor_or_admin(auth.uid()::uuid))
    WITH CHECK (is_instructor_or_admin(auth.uid()::uuid));

CREATE POLICY "Admins can delete modules" ON public.track_modules
    FOR DELETE USING (is_admin(auth.uid()::uuid));

-- ========================================
-- TRACK LESSON POLICIES
-- ========================================

-- Anyone can view lessons
CREATE POLICY "Anyone can view track lessons" ON public.track_lessons
    FOR SELECT USING (true);

-- Only instructors and admins can manage lessons
CREATE POLICY "Instructors can create lessons" ON public.track_lessons
    FOR INSERT WITH CHECK (is_instructor_or_admin(auth.uid()::uuid));

CREATE POLICY "Instructors can update lessons" ON public.track_lessons
    FOR UPDATE USING (is_instructor_or_admin(auth.uid()::uuid))
    WITH CHECK (is_instructor_or_admin(auth.uid()::uuid));

CREATE POLICY "Admins can delete lessons" ON public.track_lessons
    FOR DELETE USING (is_admin(auth.uid()::uuid));

-- ========================================
-- USER LESSON PROGRESS POLICIES
-- ========================================

-- Users can view their own progress, instructors can view all
CREATE POLICY "Users can view their own progress" ON public.user_lesson_progress
    FOR SELECT USING (
        auth.uid()::uuid = user_id OR 
        is_instructor_or_admin(auth.uid()::uuid)
    );

-- Users can create/update their own progress
CREATE POLICY "Users can manage their own progress" ON public.user_lesson_progress
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND 
        auth.uid()::uuid = user_id
    );

CREATE POLICY "Users can update their own progress" ON public.user_lesson_progress
    FOR UPDATE USING (auth.uid()::uuid = user_id)
    WITH CHECK (auth.uid()::uuid = user_id);

-- No deletion of progress (preserve learning history)
CREATE POLICY "No deletion of progress" ON public.user_lesson_progress
    FOR DELETE USING (false);

-- ========================================
-- CERTIFICATE POLICIES (FIXED)
-- ========================================

-- Certificate viewing: Users see their own, instructors/admins see all, public can verify
CREATE POLICY "Certificate access policy" ON public.certificates
    FOR SELECT USING (
        -- Users can see their own certificates
        auth.uid()::uuid = user_id OR 
        -- Instructors and admins can see all certificates  
        is_instructor_or_admin(auth.uid()::uuid) OR
        -- Allow public verification (for certificate validation endpoint)
        auth.uid() IS NULL
    );

-- Only the system can issue certificates (service role only)
CREATE POLICY "Only system can issue certificates" ON public.certificates
    FOR INSERT WITH CHECK (false);

-- Certificates are immutable (no updates)
CREATE POLICY "Certificates are immutable" ON public.certificates
    FOR UPDATE USING (false);

-- Certificates cannot be deleted (permanent record)
CREATE POLICY "Certificates cannot be deleted" ON public.certificates
    FOR DELETE USING (false);

-- ========================================
-- CHALLENGE POLICIES
-- ========================================

-- Anyone can view challenges
CREATE POLICY "Anyone can view challenges" ON public.challenges
    FOR SELECT USING (true);

-- Only admins can manage challenges
CREATE POLICY "Admins can create challenges" ON public.challenges
    FOR INSERT WITH CHECK (is_admin(auth.uid()::uuid));

CREATE POLICY "Admins can update challenges" ON public.challenges
    FOR UPDATE USING (is_admin(auth.uid()::uuid))
    WITH CHECK (is_admin(auth.uid()::uuid));

CREATE POLICY "Admins can delete challenges" ON public.challenges
    FOR DELETE USING (is_admin(auth.uid()::uuid));

-- ========================================
-- CHALLENGE ENTRY POLICIES
-- ========================================

-- Anyone can view challenge entries
CREATE POLICY "Anyone can view challenge entries" ON public.challenge_entries
    FOR SELECT USING (true);

-- Authenticated users can create entries for themselves
CREATE POLICY "Users can create challenge entries" ON public.challenge_entries
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND 
        auth.uid()::uuid = author_id
    );

-- Users can update their own entries
CREATE POLICY "Users can update their own entries" ON public.challenge_entries
    FOR UPDATE USING (auth.uid()::uuid = author_id)
    WITH CHECK (auth.uid()::uuid = author_id);

-- Users can delete their own entries, admins can delete any
CREATE POLICY "Users can delete their own entries" ON public.challenge_entries
    FOR DELETE USING (
        auth.uid()::uuid = author_id OR 
        is_admin(auth.uid()::uuid)
    );

-- ========================================
-- NOTIFICATION POLICIES (FIXED)
-- ========================================

-- Users can only view their own notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid()::uuid = user_id);

-- Only the system can create notifications (service role only)
CREATE POLICY "Only system can create notifications" ON public.notifications
    FOR INSERT WITH CHECK (false);

-- Users can mark their own notifications as read (FIXED - no OLD reference)
CREATE POLICY "Users can mark notifications as read" ON public.notifications
    FOR UPDATE USING (
        auth.uid()::uuid = user_id AND 
        read_at IS NULL  -- Check existing value (pre-update)
    )
    WITH CHECK (
        auth.uid()::uuid = user_id AND
        read_at IS NOT NULL  -- Ensure they're actually marking as read
    );

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications" ON public.notifications
    FOR DELETE USING (auth.uid()::uuid = user_id);

-- ========================================
-- GRANT PERMISSIONS
-- ========================================

-- Grant usage on all sequences to authenticated users
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant permissions to authenticated users for normal operations
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.users TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.prompts TO authenticated;
GRANT INSERT, DELETE ON public.prompt_interactions TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.prompt_comments TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.discussions TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.discussion_replies TO authenticated;
GRANT INSERT, UPDATE ON public.user_lesson_progress TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.challenge_entries TO authenticated;
GRANT UPDATE, DELETE ON public.notifications TO authenticated;

-- Grant additional permissions to service role (for system operations)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
