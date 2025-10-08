import jwt from 'jsonwebtoken';
import crypto from 'crypto';

interface JWTPayload {
  userId: string;
  sub?: string; // Legacy compatibility
  email: string;
  role: string;
  sessionId: string;
  deviceId?: string;
  iat: number;
  exp: number;
}

interface RefreshTokenPayload {
  userId: string;
  sessionId: string;
  tokenVersion: number;
  iat: number;
  exp: number;
}

class EnhancedJWTManager {
  private readonly JWT_SECRET: string;
  private readonly REFRESH_SECRET: string;
  private readonly ACCESS_TOKEN_EXPIRY = '15m'; // Short-lived access tokens
  private readonly REFRESH_TOKEN_EXPIRY = '7d'; // Longer-lived refresh tokens

  constructor() {
    this.JWT_SECRET = process.env.JWT_SECRET!;
    if (!this.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is required');
    }
    this.REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || this.JWT_SECRET + '_refresh';
  }

  // Generate access token with enhanced payload
  generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY,
      issuer: 'aifirst-academy',
      audience: 'aifirst-users',
    });
  }

  // Generate refresh token
  generateRefreshToken(payload: Omit<RefreshTokenPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, this.REFRESH_SECRET, {
      expiresIn: this.REFRESH_TOKEN_EXPIRY,
      issuer: 'aifirst-academy',
      audience: 'aifirst-refresh',
    });
  }

  // Verify access token
  verifyAccessToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, this.JWT_SECRET, {
        issuer: 'aifirst-academy',
        audience: 'aifirst-users',
      }) as JWTPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        console.log('Access token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        console.log('Invalid access token');
      } else {
        console.error('Access token verification error:', error);
      }
      return null;
    }
  }

  // Verify refresh token
  verifyRefreshToken(token: string): RefreshTokenPayload | null {
    try {
      return jwt.verify(token, this.REFRESH_SECRET, {
        issuer: 'aifirst-academy',
        audience: 'aifirst-refresh',
      }) as RefreshTokenPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        console.log('Refresh token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        console.log('Invalid refresh token');
      } else {
        console.error('Refresh token verification error:', error);
      }
      return null;
    }
  }

  // Generate secure session ID
  generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Generate device fingerprint
  generateDeviceId(userAgent: string, ip: string): string {
    const combined = `${userAgent}-${ip}-${Date.now()}`;
    return crypto.createHash('sha256').update(combined).digest('hex');
  }

  // Extract token from Authorization header or cookie
  extractTokenFromRequest(req: any): string | null {
    // Try Authorization header first
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Fallback to cookie (for backward compatibility)
    const raw = req.headers.cookie as string | undefined;
    if (!raw) return null;

    const parts = raw.split(/;\s*/);
    for (const p of parts) {
      const [k, v] = p.split('=', 2);
      if (k?.trim() === 'auth_token') {
        return decodeURIComponent(v || '').trim() || null;
      }
    }

    return null;
  }

  // Get token expiry time for access tokens
  getAccessTokenExpiry(): number {
    return 15 * 60; // 15 minutes in seconds
  }

  // Get token expiry time for refresh tokens
  getRefreshTokenExpiry(): number {
    return 7 * 24 * 60 * 60; // 7 days in seconds
  }
}

export const jwtManager = new EnhancedJWTManager();
export type { JWTPayload, RefreshTokenPayload };
