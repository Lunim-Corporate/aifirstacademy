# Password Reset Troubleshooting Guide

## Issue: 500 Internal Server Error on Password Reset

### Most Common Cause: Database Migration Not Run

The password storage columns may not exist in your database yet. You need to run the migration first.

### Solution: Run Database Migration

1. **Open your Supabase SQL Editor**
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Create a new query

2. **Run the migration script:**

```sql
-- Add password storage columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS password_hash TEXT,
ADD COLUMN IF NOT EXISTS password_salt TEXT,
ADD COLUMN IF NOT EXISTS password_reset_required BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS password_updated_at TIMESTAMP WITH TIME ZONE;

-- Add index for password reset queries
CREATE INDEX IF NOT EXISTS idx_users_password_reset_required 
ON public.users(password_reset_required) 
WHERE password_reset_required = true;

-- Mark existing users without passwords for reset (optional)
UPDATE public.users 
SET password_reset_required = true 
WHERE password_hash IS NULL OR password_salt IS NULL;
```

3. **Verify the migration:**
   - Check that the columns were added successfully
   - You should now see `password_hash`, `password_salt`, `password_reset_required`, and `password_updated_at` in your users table

### Other Common Issues

#### Issue: 401 Unauthorized on `/api/auth/me`
- **This is normal** - Users are not logged in during password reset
- This error can be safely ignored during the password reset flow
- It will be resolved once the user completes password reset and logs in

#### Issue: Session revocation fails
- The code now handles this gracefully
- If session tables don't exist, password reset will still work
- Session revocation is a security enhancement, not a requirement

### Error Codes

The application now returns specific error codes:

- **`MIGRATION_REQUIRED`** - Database columns need to be added
- **`WEAK_PASSWORD`** - Password doesn't meet complexity requirements
- **`INVALID_CREDENTIALS`** - Email/password combination is incorrect
- **`PASSWORD_RESET_REQUIRED`** - User must reset their password before logging in

### Testing After Migration

1. Try resetting a password
2. Check browser console for any errors
3. Check server logs for detailed error messages (in development mode)
4. Verify that the password hash is stored in the database

### Development Mode Error Details

When running in development mode (`NODE_ENV=development`), error responses include additional details:
- Error stack traces
- Specific error messages
- Database error codes

Check your server console for detailed error information.

