import { RequestHandler, Router } from 'express';
import {
  createId,
  createOtpCode,
  getUserByEmail,
  getUserById,
  createUser,
  updateUser,
  createOTPChallenge,
  getOTPChallenge,
  consumeOTPChallenge,
  getResendAttempt,
  createResendAttempt,
  updateResendAttempt,
  hashPassword,
  User
} from '../storage-supabase';

// Enhanced authentication imports
import { jwtManager } from '../auth/jwt-enhanced';
import { sessionManager } from '../auth/session-manager';
import { emailService } from '../services/email';
import {
  authenticateToken,
  rateLimitAuth,
  validateDevice,
  logSecurityEvent,
  checkSessionLimit,
  AuthenticatedRequest
} from '../middleware/auth-enhanced';
import { validatePassword, getPasswordErrorMessage } from '../utils/password-validation';

const router = Router();

// Apply rate limiting to auth endpoints
router.use(rateLimitAuth(5, 15 * 60 * 1000)); // 5 attempts per 15 minutes

// Cookie management helper (for backward compatibility)
function setAuthCookie(res: any, token: string, req: any) {
  const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'http';
  const isSecure = proto.includes('https');
  const cookie = [
    `auth_token=${encodeURIComponent(token)}`,
    'Path=/',
    'SameSite=Lax',
    isSecure ? 'Secure' : '',
    `Max-Age=${7 * 24 * 60 * 60}`, // 7 days
  ].filter(Boolean).join('; ');
  res.setHeader('Set-Cookie', cookie);
}

function clearAuthCookie(res: any, req: any) {
  const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'http';
  const isSecure = proto.includes('https');
  const cookie = [
    `auth_token=`,
    'Path=/',
    'SameSite=Lax',
    isSecure ? 'Secure' : '',
    'Max-Age=0',
  ].filter(Boolean).join('; ');
  res.setHeader('Set-Cookie', cookie);
}

// ===== Enhanced OTP Authentication =====

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
const MAX_RESEND_ATTEMPTS = 5;
const RESEND_BLOCK_DURATION_MS = 60 * 60 * 1000; // 1 hour

async function createAndSendOtp(email: string, purpose: 'signup' | 'login' | 'reset', userId?: string, name?: string) {
  const pendingId = createId(); // Generate pure UUID for database storage
  const otp = createOtpCode();
  
  const otpChallenge = await createOTPChallenge({
    pending_id: pendingId,
    email,
    user_id: userId,
    purpose,
    code: otp,
    expires_at: new Date(Date.now() + OTP_TTL_MS).toISOString(),
  });

  // In development mode, log the code first (so users can proceed even if email fails)
  if (process.env.NODE_ENV === 'development') {
    console.log('\n🔐 DEVELOPMENT MODE - OTP CODE:');
    console.log(`Email: ${email}`);
    console.log(`Purpose: ${purpose}`);
    console.log(`Code: ${otp}`);
    console.log(`Pending ID: ${pendingId}`);
    console.log('Copy this code to verify your login/signup!\n');
  }

  // Try to send email, but don't fail the request if it fails in development
  try {
    await emailService.sendOTPEmail({
      email,
      code: otp,
      purpose,
      name,
    });
  } catch (emailError) {
    console.error('Failed to send OTP email:', emailError);
    if (process.env.NODE_ENV !== 'development') {
      throw emailError; // Only fail in production
    }
    console.log('⚠️  Email sending failed but continuing in development mode');
  }

  return { pendingId };
}

