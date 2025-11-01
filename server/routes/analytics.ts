import { RequestHandler, Router } from 'express';
import { supabaseAdmin } from '../supabase';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth-enhanced';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken as any);

interface AnalyticsTimeframe {
  start: Date;
  end: Date;
  period: 'day' | 'week' | 'month' | 'quarter' | 'year';
}

function getTimeframe(period: string = '30d'): AnalyticsTimeframe {
  const end = new Date();
  const start = new Date();
  
  switch (period) {
    case '7d':
      start.setDate(end.getDate() - 7);
      return { start, end, period: 'day' };
    case '30d':
      start.setDate(end.getDate() - 30);
      return { start, end, period: 'day' };
    case '90d':
      start.setDate(end.getDate() - 90);
      return { start, end, period: 'week' };
    case '1y':
      start.setFullYear(end.getFullYear() - 1);
      return { start, end, period: 'month' };
    default:
      start.setDate(end.getDate() - 30);
      return { start, end, period: 'day' };
  }
}

// User Analytics
export const getUserAnalytics: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { period = '30d' } = req.query as { period?: string };
    const timeframe = getTimeframe(period);

    // Get user progress data
    const { data: progressData, error: progressError } = await supabaseAdmin
      .from('user_progress')
      .select(`
        *,
        track_lessons (
          id,
          title,
          duration_minutes,
          type,
          order_index,
          track_modules (
            id,
            title,
            track_id,
            tracks (
              id,
              title,
              role
            )
          )
        )
      `)
      .eq('user_id', userId)
      .gte('updated_at', timeframe.start.toISOString())
      .lte('updated_at', timeframe.end.toISOString())
      .order('updated_at', { ascending: true });

    if (progressError) throw progressError;

    // Get session data
    const { data: sessionData, error: sessionError } = await supabaseAdmin
      .from('user_sessions')
      .select('created_at, last_activity, ip_address, user_agent')
      .eq('user_id', userId)
      .gte('created_at', timeframe.start.toISOString())
      .lte('created_at', timeframe.end.toISOString())
      .order('created_at', { ascending: true });

    if (sessionError) throw sessionError;

    // Get learning streaks
    const { data: streakData, error: streakError } = await supabaseAdmin
      .from('user_progress')
      .select('updated_at, completed_at')
      .eq('user_id', userId)
      .not('completed_at', 'is', null)
      .gte('updated_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('updated_at', { ascending: true });

    if (streakError) throw streakError;

    // Calculate analytics
    const totalLessonsStarted = progressData?.length || 0;
    const totalLessonsCompleted = progressData?.filter(p => p.completed_at).length || 0;
    const totalTimeSpent = progressData?.reduce((sum, p) => sum + (p.time_spent || 0), 0) || 0;
    
    // Calculate completion rate
    const completionRate = totalLessonsStarted > 0 
      ? Math.round((totalLessonsCompleted / totalLessonsStarted) * 100) 
      : 0;

    // Calculate current streak
    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 0;
    
    if (streakData && streakData.length > 0) {
      const today = new Date().toDateString();
      const completionDates = streakData.map(s => new Date(s.completed_at!).toDateString());
      const uniqueDates: string[] = [...new Set<string>(completionDates)].sort();
      
      // Calculate current streak
      for (let i = uniqueDates.length - 1; i >= 0; i--) {
        const date = new Date(uniqueDates[i]);
        const daysDiff = Math.floor((new Date().getTime() - date.getTime()) / (1000 * 3600 * 24));
        
        if (daysDiff <= currentStreak + 1) {
          currentStreak++;
        } else {
          break;
        }
      }
      
      // Calculate max streak
      tempStreak = 1;
      for (let i = 1; i < uniqueDates.length; i++) {
        const prevDate = new Date(uniqueDates[i - 1]);
        const currDate = new Date(uniqueDates[i]);
        const daysDiff = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 3600 * 24));
        
        if (daysDiff === 1) {
          tempStreak++;
          maxStreak = Math.max(maxStreak, tempStreak);
        } else {
          tempStreak = 1;
        }
      }
      maxStreak = Math.max(maxStreak, tempStreak);
    }

    // Get tracks and modules progress
    const trackProgress = progressData?.reduce((acc, progress) => {
      const lesson = progress.track_lessons;
      if (lesson?.track_modules?.tracks) {
        const track = lesson.track_modules.tracks;
        if (!acc[track.id]) {
          acc[track.id] = {
            id: track.id,
            title: track.title,
            role: track.role,
            totalLessons: 0,
            completedLessons: 0,
            timeSpent: 0,
            progress: 0
          };
        }
        acc[track.id].totalLessons++;
        if (progress.completed_at) acc[track.id].completedLessons++;
        acc[track.id].timeSpent += progress.time_spent || 0;
        acc[track.id].progress = acc[track.id].totalLessons > 0 
          ? Math.round((acc[track.id].completedLessons / acc[track.id].totalLessons) * 100)
          : 0;
      }
      return acc;
    }, {} as Record<string, any>) || {};

    // Generate time series data for charts
    const dailyActivity = generateTimeSeriesData(progressData || [], timeframe, 'completed_at');
    const sessionActivity = generateTimeSeriesData(sessionData || [], timeframe, 'created_at');

    res.json({
      overview: {
        totalLessonsStarted,
        totalLessonsCompleted,
        completionRate,
        totalTimeSpent: Math.round(totalTimeSpent / 60), // Convert to hours
        currentStreak,
        maxStreak,
        activeDays: uniqueDaysActive(progressData || [])
      },
      tracks: Object.values(trackProgress),
      charts: {
        dailyActivity,
        sessionActivity,
        weeklyProgress: generateWeeklyProgress(progressData || [])
      },
      timeframe: {
        period,
        start: timeframe.start.toISOString(),
        end: timeframe.end.toISOString()
      }
    });

  } catch (error) {
    console.error('User analytics error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Admin Analytics (requires admin role)
export const getAdminAnalytics: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    // Check admin access
    if ((req.user as any)?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { period = '30d' } = req.query as { period?: string };
    const timeframe = getTimeframe(period);

    // Get overall user statistics
    const { data: usersData, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, created_at, role, is_verified')
      .gte('created_at', timeframe.start.toISOString())
      .lte('created_at', timeframe.end.toISOString());

    if (usersError) throw usersError;

    // Get total users count
    const { count: totalUsers, error: totalUsersError } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (totalUsersError) throw totalUsersError;

    // Get active users (users with activity in the last 7 days)
    const { count: activeUsers, error: activeUsersError } = await supabaseAdmin
      .from('user_sessions')
      .select('*', { count: 'exact', head: true })
      .gte('last_activity', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .eq('is_active', true);

    if (activeUsersError) throw activeUsersError;

    // Get progress statistics
    const { data: progressStats, error: progressError } = await supabaseAdmin
      .from('user_progress')
      .select('user_id, completed_at, time_spent')
      .gte('updated_at', timeframe.start.toISOString())
      .lte('updated_at', timeframe.end.toISOString());

    if (progressError) throw progressError;

    // Get track enrollment data
    const { data: trackData, error: trackError } = await supabaseAdmin
      .from('user_progress')
      .select(`
        track_lessons (
          track_modules (
            tracks (
              id,
              title,
              role
            )
          )
        )
      `)
      .gte('created_at', timeframe.start.toISOString())
      .lte('created_at', timeframe.end.toISOString());

    if (trackError) throw trackError;

    // Calculate metrics
    const newUsers = usersData?.length || 0;
    const totalLessonsCompleted = progressStats?.filter(p => p.completed_at).length || 0;
    const averageTimeSpent = progressStats && progressStats.length > 0 
      ? Math.round((progressStats.reduce((sum, p) => sum + (p.time_spent || 0), 0) / progressStats.length) / 60)
      : 0;

    // Calculate completion rate across all users
    const { data: allProgress, error: allProgressError } = await supabaseAdmin
      .from('user_progress')
      .select('completed_at');

    if (allProgressError) throw allProgressError;

    const totalLessonsStarted = allProgress?.length || 0;
    const totalCompleted = allProgress?.filter(p => p.completed_at).length || 0;
    const overallCompletionRate = totalLessonsStarted > 0 
      ? Math.round((totalCompleted / totalLessonsStarted) * 100) 
      : 0;

    // Track popularity
    const trackPopularity = trackData?.reduce((acc, item) => {
      const track = item.track_lessons?.track_modules?.tracks;
      if (track) {
        if (!acc[track.id]) {
          acc[track.id] = {
            id: track.id,
            title: track.title,
            role: track.role,
            enrollments: 0
          };
        }
        acc[track.id].enrollments++;
      }
      return acc;
    }, {} as Record<string, any>) || {};

    // Generate time series data
    const userGrowth = generateTimeSeriesData(usersData || [], timeframe, 'created_at');
    const completionTrends = generateTimeSeriesData(progressStats || [], timeframe, 'completed_at');

    res.json({
      overview: {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        newUsers,
        totalLessonsCompleted,
        overallCompletionRate,
        averageTimeSpent
      },
      tracks: Object.values(trackPopularity),
      charts: {
        userGrowth,
        completionTrends,
        roleDistribution: calculateRoleDistribution(usersData || [])
      },
      timeframe: {
        period,
        start: timeframe.start.toISOString(),
        end: timeframe.end.toISOString()
      }
    });

  } catch (error) {
    console.error('Admin analytics error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch admin analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Team Analytics
export const getTeamAnalytics: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    const { teamId } = req.params;
    const { period = '30d' } = req.query as { period?: string };
    
    // TODO: Implement team analytics when team management is available
    // For now, return placeholder data
    
    res.json({
      message: 'Team analytics not yet implemented',
      teamId,
      period
    });
    
  } catch (error) {
    console.error('Team analytics error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch team analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Helper function to generate time series data
function generateTimeSeriesData(
  data: any[], 
  timeframe: AnalyticsTimeframe, 
  dateField: string
): { date: string; value: number; }[] {
  const result: { date: string; value: number; }[] = [];
  const current = new Date(timeframe.start);
  
  while (current <= timeframe.end) {
    const dateStr = current.toISOString().split('T')[0];
    const count = data.filter(item => {
      if (!item[dateField]) return false;
      const itemDate = new Date(item[dateField]).toISOString().split('T')[0];
      return itemDate === dateStr;
    }).length;
    
    result.push({ date: dateStr, value: count });
    
    // Increment based on period
    if (timeframe.period === 'day') {
      current.setDate(current.getDate() + 1);
    } else if (timeframe.period === 'week') {
      current.setDate(current.getDate() + 7);
    } else if (timeframe.period === 'month') {
      current.setMonth(current.getMonth() + 1);
    }
  }
  
  return result;
}

function generateWeeklyProgress(progressData: any[]): { week: string; completed: number; }[] {
  const weeks: { [key: string]: number } = {};
  
  progressData.forEach(progress => {
    if (progress.completed_at) {
      const date = new Date(progress.completed_at);
      const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
      const weekKey = weekStart.toISOString().split('T')[0];
      weeks[weekKey] = (weeks[weekKey] || 0) + 1;
    }
  });
  
  return Object.entries(weeks).map(([week, completed]) => ({ week, completed }));
}

function uniqueDaysActive(progressData: any[]): number {
  const activeDays = new Set();
  progressData.forEach(progress => {
    if (progress.updated_at) {
      const date = new Date(progress.updated_at).toDateString();
      activeDays.add(date);
    }
  });
  return activeDays.size;
}

function calculateRoleDistribution(usersData: any[]): { role: string; count: number; }[] {
  const roleCount: { [key: string]: number } = {};
  
  usersData.forEach(user => {
    const role = user.role || 'student';
    roleCount[role] = (roleCount[role] || 0) + 1;
  });
  
  return Object.entries(roleCount).map(([role, count]) => ({ role, count }));
}

// Routes
router.get('/user', getUserAnalytics);
router.get('/admin', getAdminAnalytics);
router.get('/team/:teamId', getTeamAnalytics);

export default router;