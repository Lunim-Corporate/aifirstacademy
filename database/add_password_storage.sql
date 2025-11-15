-- Add password storage columns to users table
-- Run this migration in your Supabase SQL editor

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS password_hash TEXT,
ADD COLUMN IF NOT EXISTS password_salt TEXT,
ADD COLUMN IF NOT EXISTS password_reset_required BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS password_updated_at TIMESTAMP WITH TIME ZONE;

-- Add index for password reset queries
CREATE INDEX IF NOT EXISTS idx_users_password_reset_required ON public.users(password_reset_required) WHERE password_reset_required = true;

-- Set password_reset_required to true for existing users without passwords (migration)
UPDATE public.users 
SET password_reset_required = true 
WHERE password_hash IS NULL OR password_salt IS NULL;