// Enhanced signup with improved flow
export const signupStart: RequestHandler = async (req, res) => {
  try {
    const { email, password, name } = req.body as { email?: string; password?: string; name?: string };
    
    if (!email || !password || !name) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        code: 'MISSING_FIELDS'
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Invalid email format',
        code: 'INVALID_EMAIL'
      });
    }

    // Validate password strength (CRITICAL: Backend enforcement)
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      const errorMessage = getPasswordErrorMessage(passwordValidation);
      return res.status(400).json({ 
        error: errorMessage || 'Password does not meet security requirements',
        code: 'WEAK_PASSWORD',
        details: passwordValidation.errors
      });
    }

    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ 
        error: 'Email already registered',
        code: 'EMAIL_EXISTS'
      });
    }
    
    const user = await createUser({
      email,
      name,
      role: 'student' as const,
      is_verified: false,
    });
    
    // Store password hash immediately after user creation
    const salt = createId('salt');
    const passwordHash = hashPassword(password, salt);
    await updateUser(user.id, {
      password_hash: passwordHash,
      password_salt: salt,
      password_reset_required: false,
      password_updated_at: new Date().toISOString(),
    });
    
    const { pendingId } = await createAndSendOtp(email, 'signup', user.id, name);
    
    res.status(202).json({ 
      next: 'otp', 
      pendingId, 
      email,
      message: 'Verification code sent to your email'
    });
  } catch (error) {
    console.error('Signup start error:', error);
    
    // Check if it's an email service error and provide better message
    if (error instanceof Error && error.message.includes('email')) {
      return res.status(500).json({ 
        error: 'Unable to send verification email. Please try again later.',
        code: 'EMAIL_SERVICE_ERROR'
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
};

// Enhanced login with improved flow  
export const loginStart: RequestHandler = async (req, res) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Missing credentials',
        code: 'MISSING_CREDENTIALS'
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Invalid email format',
        code: 'INVALID_EMAIL'
      });
    }
    
    // Validate password format (must meet complexity requirements)
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      const errorMessage = getPasswordErrorMessage(passwordValidation);
      return res.status(400).json({ 
        error: errorMessage || 'Password does not meet security requirements',
        code: 'WEAK_PASSWORD',
        details: passwordValidation.errors
      });
    }
    
    let user;
    try {
      user = await getUserByEmail(email);
    } catch (dbError) {
      console.error('Database error while fetching user:', dbError);
      return res.status(500).json({ 
        error: 'Database error. Please try again later.',
        code: 'DATABASE_ERROR'
      });
    }
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }
    
    // Check if user needs to reset password (no password hash or reset required)
    if (!user.password_hash || !user.password_salt || user.password_reset_required) {
      return res.status(403).json({ 
        error: 'Password reset required. Please reset your password to continue.',
        code: 'PASSWORD_RESET_REQUIRED',
        requiresReset: true
      });
    }
    
    // Verify password hash matches stored hash
    const providedHash = hashPassword(password, user.password_salt);
    if (providedHash !== user.password_hash) {
      return res.status(401).json({ 
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }
    
    // Password verified successfully - proceed with OTP
    try {
      const { pendingId } = await createAndSendOtp(email, 'login', user.id, user.name);
      
      res.status(202).json({ 
        next: 'otp', 
        pendingId, 
        email,
        message: 'Verification code sent to your email'
      });
    } catch (otpError) {
      console.error('OTP creation/sending error:', otpError);
      
      // Check if it's an email service error
      if (otpError instanceof Error && otpError.message.includes('email')) {
        return res.status(500).json({ 
          error: 'Unable to send verification email. Please try again later.',
          code: 'EMAIL_SERVICE_ERROR'
        });
      }
      
      return res.status(500).json({ 
        error: 'Failed to send verification code. Please try again.',
        code: 'OTP_ERROR'
      });
    }
  } catch (error) {
    console.error('Login start error:', error);
    
    res.status(500).json({ 
      error: 'Internal server error. Please try again later.',
      code: 'SERVER_ERROR',
      ...(process.env.NODE_ENV === 'development' && { details: error instanceof Error ? error.message : 'Unknown error' })
    });
  }
};

