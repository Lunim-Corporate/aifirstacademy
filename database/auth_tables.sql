-- Enhanced Authentication System Schema Updates
-- Run this in your Supabase SQL editor after your existing schema

-- User sessions table for tracking authenticated sessions
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

-- Social auth accounts for OAuth providers
CREATE TABLE IF NOT EXISTS social_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    provider_account_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(provider, provider_account_id)
);

-- Trusted devices for enhanced security
CREATE TABLE IF NOT EXISTS trusted_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    device_name TEXT NOT NULL,
    device_fingerprint TEXT NOT NULL,
    is_trusted BOOLEAN DEFAULT false,
    last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, device_fingerprint)
);

-- Security events for monitoring and alerting
CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    details JSONB,
    risk_score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_social_accounts_user_id ON social_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_social_accounts_provider ON social_accounts(provider, provider_account_id);

CREATE INDEX IF NOT EXISTS idx_trusted_devices_user_id ON trusted_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_fingerprint ON trusted_devices(user_id, device_fingerprint);

CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);

-- Row Level Security (RLS) Policies
-- Enable RLS on all new tables
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE trusted_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- Users can only access their own sessions
DROP POLICY IF EXISTS "Users can view their own sessions" ON user_sessions;
CREATE POLICY "Users can view their own sessions" ON user_sessions
    FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can delete their own sessions" ON user_sessions;
CREATE POLICY "Users can delete their own sessions" ON user_sessions
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Users can only access their own social accounts
DROP POLICY IF EXISTS "Users can view their own social accounts" ON social_accounts;
CREATE POLICY "Users can view their own social accounts" ON social_accounts
    FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can delete their own social accounts" ON social_accounts;
CREATE POLICY "Users can delete their own social accounts" ON social_accounts
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Users can only access their own trusted devices
DROP POLICY IF EXISTS "Users can view their own devices" ON trusted_devices;
CREATE POLICY "Users can view their own devices" ON trusted_devices
    FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can modify their own devices" ON trusted_devices;
CREATE POLICY "Users can modify their own devices" ON trusted_devices
    FOR ALL USING (auth.uid()::text = user_id::text);

-- Users can view their own security events
DROP POLICY IF EXISTS "Users can view their own security events" ON security_events;
CREATE POLICY "Users can view their own security events" ON security_events
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Service role can access all records for administrative functions
DROP POLICY IF EXISTS "Service role has full access to user_sessions" ON user_sessions;
CREATE POLICY "Service role has full access to user_sessions" ON user_sessions
    FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "Service role has full access to social_accounts" ON social_accounts;
CREATE POLICY "Service role has full access to social_accounts" ON social_accounts
    FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "Service role has full access to trusted_devices" ON trusted_devices;
CREATE POLICY "Service role has full access to trusted_devices" ON trusted_devices
    FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "Service role has full access to security_events" ON security_events;
CREATE POLICY "Service role has full access to security_events" ON security_events
    FOR ALL TO service_role USING (true);

-- Create a function to clean up expired sessions (can be called by cron job)
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

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION cleanup_expired_sessions() TO service_role;

-- Optional: Create a function to get user session count
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

GRANT EXECUTE ON FUNCTION get_user_active_session_count(UUID) TO service_role;

-- Add helpful comments
COMMENT ON TABLE user_sessions IS 'Tracks user authentication sessions with device information';
COMMENT ON TABLE social_accounts IS 'Links user accounts with OAuth provider accounts';
COMMENT ON TABLE trusted_devices IS 'Manages device trust for enhanced security';
COMMENT ON TABLE security_events IS 'Logs security-related events for monitoring';

COMMENT ON FUNCTION cleanup_expired_sessions() IS 'Marks expired sessions as inactive';
COMMENT ON FUNCTION get_user_active_session_count(UUID) IS 'Returns count of active sessions for a user';
