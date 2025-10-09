import { supabaseAdmin } from '../supabase';
import { jwtManager } from './jwt-enhanced';
import { createId } from '../storage-supabase';

interface Session {
  id: string;
  user_id: string;
  device_id: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  last_activity: string;
  expires_at: string;
  is_active: boolean;
}

interface DeviceInfo {
  deviceId?: string;
  userAgent?: string;
  name?: string;
}

class SessionManager {
  // Create new session
  async createSession(userId: string, deviceInfo: DeviceInfo, ipAddress: string): Promise<Session> {
    const sessionId = createId(); // Use pure UUID without prefix
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    const deviceId = deviceInfo.deviceId || jwtManager.generateDeviceId(
      deviceInfo.userAgent || 'unknown',
      ipAddress
    );

    const { data, error } = await supabaseAdmin
      .from('user_sessions')
      .insert({
        id: sessionId,
        user_id: userId,
        device_id: deviceId,
        ip_address: ipAddress,
        user_agent: deviceInfo.userAgent,
        expires_at: expiresAt.toISOString(),
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create session:', error);
      throw new Error(`Failed to create session: ${error.message}`);
    }
    
    return data;
  }

  // Validate session
  async validateSession(sessionId: string): Promise<Session | null> {
    const { data, error } = await supabaseAdmin
      .from('user_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) {
      if (error && error.code !== 'PGRST116') {
        console.error('Session validation error:', error);
      }
      return null;
    }

    // Update last activity
    await this.updateLastActivity(sessionId);
    
    return data;
  }

  // Update last activity timestamp
  async updateLastActivity(sessionId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('user_sessions')
      .update({ last_activity: new Date().toISOString() })
      .eq('id', sessionId);

    if (error) {
      console.error('Failed to update last activity:', error);
      // Don't throw error for this non-critical operation
    }
  }

  // Revoke a specific session
  async revokeSession(sessionId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('user_sessions')
      .update({ is_active: false })
      .eq('id', sessionId);

    if (error) {
      console.error('Failed to revoke session:', error);
      throw new Error(`Failed to revoke session: ${error.message}`);
    }
  }

  // Revoke all user sessions (logout everywhere)
  async revokeAllUserSessions(userId: string, exceptSessionId?: string): Promise<void> {
    let query = supabaseAdmin
      .from('user_sessions')
      .update({ is_active: false })
      .eq('user_id', userId);

    if (exceptSessionId) {
      query = query.neq('id', exceptSessionId);
    }

    const { error } = await query;

    if (error) {
      console.error('Failed to revoke all user sessions:', error);
      throw new Error(`Failed to revoke all user sessions: ${error.message}`);
    }
  }

  // Get user's active sessions
  async getUserSessions(userId: string): Promise<Session[]> {
    const { data, error } = await supabaseAdmin
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .order('last_activity', { ascending: false });

    if (error) {
      console.error('Failed to get user sessions:', error);
      throw new Error(`Failed to get user sessions: ${error.message}`);
    }
    
    return data || [];
  }

  // Get session by ID with user info
  async getSessionWithUser(sessionId: string) {
    const { data, error } = await supabaseAdmin
      .from('user_sessions')
      .select(`
        *,
        users:user_id (
          id,
          email,
          name,
          role
        )
      `)
      .eq('id', sessionId)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) {
      return null;
    }

    return {
      session: data,
      user: data.users
    };
  }

  // Clean up expired sessions (should be called periodically)
  async cleanupExpiredSessions(): Promise<number> {
    const { count, error } = await supabaseAdmin
      .from('user_sessions')
      .update({ is_active: false })
      .lt('expires_at', new Date().toISOString())
      .eq('is_active', true)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Failed to cleanup expired sessions:', error);
      return 0;
    }

    const cleanedCount = count || 0;
    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} expired sessions`);
    }

    return cleanedCount;
  }

  // Get session statistics for a user
  async getUserSessionStats(userId: string): Promise<{
    activeCount: number;
    totalCount: number;
    lastActivity?: string;
  }> {
    // Get active sessions count
    const { count: activeCount } = await supabaseAdmin
      .from('user_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString());

    // Get total sessions count
    const { count: totalCount } = await supabaseAdmin
      .from('user_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get last activity
    const { data: lastSession } = await supabaseAdmin
      .from('user_sessions')
      .select('last_activity')
      .eq('user_id', userId)
      .order('last_activity', { ascending: false })
      .limit(1)
      .single();

    return {
      activeCount: activeCount || 0,
      totalCount: totalCount || 0,
      lastActivity: lastSession?.last_activity,
    };
  }

  // Extend session expiry (for remember me functionality)
  async extendSession(sessionId: string, additionalHours: number = 24): Promise<void> {
    const newExpiryTime = new Date(Date.now() + additionalHours * 60 * 60 * 1000);
    
    const { error } = await supabaseAdmin
      .from('user_sessions')
      .update({ expires_at: newExpiryTime.toISOString() })
      .eq('id', sessionId)
      .eq('is_active', true);

    if (error) {
      console.error('Failed to extend session:', error);
      throw new Error(`Failed to extend session: ${error.message}`);
    }
  }

  // Check if user has too many active sessions
  async hasExcessiveSessions(userId: string, maxSessions: number = 10): Promise<boolean> {
    const stats = await this.getUserSessionStats(userId);
    return stats.activeCount > maxSessions;
  }

  // Revoke oldest sessions if user has too many
  async enforceSessionLimit(userId: string, maxSessions: number = 10): Promise<void> {
    const sessions = await this.getUserSessions(userId);
    
    if (sessions.length > maxSessions) {
      // Keep the most recent sessions, revoke the oldest ones
      const sessionsToRevoke = sessions.slice(maxSessions);
      
      for (const session of sessionsToRevoke) {
        await this.revokeSession(session.id);
      }
      
      console.log(`Revoked ${sessionsToRevoke.length} old sessions for user ${userId}`);
    }
  }
}

export const sessionManager = new SessionManager();
export type { Session, DeviceInfo };