// Enhanced OTP verification with session management
export const otpVerify: RequestHandler = async (req, res) => {
  try {
    const { pendingId, code, deviceInfo, rememberDevice } = req.body as { 
      pendingId?: string; 
      code?: string; 
      deviceInfo?: any;
      rememberDevice?: boolean;
    };
    
    if (!pendingId || !code) {
      return res.status(400).json({ 
        error: 'Missing fields',
        code: 'MISSING_FIELDS'
      });
    }
    
    const entry = await getOTPChallenge(pendingId);
    if (!entry || entry.consumed_at) {
      // In development mode, provide more helpful error message
      if (process.env.NODE_ENV === 'development') {
        return res.status(400).json({ 
          error: 'Code not found or already used. Try requesting a new code.',
          code: 'INVALID_CHALLENGE'
        });
      }
      return res.status(400).json({ 
        error: 'Invalid or expired challenge',
        code: 'INVALID_CHALLENGE'
      });
    }
    
    if (new Date(entry.expires_at).getTime() < Date.now()) {
      return res.status(400).json({ 
        error: 'Code expired',
        code: 'CODE_EXPIRED'
      });
    }
    
    if (entry.code !== code) {
      return res.status(400).json({ 
        error: 'Invalid code',
        code: 'INVALID_CODE'
      });
    }

    // Mark OTP as consumed
    await consumeOTPChallenge(entry.id);
    
    // Get user
    let user = entry.user_id ? await getUserById(entry.user_id) : await getUserByEmail(entry.email);
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // If signup and user not verified, mark as verified
    // Also ensure password hash is stored (in case it wasn't stored during signup)
    if (entry.purpose === 'signup' && !user.is_verified) {
      const updates: any = { is_verified: true };
      
      // If password hash is missing, we need to get it from the signup request
      // For now, we'll mark the user as needing password reset if hash is missing
      if (!user.password_hash || !user.password_salt) {
        updates.password_reset_required = true;
      }
      
      user = await updateUser(user.id, updates);
    }
    
    // Try to create session with enhanced auth, fall back to legacy if tables don't exist
    let accessToken: string;
    let refreshToken: string | undefined;
    let sessionData: any = null;
    
    try {
      // Create session with device info
      const session = await sessionManager.createSession(
        user.id,
        {
          userAgent: req.get('User-Agent'),
          deviceId: deviceInfo?.deviceId,
          name: deviceInfo?.name,
        },
        req.ip || 'unknown'
      );
      
      // Generate tokens with legacy compatibility
      accessToken = jwtManager.generateAccessToken({
        userId: user.id,
        sub: user.id, // Legacy compatibility
        email: user.email,
        role: user.role,
        sessionId: session.id,
        deviceId: session.device_id,
      });
      
      refreshToken = jwtManager.generateRefreshToken({
        userId: user.id,
        sessionId: session.id,
        tokenVersion: 1,
      });
      
      sessionData = {
        id: session.id,
        expiresAt: session.expires_at,
        deviceId: session.device_id,
      };
      
      // Extend session if remember device is enabled
      if (rememberDevice) {
        await sessionManager.extendSession(session.id, 30 * 24); // 30 days
      }
    } catch (sessionError) {
      // Fallback to legacy JWT-only auth if session tables don't exist
      console.warn('Session creation failed, falling back to legacy auth:', sessionError);
      
      // Use the legacy signToken from utils/jwt
      const { signToken } = require('../utils/jwt');
      accessToken = signToken({ 
        sub: user.id, 
        email: user.email, 
        role: user.role 
      });
    }
    
    // Set cookie for backward compatibility with legacy auth
    setAuthCookie(res, accessToken, req);
    
    res.json({
      token: accessToken, // Legacy compatibility
      accessToken,
      ...(refreshToken && { refreshToken }),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      ...(sessionData && { session: sessionData })
    });
  } catch (error) {
    console.error('OTP verify error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
};

// Token refresh endpoint
export const refreshToken: RequestHandler = async (req, res) => {
  try {
    const { refreshToken } = req.body as { refreshToken?: string };
    
    if (!refreshToken) {
      return res.status(400).json({ 
        error: 'Refresh token required',
        code: 'MISSING_REFRESH_TOKEN'
      });
    }
    
    const payload = jwtManager.verifyRefreshToken(refreshToken);
    if (!payload) {
      return res.status(403).json({ 
        error: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }
    
    // Validate session
    const session = await sessionManager.validateSession(payload.sessionId);
    if (!session) {
      return res.status(403).json({ 
        error: 'Invalid session',
        code: 'INVALID_SESSION'
      });
    }
    
    // Get user
    const user = await getUserById(payload.userId);
    if (!user) {
      return res.status(403).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // Generate new access token with legacy compatibility
    const newAccessToken = jwtManager.generateAccessToken({
      userId: user.id,
      sub: user.id, // Legacy compatibility
      email: user.email,
      role: user.role,
      sessionId: session.id,
      deviceId: session.device_id,
    });
    
    res.json({ 
      accessToken: newAccessToken,
      expiresIn: jwtManager.getAccessTokenExpiry(),
    });
    
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ 
      error: 'Token refresh failed',
      code: 'REFRESH_ERROR'
    });
  }
};

// Enhanced logout
export const logout: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    if (req.user?.sessionId) {
      await sessionManager.revokeSession(req.user.sessionId);
    }
    
    clearAuthCookie(res, req);
    
    res.json({ 
      message: 'Logged out successfully',
      success: true
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      error: 'Logout failed',
      code: 'LOGOUT_ERROR'
    });
  }
};

// Logout from all devices
export const logoutAll: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    if (req.user?.id) {
      await sessionManager.revokeAllUserSessions(req.user.id);
    }
    
    clearAuthCookie(res, req);
    
    res.json({ 
      message: 'Logged out from all devices',
      success: true
    });
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({ 
      error: 'Logout failed',
      code: 'LOGOUT_ALL_ERROR'
    });
  }
};

