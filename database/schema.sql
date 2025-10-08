-- ========================================
-- AI First Academy - PostgreSQL Schema
-- ========================================
-- Run this script in your Supabase SQL editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================
-- ENUMS
-- ========================================
CREATE TYPE user_role AS ENUM ('student', 'instructor', 'admin');
CREATE TYPE lesson_type AS ENUM ('video', 'text', 'reading', 'sandbox', 'quiz', 'interactive');
CREATE TYPE lesson_status AS ENUM ('not_started', 'in_progress', 'completed');
CREATE TYPE track_level AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE resource_type AS ENUM ('prompt', 'template', 'guide', 'video');
CREATE TYPE notification_type AS ENUM ('system', 'like', 'reply', 'save', 'achievement');
CREATE TYPE otp_purpose AS ENUM ('signup', 'login', 'reset');

-- ========================================
-- CORE TABLES
-- ========================================

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_verified BOOLEAN DEFAULT false,
    -- Additional profile fields
    persona_role TEXT CHECK (persona_role IN ('engineer', 'manager', 'designer', 'marketer', 'researcher')),
    display_name TEXT,
    bio TEXT,
    location TEXT,
    website TEXT,
    company TEXT,
    job_title TEXT,
    skills TEXT[],
    interests TEXT[],
    timezone TEXT,
    language TEXT DEFAULT 'en',
    avatar TEXT
);

-- OTP challenges table
CREATE TABLE public.otp_challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pending_id TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    purpose otp_purpose NOT NULL,
    code TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    consumed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prompts table
CREATE TABLE public.prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    tags TEXT[] DEFAULT '{}',
    difficulty track_level NOT NULL DEFAULT 'beginner',
    likes_count INTEGER DEFAULT 0 CHECK (likes_count >= 0),
    saves_count INTEGER DEFAULT 0 CHECK (saves_count >= 0),
    views_count INTEGER DEFAULT 0 CHECK (views_count >= 0),
    runs_count INTEGER DEFAULT 0 CHECK (runs_count >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prompt interactions (likes, saves, etc.)
CREATE TABLE public.prompt_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prompt_id UUID NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    interaction_type TEXT NOT NULL CHECK (interaction_type IN ('like', 'save', 'view', 'run')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(prompt_id, user_id, interaction_type)
);

-- Prompt comments
CREATE TABLE public.prompt_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prompt_id UUID NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Library resources
CREATE TABLE public.library_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type resource_type NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    url TEXT,
    description TEXT,
    author TEXT,
    category TEXT,
    duration TEXT, -- for videos
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community discussions
CREATE TABLE public.discussions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    views_count INTEGER DEFAULT 0 CHECK (views_count >= 0),
    replies_count INTEGER DEFAULT 0 CHECK (replies_count >= 0),
    is_pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Discussion replies
CREATE TABLE public.discussion_replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    discussion_id UUID NOT NULL REFERENCES public.discussions(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Learning tracks
CREATE TABLE public.tracks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    level track_level NOT NULL DEFAULT 'beginner',
    role TEXT,
    estimated_hours INTEGER CHECK (estimated_hours > 0),
    certificate_available BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Track modules
CREATE TABLE public.track_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    estimated_hours INTEGER CHECK (estimated_hours > 0),
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Track lessons
CREATE TABLE public.track_lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID NOT NULL REFERENCES public.track_modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    type lesson_type DEFAULT 'text',
    level track_level DEFAULT 'beginner',
    content TEXT,
    video_url TEXT,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User lesson progress
CREATE TABLE public.user_lesson_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES public.track_modules(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES public.track_lessons(id) ON DELETE CASCADE,
    status lesson_status NOT NULL DEFAULT 'not_started',
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, lesson_id)
);

-- Certificates
CREATE TABLE public.certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    score INTEGER CHECK (score >= 0 AND score <= 100),
    credential_id TEXT UNIQUE NOT NULL
);

-- Challenges
CREATE TABLE public.challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
    likes_weight DECIMAL(3,2) DEFAULT 1.0,
    saves_weight DECIMAL(3,2) DEFAULT 1.0,
    runs_weight DECIMAL(3,2) DEFAULT 1.0,
    views_weight DECIMAL(3,2) DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (ends_at > starts_at)
);

-- Challenge entries
CREATE TABLE public.challenge_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0 CHECK (likes_count >= 0),
    saves_count INTEGER DEFAULT 0 CHECK (saves_count >= 0),
    runs_count INTEGER DEFAULT 0 CHECK (runs_count >= 0),
    views_count INTEGER DEFAULT 0 CHECK (views_count >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(challenge_id, author_id)
);

-- Notifications
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    href TEXT,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- User indexes
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_created_at ON public.users(created_at);

-- OTP indexes
CREATE INDEX idx_otp_challenges_email ON public.otp_challenges(email);
CREATE INDEX idx_otp_challenges_pending_id ON public.otp_challenges(pending_id);
CREATE INDEX idx_otp_challenges_expires_at ON public.otp_challenges(expires_at);

-- Prompt indexes
CREATE INDEX idx_prompts_author_id ON public.prompts(author_id);
CREATE INDEX idx_prompts_created_at ON public.prompts(created_at DESC);
CREATE INDEX idx_prompts_likes_count ON public.prompts(likes_count DESC);
CREATE INDEX idx_prompts_difficulty ON public.prompts(difficulty);
CREATE INDEX idx_prompts_tags ON public.prompts USING GIN(tags);

