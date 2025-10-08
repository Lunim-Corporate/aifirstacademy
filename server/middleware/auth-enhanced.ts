import { Request, Response, NextFunction } from 'express';
import { jwtManager } from '../auth/jwt-enhanced';
import { sessionManager } from '../auth/session-manager';
import { getUserById } from '../storage-supabase';

// Extended Request interface
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    sessionId: string;
  };
}

// Enhanced auth middleware with session validation
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = jwtManager.extractTokenFromRequest(req);
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Access token required',
        code: 'MISSING_TOKEN'
      });
    }

    // Verify JWT
    const payload = jwtManager.verifyAccessToken(token);
    if (!payload) {
      return res.status(403).json({ 
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
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

    // Verify user still exists and is active
    const user = await getUserById(payload.userId);
    if (!user) {
      return res.status(403).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Add user info to request
    req.user = {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
      sessionId: payload.sessionId,
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      error: 'Authentication error',
      code: 'AUTH_ERROR'
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuthentication = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = jwtManager.extractTokenFromRequest(req);
    
    if (!token) {
      return next(); // Continue without authentication
    }

    const payload = jwtManager.verifyAccessToken(token);
    if (!payload) {
      return next(); // Continue without authentication
    }

    const session = await sessionManager.validateSession(payload.sessionId);
    if (!session) {
      return next(); // Continue without authentication
    }

    const user = await getUserById(payload.userId);
    if (!user) {
      return next(); // Continue without authentication
    }

    req.user = {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
      sessionId: payload.sessionId,
    };

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next(); // Continue without authentication on error
  }
};

// Role-based authorization middleware
export const requireRole = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: roles,
        current: req.user.role
      });
    }

    next();
  };
};

// Rate limiting middleware for authentication endpoints
const attemptCounts = new Map<string, { count: number; resetTime: number; attempts: number[] }>();

export const rateLimitAuth = (maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Get client IP respecting trust proxy settings
    let clientIP: string;
    if (process.env.NODE_ENV === 'production') {
      // In production, use forwarded IP from trusted proxy
      clientIP = req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
    } else {
      // In development, use direct connection or fallback
      clientIP = (req.socket?.remoteAddress || req.ip || 'localhost').toString();
    }
    
    const key = clientIP;
    const now = Date.now();
    
    let attempts = attemptCounts.get(key);
    
    if (!attempts) {
      attempts = { count: 0, resetTime: now + windowMs, attempts: [] };
      attemptCounts.set(key, attempts);
    }

    // Clean old attempts outside the window
    attempts.attempts = attempts.attempts.filter(time => time > now - windowMs);
    
    if (now >= attempts.resetTime) {
      // Reset the window
      attempts.count = 0;
      attempts.resetTime = now + windowMs;
      attempts.attempts = [];
    }

    attempts.attempts.push(now);
    attempts.count = attempts.attempts.length;

    if (attempts.count > maxAttempts) {
      const remainingTime = Math.ceil((attempts.resetTime - now) / 1000);
      return res.status(429).json({ 
        error: 'Too many authentication attempts. Please try again later.',
        code: 'RATE_LIMITED',
        retryAfter: remainingTime
      });
    }

    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': maxAttempts.toString(),
      'X-RateLimit-Remaining': Math.max(0, maxAttempts - attempts.count).toString(),
      'X-RateLimit-Reset': new Date(attempts.resetTime).toISOString()
    });

    next();
  };
};

// Middleware to check if user has too many active sessions
export const checkSessionLimit = (maxSessions: number = 10) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next();
    }

    try {
      const hasExcessiveSessions = await sessionManager.hasExcessiveSessions(
        req.user.id, 
        maxSessions
      );
      
      if (hasExcessiveSessions) {
        // Optionally enforce the limit by revoking old sessions
        await sessionManager.enforceSessionLimit(req.user.id, maxSessions);
        
        // Log this event
        console.warn(`User ${req.user.id} exceeded session limit, oldest sessions revoked`);
      }
      
      next();
    } catch (error) {
      console.error('Session limit check error:', error);
      next(); // Continue despite error
    }
  };
};

// Middleware to log security events
export const logSecurityEvent = (eventType: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // Use response 'finish' event to log after response is sent
      res.on('finish', () => {
        // Log the security event asynchronously
        setImmediate(() => {
          try {
            const userId = req.user?.id;
            const success = res.statusCode < 400;
            
            // Simple logging for now - in production, you'd use the security monitor
            console.log(`Security Event: ${eventType}`, {
              userId,
              success,
              ip: req.ip,
              userAgent: req.get('User-Agent'),
              statusCode: res.statusCode,
              timestamp: new Date().toISOString()
            });
          } catch (logError) {
            console.error('Failed to log security event:', logError);
          }
        });
      });
      
      next();
    } catch (error) {
      console.error('Security logging middleware error:', error);
      next();
    }
  };
};

// Middleware to validate device information
export const validateDevice = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userAgent = req.get('User-Agent');
  const deviceInfo = req.body.deviceInfo;

  // Add device info to request if not provided
  if (!deviceInfo) {
    req.body.deviceInfo = {
      userAgent,
      name: getUserAgentDevice(userAgent),
    };
  }

  next();
};

// Helper function to extract device name from user agent
function getUserAgentDevice(userAgent?: string): string {
  if (!userAgent) return 'Unknown Device';

  if (userAgent.includes('Mobile') || userAgent.includes('Android')) {
    return 'Mobile Device';
  } else if (userAgent.includes('iPad')) {
    return 'iPad';
  } else if (userAgent.includes('iPhone')) {
    return 'iPhone';
  } else if (userAgent.includes('Macintosh')) {
    return 'Mac';
  } else if (userAgent.includes('Windows')) {
    return 'Windows PC';
  } else if (userAgent.includes('Linux')) {
    return 'Linux PC';
  } else {
    return 'Desktop Browser';
  }
}

// Cleanup function to run periodically
export const cleanupExpiredSessions = async (): Promise<number> => {
  try {
    return await sessionManager.cleanupExpiredSessions();
  } catch (error) {
    console.error('Failed to cleanup expired sessions:', error);
    return 0;
  }
};

// Export types
export type { AuthenticatedRequest };