// Enhanced me endpoint
export const me: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }
    
    // Get fresh user data
    const user = await getUserById(req.user.id);
    if (!user) {
      clearAuthCookie(res, req);
      return res.status(404).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // Get session info
    const sessionStats = await sessionManager.getUserSessionStats(user.id);
    
    res.json({ 
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isVerified: user.is_verified,
        createdAt: user.created_at,
      },
      session: {
        id: req.user.sessionId,
        activeSessionCount: sessionStats.activeCount,
        lastActivity: sessionStats.lastActivity,
      }
    });
  } catch (error) {
    console.error('Get user info error:', error);
    res.status(500).json({ 
      error: 'Failed to get user info',
      code: 'GET_USER_ERROR'
    });
  }
};

// Get user sessions
export const getSessions: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }
    
    const sessions = await sessionManager.getUserSessions(req.user.id);
    
    // Format sessions for frontend
    const formattedSessions = sessions.map(session => ({
      id: session.id,
      deviceId: session.device_id,
      ipAddress: session.ip_address,
      userAgent: session.user_agent,
      createdAt: session.created_at,
      lastActivity: session.last_activity,
      isCurrent: session.id === req.user!.sessionId,
    }));
    
    res.json({
      sessions: formattedSessions,
      total: formattedSessions.length,
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ 
      error: 'Failed to get sessions',
      code: 'GET_SESSIONS_ERROR'
    });
  }
};

// Revoke specific session
export const revokeSession: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    const { sessionId } = req.params;
    
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }
    
    if (!sessionId) {
      return res.status(400).json({ 
        error: 'Session ID required',
        code: 'MISSING_SESSION_ID'
      });
    }
    
    // Verify the session belongs to the user
    const sessions = await sessionManager.getUserSessions(req.user.id);
    const sessionExists = sessions.some(s => s.id === sessionId);
    
    if (!sessionExists) {
      return res.status(404).json({ 
        error: 'Session not found',
        code: 'SESSION_NOT_FOUND'
      });
    }
    
    await sessionManager.revokeSession(sessionId);
    
    res.json({ 
      message: 'Session revoked successfully',
      success: true
    });
  } catch (error) {
    console.error('Revoke session error:', error);
    res.status(500).json({ 
      error: 'Failed to revoke session',
      code: 'REVOKE_SESSION_ERROR'
    });
  }
};

// ===== Forgot Password Flow =====

