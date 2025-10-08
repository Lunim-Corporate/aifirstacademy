-- Resend Attempts Tracking Table
-- Run this in your Supabase SQL editor to add the resend attempts functionality

-- Table to track resend attempts for OTP codes
CREATE TABLE IF NOT EXISTS resend_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL,
    purpose TEXT NOT NULL CHECK (purpose IN ('signup', 'login', 'reset')),
    attempt_count INTEGER NOT NULL DEFAULT 0,
    last_attempt_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    blocked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint to ensure one tracking record per email/purpose combination
    UNIQUE(email, purpose)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_resend_attempts_email_purpose ON resend_attempts(email, purpose);
CREATE INDEX IF NOT EXISTS idx_resend_attempts_blocked_until ON resend_attempts(blocked_until);
CREATE INDEX IF NOT EXISTS idx_resend_attempts_created_at ON resend_attempts(created_at);

-- Enable Row Level Security
ALTER TABLE resend_attempts ENABLE ROW LEVEL SECURITY;

-- Service role has full access for server-side operations
DROP POLICY IF EXISTS "Service role has full access to resend_attempts" ON resend_attempts;
CREATE POLICY "Service role has full access to resend_attempts" ON resend_attempts
    FOR ALL TO service_role USING (true);

-- Create a function to clean up old resend attempts (older than 24 hours)
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

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION cleanup_expired_resend_attempts() TO service_role;

-- Add helpful comments
COMMENT ON TABLE resend_attempts IS 'Tracks resend attempts for OTP verification codes with rate limiting';
COMMENT ON COLUMN resend_attempts.purpose IS 'The purpose of the OTP: signup, login, or password reset';
COMMENT ON COLUMN resend_attempts.attempt_count IS 'Number of times user has requested a resend for this email/purpose';
COMMENT ON COLUMN resend_attempts.blocked_until IS 'When the user will be unblocked from making more attempts (NULL if not blocked)';
COMMENT ON FUNCTION cleanup_expired_resend_attempts() IS 'Removes resend attempt records older than 24 hours';