-- Interaction indexes
CREATE INDEX idx_prompt_interactions_prompt_id ON public.prompt_interactions(prompt_id);
CREATE INDEX idx_prompt_interactions_user_id ON public.prompt_interactions(user_id);
CREATE INDEX idx_prompt_interactions_type ON public.prompt_interactions(interaction_type);

-- Comment indexes
CREATE INDEX idx_prompt_comments_prompt_id ON public.prompt_comments(prompt_id);
CREATE INDEX idx_prompt_comments_user_id ON public.prompt_comments(user_id);
CREATE INDEX idx_prompt_comments_created_at ON public.prompt_comments(created_at DESC);

-- Library indexes
CREATE INDEX idx_library_resources_type ON public.library_resources(type);
CREATE INDEX idx_library_resources_category ON public.library_resources(category);
CREATE INDEX idx_library_resources_tags ON public.library_resources USING GIN(tags);

-- Discussion indexes
CREATE INDEX idx_discussions_author_id ON public.discussions(author_id);
CREATE INDEX idx_discussions_category ON public.discussions(category);
CREATE INDEX idx_discussions_last_activity_at ON public.discussions(last_activity_at DESC);
CREATE INDEX idx_discussions_tags ON public.discussions USING GIN(tags);

-- Reply indexes
CREATE INDEX idx_discussion_replies_discussion_id ON public.discussion_replies(discussion_id);
CREATE INDEX idx_discussion_replies_author_id ON public.discussion_replies(author_id);
CREATE INDEX idx_discussion_replies_created_at ON public.discussion_replies(created_at);

-- Learning indexes
CREATE INDEX idx_track_modules_track_id ON public.track_modules(track_id, order_index);
CREATE INDEX idx_track_lessons_module_id ON public.track_lessons(module_id, order_index);
CREATE INDEX idx_user_lesson_progress_user_id ON public.user_lesson_progress(user_id);
CREATE INDEX idx_user_lesson_progress_track_id ON public.user_lesson_progress(track_id);

-- Certificate indexes
CREATE INDEX idx_certificates_user_id ON public.certificates(user_id);
CREATE INDEX idx_certificates_track_id ON public.certificates(track_id);
CREATE INDEX idx_certificates_credential_id ON public.certificates(credential_id);

-- Notification indexes
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_read_at ON public.notifications(read_at);

-- ========================================
-- TRIGGERS FOR AUTO-UPDATE
-- ========================================

-- Function to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_prompts_updated_at BEFORE UPDATE ON public.prompts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_library_resources_updated_at BEFORE UPDATE ON public.library_resources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_discussions_updated_at BEFORE UPDATE ON public.discussions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tracks_updated_at BEFORE UPDATE ON public.tracks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_lesson_progress_updated_at BEFORE UPDATE ON public.user_lesson_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update counter caches
CREATE OR REPLACE FUNCTION update_prompt_counters()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.prompts 
        SET likes_count = CASE WHEN NEW.interaction_type = 'like' THEN likes_count + 1 ELSE likes_count END,
            saves_count = CASE WHEN NEW.interaction_type = 'save' THEN saves_count + 1 ELSE saves_count END,
            views_count = CASE WHEN NEW.interaction_type = 'view' THEN views_count + 1 ELSE views_count END,
            runs_count = CASE WHEN NEW.interaction_type = 'run' THEN runs_count + 1 ELSE runs_count END
        WHERE id = NEW.prompt_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.prompts 
        SET likes_count = CASE WHEN OLD.interaction_type = 'like' THEN GREATEST(likes_count - 1, 0) ELSE likes_count END,
            saves_count = CASE WHEN OLD.interaction_type = 'save' THEN GREATEST(saves_count - 1, 0) ELSE saves_count END,
            views_count = CASE WHEN OLD.interaction_type = 'view' THEN GREATEST(views_count - 1, 0) ELSE views_count END,
            runs_count = CASE WHEN OLD.interaction_type = 'run' THEN GREATEST(runs_count - 1, 0) ELSE runs_count END
        WHERE id = OLD.prompt_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_prompt_counters_trigger
    AFTER INSERT OR DELETE ON public.prompt_interactions
    FOR EACH ROW EXECUTE FUNCTION update_prompt_counters();

-- Function to update discussion reply count
CREATE OR REPLACE FUNCTION update_discussion_reply_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.discussions 
        SET replies_count = replies_count + 1,
            last_activity_at = NOW()
        WHERE id = NEW.discussion_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.discussions 
        SET replies_count = GREATEST(replies_count - 1, 0)
        WHERE id = OLD.discussion_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_discussion_reply_count_trigger
    AFTER INSERT OR DELETE ON public.discussion_replies
    FOR EACH ROW EXECUTE FUNCTION update_discussion_reply_count();

-- ========================================
-- FUNCTIONS
-- ========================================

-- Function to generate unique credential IDs for certificates
CREATE OR REPLACE FUNCTION generate_credential_id()
RETURNS TEXT AS $$
BEGIN
    RETURN 'CERT_' || upper(substring(gen_random_uuid()::text from 1 for 8)) || '_' || 
           upper(substring(gen_random_uuid()::text from 1 for 8));
END;
$$ LANGUAGE plpgsql;