// Start forgot password flow
export const forgotPasswordStart: RequestHandler = async (req, res) => {
  try {
    const { email } = req.body as { email?: string };
    
    if (!email) {
      return res.status(400).json({ 
        error: 'Email is required',
        code: 'MISSING_EMAIL'
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Invalid email format',
        code: 'INVALID_EMAIL'
      });
    }
    
    // Check if user exists
    const user = await getUserByEmail(email);
    if (!user) {
      // For security, return success even if user doesn't exist
      return res.status(202).json({ 
        next: 'otp',
        email,
        message: 'If this email exists, a verification code has been sent'
      });
    }
    
    const { pendingId } = await createAndSendOtp(email, 'reset', user.id, user.name);
    
    res.status(202).json({ 
      next: 'otp', 
      pendingId, 
      email,
      message: 'Password reset code sent to your email'
    });
  } catch (error) {
    console.error('Forgot password start error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
};

// Reset password with OTP
export const resetPassword: RequestHandler = async (req, res) => {
  try {
    const { pendingId, code, newPassword } = req.body as { 
      pendingId?: string; 
      code?: string; 
      newPassword?: string;
    };
    
    if (!pendingId || !code || !newPassword) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        code: 'MISSING_FIELDS'
      });
    }
    
    // Validate password strength (CRITICAL: Backend enforcement)
    // Includes complexity requirements: lowercase, uppercase, number, special character
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      const errorMessage = getPasswordErrorMessage(passwordValidation);
      return res.status(400).json({ 
        error: errorMessage || 'Password does not meet security requirements',
        code: 'WEAK_PASSWORD',
        details: passwordValidation.errors,
        requirements: {
          minLength: 8,
          maxLength: 128,
          requiresLowercase: true,
          requiresUppercase: true,
          requiresNumber: true,
          requiresSpecialChar: true
        }
      });
    }
    
    const entry = await getOTPChallenge(pendingId);
    if (!entry || entry.consumed_at) {
      return res.status(400).json({ 
        error: 'Invalid or expired challenge',
        code: 'INVALID_CHALLENGE'
      });
    }
    
    if (entry.purpose !== 'reset') {
      return res.status(400).json({ 
        error: 'Invalid challenge type',
        code: 'INVALID_CHALLENGE_TYPE'
      });
    }
    
    if (new Date(entry.expires_at).getTime() < Date.now()) {
      return res.status(400).json({ 
        error: 'Code expired',
        code: 'CODE_EXPIRED'
      });
    }
    
    if (entry.code !== code) {
      return res.status(400).json({ 
        error: 'Invalid code',
        code: 'INVALID_CODE'
      });
    }

    // Mark OTP as consumed
    await consumeOTPChallenge(entry.id);
    
    // Get user
    const user = entry.user_id ? await getUserById(entry.user_id) : await getUserByEmail(entry.email);
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // Store new password hash
    const salt = createId('salt');
    const passwordHash = hashPassword(newPassword, salt);
    
    try {
      await updateUser(user.id, { 
        password_hash: passwordHash,
        password_salt: salt,
        password_reset_required: false,
        password_updated_at: new Date().toISOString(),
        is_verified: true // Ensure user is verified after password reset
      });
    } catch (updateError: any) {
      console.error('Error updating user password:', updateError);
      
      // Check if columns don't exist yet (migration not run)
      if (updateError?.code === '42703' || updateError?.message?.includes('column')) {
        return res.status(500).json({ 
          error: 'Database migration required. Please run the password storage migration first.',
          code: 'MIGRATION_REQUIRED',
          details: 'The password_hash and password_salt columns need to be added to the users table.'
        });
      }
      
      throw updateError; // Re-throw if it's a different error
    }
    
    // Revoke all existing sessions for security (gracefully handle if sessions don't exist)
    try {
      await sessionManager.revokeAllUserSessions(user.id);
    } catch (sessionError) {
      // Log but don't fail the request if session revocation fails
      console.warn('Failed to revoke sessions (may not be critical):', sessionError);
    }
    
    res.json({ 
      message: 'Password reset successfully',
      success: true
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'SERVER_ERROR',
      ...(process.env.NODE_ENV === 'development' && { 
        details: error instanceof Error ? error.message : 'Unknown error' 
      })
    });
  }
};

// ===== Resend Code Functionality =====

async function checkResendLimits(email: string, purpose: 'signup' | 'login' | 'reset'): Promise<{
  allowed: boolean;
  waitTime?: number;
  reason?: string;
  attemptsLeft?: number;
}> {
  const existing = await getResendAttempt(email, purpose);
  
  if (!existing) {
    return { allowed: true };
  }
  
  const now = Date.now();
  const lastAttempt = new Date(existing.last_attempt_at).getTime();
  
  // Check if user is temporarily blocked
  if (existing.blocked_until && new Date(existing.blocked_until).getTime() > now) {
    const waitTime = new Date(existing.blocked_until).getTime() - now;
    return {
      allowed: false,
      waitTime,
      reason: 'Too many attempts. Please try again later.'
    };
  }
  
  // Check cooldown period
  if (now - lastAttempt < RESEND_COOLDOWN_MS) {
    const waitTime = RESEND_COOLDOWN_MS - (now - lastAttempt);
    return {
      allowed: false,
      waitTime,
      reason: 'Please wait before requesting another code.'
    };
  }
  
  // Check max attempts
  if (existing.attempt_count >= MAX_RESEND_ATTEMPTS) {
    // Block user for 1 hour
    const blockedUntil = new Date(now + RESEND_BLOCK_DURATION_MS).toISOString();
    await updateResendAttempt(existing.id, {
      blocked_until: blockedUntil
    });
    
    return {
      allowed: false,
      waitTime: RESEND_BLOCK_DURATION_MS,
      reason: 'Too many resend attempts. Account temporarily blocked for security.'
    };
  }
  
  return {
    allowed: true,
    attemptsLeft: MAX_RESEND_ATTEMPTS - existing.attempt_count
  };
}

