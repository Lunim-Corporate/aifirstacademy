-- Complete Database Migration for AI-First Academy
-- Run this entire script in your Supabase SQL Editor

-- ==========================================
-- CREATE MISSING TABLES
-- ==========================================

-- Create resend_attempts table
CREATE TABLE IF NOT EXISTS resend_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL,
    purpose TEXT NOT NULL CHECK (purpose IN ('signup', 'login', 'reset')),
    attempt_count INTEGER NOT NULL DEFAULT 0,
    last_attempt_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    blocked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(email, purpose)
);

-- Create user_sessions table (if not exists)
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true
);

-- Create otp_challenges table (if not exists)
CREATE TABLE IF NOT EXISTS otp_challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pending_id TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    purpose TEXT NOT NULL CHECK (purpose IN ('signup', 'login', 'reset')),
    code TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    consumed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- CREATE INDEXES FOR PERFORMANCE
-- ==========================================

-- Indexes for resend_attempts
CREATE INDEX IF NOT EXISTS idx_resend_attempts_email_purpose ON resend_attempts(email, purpose);
CREATE INDEX IF NOT EXISTS idx_resend_attempts_blocked_until ON resend_attempts(blocked_until);
CREATE INDEX IF NOT EXISTS idx_resend_attempts_created_at ON resend_attempts(created_at);

-- Indexes for user_sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_device_id ON user_sessions(device_id);

-- Indexes for otp_challenges
CREATE INDEX IF NOT EXISTS idx_otp_challenges_pending_id ON otp_challenges(pending_id);
CREATE INDEX IF NOT EXISTS idx_otp_challenges_email ON otp_challenges(email);
CREATE INDEX IF NOT EXISTS idx_otp_challenges_expires_at ON otp_challenges(expires_at);
CREATE INDEX IF NOT EXISTS idx_otp_challenges_user_id ON otp_challenges(user_id);

-- ==========================================
-- ENABLE ROW LEVEL SECURITY
-- ==========================================

ALTER TABLE resend_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_challenges ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- CREATE RLS POLICIES
-- ==========================================

-- Policies for resend_attempts (service role only)
DROP POLICY IF EXISTS "Service role has full access to resend_attempts" ON resend_attempts;
CREATE POLICY "Service role has full access to resend_attempts" ON resend_attempts
    FOR ALL TO service_role USING (true);

-- Policies for user_sessions
DROP POLICY IF EXISTS "Users can view their own sessions" ON user_sessions;
CREATE POLICY "Users can view their own sessions" ON user_sessions
    FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can delete their own sessions" ON user_sessions;
CREATE POLICY "Users can delete their own sessions" ON user_sessions
    FOR DELETE USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Service role has full access to user_sessions" ON user_sessions;
CREATE POLICY "Service role has full access to user_sessions" ON user_sessions
    FOR ALL TO service_role USING (true);

-- Policies for otp_challenges (service role only for security)
DROP POLICY IF EXISTS "Service role has full access to otp_challenges" ON otp_challenges;
CREATE POLICY "Service role has full access to otp_challenges" ON otp_challenges
    FOR ALL TO service_role USING (true);

-- ==========================================
-- CREATE UTILITY FUNCTIONS
-- ==========================================

-- Function to cleanup expired resend attempts
CREATE OR REPLACE FUNCTION cleanup_expired_resend_attempts()
RETURNS INTEGER AS $$
DECLARE
    cleaned_count INTEGER;
BEGIN
    DELETE FROM resend_attempts 
    WHERE created_at < NOW() - INTERVAL '24 hours';
    
    GET DIAGNOSTICS cleaned_count = ROW_COUNT;
    RETURN cleaned_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    cleaned_count INTEGER;
BEGIN
    UPDATE user_sessions 
    SET is_active = false 
    WHERE expires_at < NOW() AND is_active = true;
    
    GET DIAGNOSTICS cleaned_count = ROW_COUNT;
    RETURN cleaned_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup expired OTP challenges
CREATE OR REPLACE FUNCTION cleanup_expired_otp_challenges()
RETURNS INTEGER AS $$
DECLARE
    cleaned_count INTEGER;
BEGIN
    DELETE FROM otp_challenges 
    WHERE expires_at < NOW() AND consumed_at IS NULL;
    
    GET DIAGNOSTICS cleaned_count = ROW_COUNT;
    RETURN cleaned_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user active session count
CREATE OR REPLACE FUNCTION get_user_active_session_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER 
        FROM user_sessions 
        WHERE user_id = user_uuid 
        AND is_active = true 
        AND expires_at > NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- GRANT PERMISSIONS
-- ==========================================

GRANT EXECUTE ON FUNCTION cleanup_expired_resend_attempts() TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_expired_sessions() TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_expired_otp_challenges() TO service_role;
GRANT EXECUTE ON FUNCTION get_user_active_session_count(UUID) TO service_role;

-- ==========================================
-- ADD COMMENTS FOR DOCUMENTATION
-- ==========================================

COMMENT ON TABLE resend_attempts IS 'Tracks resend attempts for OTP verification codes with rate limiting';
COMMENT ON TABLE user_sessions IS 'Tracks user authentication sessions with device information';
COMMENT ON TABLE otp_challenges IS 'Stores OTP verification codes for login, signup, and password reset';

COMMENT ON FUNCTION cleanup_expired_resend_attempts() IS 'Removes resend attempt records older than 24 hours';
COMMENT ON FUNCTION cleanup_expired_sessions() IS 'Marks expired sessions as inactive';
COMMENT ON FUNCTION cleanup_expired_otp_challenges() IS 'Removes expired OTP challenges';
COMMENT ON FUNCTION get_user_active_session_count(UUID) IS 'Returns count of active sessions for a user';

-- ==========================================
-- VERIFICATION QUERIES
-- ==========================================

-- Verify tables were created successfully
DO $$
BEGIN
    RAISE NOTICE '=== DATABASE MIGRATION COMPLETED ===';
    RAISE NOTICE 'Tables created:';
    RAISE NOTICE '- resend_attempts: %', (SELECT count(*) FROM information_schema.tables WHERE table_name = 'resend_attempts');
    RAISE NOTICE '- user_sessions: %', (SELECT count(*) FROM information_schema.tables WHERE table_name = 'user_sessions');  
    RAISE NOTICE '- otp_challenges: %', (SELECT count(*) FROM information_schema.tables WHERE table_name = 'otp_challenges');
    RAISE NOTICE 'Migration successful! Your AI-First Academy system is ready.';
END $$;