// Resend verification code
export const resendCode: RequestHandler = async (req, res) => {
  try {
    const { email, purpose } = req.body as { 
      email?: string; 
      purpose?: 'signup' | 'login' | 'reset';
    };
    
    if (!email || !purpose) {
      return res.status(400).json({ 
        error: 'Email and purpose are required',
        code: 'MISSING_FIELDS'
      });
    }
    
    // Check resend limits (with fallback if database unavailable)
    let limitCheck: {
      allowed: boolean;
      waitTime?: number;
      reason?: string;
      attemptsLeft?: number;
    } = { allowed: true };
    try {
      limitCheck = await checkResendLimits(email, purpose);
      if (!limitCheck.allowed) {
        return res.status(429).json({ 
          error: limitCheck.reason || 'Please try again later',
          code: 'RATE_LIMITED',
          waitTime: limitCheck.waitTime
        });
      }
    } catch (rateLimitError) {
      // If rate limiting check fails, allow the request but log the error
      console.warn('Rate limiting check failed, allowing request:', rateLimitError);
    }
    
    // Get user info based on purpose
    let user = null;
    if (purpose === 'signup') {
      user = await getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ 
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }
    } else if (purpose === 'login' || purpose === 'reset') {
      user = await getUserByEmail(email);
      if (!user && purpose === 'login') {
        return res.status(404).json({ 
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }
      // For reset, we allow even if user doesn't exist for security
    }
    
    // Send new OTP
    const { pendingId } = await createAndSendOtp(email, purpose, user?.id, user?.name);
    
    // Update resend attempts (only if database is available)
    try {
      const existing = await getResendAttempt(email, purpose);
      if (existing) {
        await updateResendAttempt(existing.id, {
          attempt_count: existing.attempt_count + 1,
          last_attempt_at: new Date().toISOString(),
          blocked_until: undefined // Clear any existing block
        });
      } else {
        await createResendAttempt({
          email,
          purpose,
          attempt_count: 1,
          last_attempt_at: new Date().toISOString()
        });
      }
    } catch (dbError) {
      // Log database error but don't fail the request
      console.error('Failed to update resend attempts tracking:', dbError);
      // Continue with email sending even if tracking fails
    }
    
    res.status(202).json({ 
      pendingId,
      email,
      message: 'New verification code sent',
      attemptsLeft: limitCheck.attemptsLeft ? limitCheck.attemptsLeft - 1 : MAX_RESEND_ATTEMPTS - 1,
      cooldownSeconds: RESEND_COOLDOWN_MS / 1000
    });
  } catch (error) {
    console.error('Resend code error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
};

// ===== Route Registration =====

// Public routes (no authentication required)
router.post('/signup/start', validateDevice, logSecurityEvent('signup_attempt'), signupStart);
router.post('/login/start', validateDevice, logSecurityEvent('login_attempt'), loginStart);
router.post('/verify-otp', validateDevice, logSecurityEvent('otp_verify'), otpVerify);
router.post('/forgot-password', validateDevice, logSecurityEvent('forgot_password_attempt'), forgotPasswordStart);
router.post('/reset-password', validateDevice, logSecurityEvent('password_reset'), resetPassword);
router.post('/resend-code', validateDevice, logSecurityEvent('resend_code'), resendCode);
router.post('/refresh', refreshToken);

// Protected routes (authentication required)
router.use(authenticateToken);
router.use(checkSessionLimit(10)); // Max 10 sessions per user

router.get('/me', me);
router.post('/logout', logSecurityEvent('logout'), logout);
router.post('/logout-all', logSecurityEvent('logout_all'), logoutAll);
router.get('/sessions', getSessions);
router.delete('/sessions/:sessionId', revokeSession);

// For backward compatibility, also export individual handlers
export {
  signupStart as signupStart_compat,
  loginStart as loginStart_compat,
  otpVerify as otpVerify_compat,
  me as me_compat,
  logout as logout_compat,
};

export default router;
