import { RequestHandler, Router } from "express";
import { supabaseAdmin, withRetry } from "../supabase";
import { verifyToken } from "../utils/jwt";

const router = Router();

// Helper function to get user ID from JWT token or cookies
function getUserId(req: any): string | null {
  // Try JWT token from Authorization header first
  const auth = req.headers.authorization as string | undefined;
  if (auth && auth.startsWith('Bearer ')) {
    try {
      const token = auth.split(" ")[1];
      if (token) {
        const payload = verifyToken(token);
        if (payload?.sub) {
          return payload.sub;
        }
      }
    } catch (error) {
      console.warn('Invalid JWT token in Authorization header:', error);
    }
  }
  
  // Fallback to cookie-based authentication
  const cookieToken = req.cookies?.auth_token;
  if (cookieToken) {
    try {
      const payload = verifyToken(cookieToken);
      if (payload?.sub) {
        return payload.sub;
      }
    } catch (error) {
      console.warn('Invalid JWT token in cookies:', error);
    }
  }
  
  // Additional fallback: check for user info in req.user (set by middleware)
  if (req.user && req.user.id) {
    return req.user.id;
  }
  
  return null;
}

// Get all tracks (optionally filtered by role)
export const getTracks: RequestHandler = async (req, res) => {
  try {
    const { role } = req.query;
    
    let query = supabaseAdmin
      .from('tracks')
      .select(`
        id,
        title,
        description,
        level,
        role,
        estimated_hours,
        certificate_available,
        created_at,
        track_modules (
          id,
          title,
          description,
          estimated_hours,
          order_index,
          track_lessons (
            id,
            title,
            duration_minutes,
            type,
            level,
            content,
            video_url,
            order_index
          )
        )
      `)
      .order('role')
      .order('order_index', { foreignTable: 'track_modules' })
      .order('order_index', { foreignTable: 'track_modules.track_lessons' });

    // Filter by role if specified
    if (role && typeof role === 'string') {
      query = query.eq('role', role);
    }

    const result = await withRetry(() => query) as any;
    const { data: tracks, error } = result;

    if (error) {
      console.error('Get tracks error:', error);
      return res.status(500).json({ error: 'Failed to fetch tracks' });
    }

    // Transform the data to match existing API structure
    const transformedTracks = tracks?.map(track => ({
      ...track,
      estimatedHours: track.estimated_hours,
      certificateAvailable: track.certificate_available,
      modules: track.track_modules?.map(module => ({
        ...module,
        estimatedHours: module.estimated_hours,
        orderIndex: module.order_index,
        lessons: module.track_lessons?.map(lesson => ({
          ...lesson,
          durationMin: lesson.duration_minutes,
          orderIndex: lesson.order_index,
          videoUrl: lesson.video_url
        })) || []
      })) || []
    })) || [];

    res.json({ tracks: transformedTracks });
  } catch (error) {
    console.error('Get tracks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get single track with modules and lessons
export const getTrack: RequestHandler = async (req, res) => {
  try {
    const { trackId } = req.params;
    
    const result = await withRetry(() =>
      supabaseAdmin
        .from('tracks')
        .select(`
          id,
          title,
          description,
          level,
          role,
          estimated_hours,
          certificate_available,
          created_at,
          track_modules (
            id,
            title,
            description,
            estimated_hours,
            order_index,
            track_lessons (
              id,
              title,
              duration_minutes,
              type,
              level,
              content,
              video_url,
              order_index
            )
          )
        `)
        .eq('id', trackId)
        .order('order_index', { foreignTable: 'track_modules' })
        .order('order_index', { foreignTable: 'track_modules.track_lessons' })
        .single()
    ) as any;
    const { data: track, error } = result;

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Track not found' });
      }
      console.error('Get track error:', error);
      return res.status(500).json({ error: 'Failed to fetch track' });
    }

    // Transform the data structure
    const transformedTrack = track ? {
      ...track,
      estimatedHours: track.estimated_hours,
      certificateAvailable: track.certificate_available,
      modules: track.track_modules?.map(module => ({
        ...module,
        estimatedHours: module.estimated_hours,
        orderIndex: module.order_index,
        lessons: module.track_lessons?.map(lesson => ({
          ...lesson,
          durationMin: lesson.duration_minutes,
          orderIndex: lesson.order_index,
          videoUrl: lesson.video_url
        })) || []
      })) || []
    } : null;

    res.json({ track: transformedTrack });
  } catch (error) {
    console.error('Get track error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get specific lesson with navigation context
export const getLesson: RequestHandler = async (req, res) => {
  try {
    const { trackId, moduleId, lessonId } = req.params;
    const userId = getUserId(req);

    
    // First get the lesson with its module and track context
    const lessonResult = await withRetry(() =>
      supabaseAdmin
        .from('track_lessons')
        .select(`
          *,
          track_modules (
            id,
            title,
            track_id,
            tracks (
              id,
              title
            )
          )
        `)
        .eq('id', lessonId)
        .eq('module_id', moduleId)
        .single()
    ) as any;
    const { data: lesson, error: lessonError } = lessonResult;

    if (lessonError) {
      if (lessonError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Lesson not found' });
      }
      console.error('Get lesson error:', lessonError);
      return res.status(500).json({ error: 'Failed to fetch lesson' });
    }

    // Verify the lesson belongs to the correct track
    if (lesson?.track_modules?.tracks?.id !== trackId) {
      return res.status(404).json({ error: 'Lesson not found in specified track' });
    }
    let lessonProgress: any = null;

    if (userId) {
      const { data } = await supabaseAdmin
        .from("user_lesson_progress")
        .select("status, completed_at")
        .eq("user_id", userId)
        .eq("lesson_id", lessonId)
        .single();

      lessonProgress = data;
    }


    // Get all lessons in this module for navigation
    const moduleLessonsResult = await withRetry(() =>
      supabaseAdmin
        .from('track_lessons')
        .select('id, order_index')
        .eq('module_id', moduleId)
        .order('order_index')
    ) as any;
    const { data: moduleLessons, error: moduleError } = moduleLessonsResult;

    if (moduleError) {
      console.error('Get module lessons error:', moduleError);
    }

    // Get all modules in this track for cross-module navigation
    const trackModulesResult = await withRetry(() =>
      supabaseAdmin
        .from('track_modules')
        .select(`
          id,
          order_index,
          track_lessons (
            id,
            order_index
          )
        `)
        .eq('track_id', trackId)
        .order('order_index')
        .order('order_index', { foreignTable: 'track_lessons' })
    ) as any;
    const { data: trackModules, error: trackError } = trackModulesResult;

    if (trackError) {
      console.error('Get track modules error:', trackError);
    }

    // Calculate previous and next lesson
    const currentLessonIndex = moduleLessons?.findIndex(l => l.id === lessonId) ?? -1;
    let prev: any = null;
    let next: any = null;

    if (moduleLessons && trackModules && currentLessonIndex !== -1) {
      // Previous lesson
      if (currentLessonIndex > 0) {
        prev = {
          trackId,
          moduleId,
          lessonId: moduleLessons[currentLessonIndex - 1].id
        };
      } else {
        // Look for last lesson in previous module
        const currentModuleIndex = trackModules.findIndex(m => m.id === moduleId);
        if (currentModuleIndex > 0) {
          const prevModule = trackModules[currentModuleIndex - 1];
          if (prevModule.track_lessons && prevModule.track_lessons.length > 0) {
            const lastLesson = prevModule.track_lessons[prevModule.track_lessons.length - 1];
            prev = {
              trackId,
              moduleId: prevModule.id,
              lessonId: lastLesson.id
            };
          }
        }
      }

      // Next lesson
      if (currentLessonIndex < moduleLessons.length - 1) {
        next = {
          trackId,
          moduleId,
          lessonId: moduleLessons[currentLessonIndex + 1].id
        };
      } else {
        // Look for first lesson in next module
        const currentModuleIndex = trackModules.findIndex(m => m.id === moduleId);
        if (currentModuleIndex < trackModules.length - 1) {
          const nextModule = trackModules[currentModuleIndex + 1];
          if (nextModule.track_lessons && nextModule.track_lessons.length > 0) {
            const firstLesson = nextModule.track_lessons[0];
            next = {
              trackId,
              moduleId: nextModule.id,
              lessonId: firstLesson.id
            };
          }
        }
      }
    }

    // Enhanced lesson response
    const enhancedLesson = {
      ...lesson,
      moduleTitle: lesson.track_modules?.title || '',
      trackTitle: lesson.track_modules?.tracks?.title || '',
      progressStatus: lessonProgress?.status || "not_started"
    };    

    res.json({
      trackId,
      moduleId,
      lesson: enhancedLesson,
      prev,
      next
    });

  } catch (error) {
    console.error('Get lesson error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get user progress for specific track or all tracks
export const getProgress: RequestHandler = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { trackId } = req.query;
    
    let query = supabaseAdmin
      .from('user_lesson_progress')
      .select('*')
      .eq('user_id', userId);

    if (trackId && typeof trackId === 'string') {
      query = query.eq('track_id', trackId);
    }

    const { data: progress, error } = await withRetry(async () => await query);

    if (error) {
      console.error('Get progress error:', error);
      return res.status(500).json({ error: 'Failed to fetch progress' });
    }

    res.json({ progress: progress || [] });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Set/update user progress for a lesson
export const setProgress: RequestHandler = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { trackId, moduleId, lessonId, status } = req.body;
    
    if (!trackId || !moduleId || !lessonId || !status) {
      return res.status(400).json({ error: 'Missing required fields: trackId, moduleId, lessonId, status' });
    }

    // Validate status
    const validStatuses = ['not_started', 'in_progress', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be: not_started, in_progress, or completed' });
    }

    const now = new Date().toISOString();

    // Check if progress record exists
    const { data: existingProgress, error: checkError } = await withRetry(async () =>
      await supabaseAdmin
        .from('user_lesson_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('lesson_id', lessonId)
        .single()
    );

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Check progress error:', checkError);
      return res.status(500).json({ error: 'Failed to check existing progress' });
    }

    let progressData: any = {
      user_id: userId,
      track_id: trackId,
      module_id: moduleId,
      lesson_id: lessonId,
      status: status,
      updated_at: now
    };

    // Set timestamps based on status
    if (status !== 'not_started') {
      progressData.started_at = existingProgress?.started_at || now;
    }
    
    if (status === 'completed') {
      progressData.completed_at = now;
    } else if (existingProgress?.completed_at) {
      // If moving back from completed, keep the original completion time
      progressData.completed_at = existingProgress.completed_at;
    }

    let result;
    if (existingProgress) {
      // Update existing record
      const { data, error } = await withRetry(async () =>
        await supabaseAdmin
          .from('user_lesson_progress')
          .update(progressData)
          .eq('user_id', userId)
          .eq('lesson_id', lessonId)
          .select()
      );
      
      if (error) {
        console.error('Update progress error:', error);
        return res.status(500).json({ error: 'Failed to update progress' });
      }
      
      result = data;
    } else {
      // Insert new record
      const { data, error } = await withRetry(async () =>
        await supabaseAdmin
          .from('user_lesson_progress')
          .insert(progressData)
          .select()
      );
      
      if (error) {
        console.error('Insert progress error:', error);
        return res.status(500).json({ error: 'Failed to create progress record' });
      }
      
      result = data;
    }

    // Get all user progress to return
    const { data: allProgress, error: allError } = await withRetry(async () =>
      await supabaseAdmin
        .from('user_lesson_progress')
        .select('*')
        .eq('user_id', userId)
    );

    if (allError) {
      console.error('Get all progress error:', allError);
    }

    res.json({
      progress: allProgress || [],
      message: 'Progress updated successfully',
      updated: result?.[0] || null
    });

  } catch (error) {
    console.error('Set progress error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get certificates for a user
export const getCertificatesForUser: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const { data: certificates, error } = await withRetry(async () =>
      await supabaseAdmin
        .from('certificates')
        .select(`
          *,
          tracks (
            title,
            role
          )
        `)
        .eq('user_id', userId)
        .order('issued_at', { ascending: false })
    );

    if (error) {
      console.error('Get certificates error:', error);
      return res.status(500).json({ error: 'Failed to fetch certificates' });
    }

    res.json({ certificates: certificates || [] });
  } catch (error) {
    console.error('Get certificates error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get personalized recommendations based on user role and progress
export const getRoleRecommendations: RequestHandler = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user profile to determine role
    const { data: user, error: userError } = await withRetry(async () =>
      await supabaseAdmin
        .from('users')
        .select('persona_role')
        .eq('id', userId)
        .single()
    );

    if (userError) {
      console.error('Get user error:', userError);
      return res.status(500).json({ error: 'Failed to fetch user profile' });
    }

    const userRole = user?.persona_role || 'marketer';

    // Get user's progress
    const { data: userProgress, error: progressError } = await withRetry(async () =>
      await supabaseAdmin
        .from('user_lesson_progress')
        .select('*')
        .eq('user_id', userId)
    );

    if (progressError) {
      console.error('Get user progress error:', progressError);
    }

    // Get tracks for the user's role
    const { data: roleTracks, error: tracksError } = await withRetry(async () =>
      await supabaseAdmin
        .from('tracks')
        .select(`
          id,
          title,
          track_modules (
            id,
            title,
            order_index,
            track_lessons (
              id,
              title,
              type,
              duration_minutes,
              level,
              order_index
            )
          )
        `)
        .eq('role', userRole)
        .order('order_index', { foreignTable: 'track_modules' })
        .order('order_index', { foreignTable: 'track_modules.track_lessons' })
    );

    if (tracksError) {
      console.error('Get role tracks error:', tracksError);
      return res.status(500).json({ error: 'Failed to fetch role tracks' });
    }

    // Generate recommendations based on progress
    const recommendations: any[] = [];
    const progressMap = new Map<string, any>(
      ((userProgress as any[]) || []).map((p: any) => [`${p.track_id}-${p.module_id}-${p.lesson_id}`, p])
    );

    for (const track of roleTracks || []) {
      for (const module of track.track_modules || []) {
        for (const lesson of module.track_lessons || []) {
          const progressKey = `${track.id}-${module.id}-${lesson.id}`;
          const progress = progressMap.get(progressKey);
          
          // Recommend lessons that are not completed or not started
          if (!progress || progress.status !== 'completed') {
            recommendations.push({
              trackId: track.id,
              trackTitle: track.title,
              moduleId: module.id,
              moduleTitle: module.title,
              lessonId: lesson.id,
              lessonTitle: lesson.title,
              type: lesson.type,
              duration: `${lesson.duration_minutes} min`,
              level: lesson.level || 'beginner',
              difficulty: lesson.level || 'beginner'
            });

            // Limit to 6 recommendations
            if (recommendations.length >= 6) {
              break;
            }
          }
        }
        if (recommendations.length >= 6) break;
      }
      if (recommendations.length >= 6) break;
    }

    res.json({
      recommendations,
      role: userRole
    });

  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get user learning statistics
export const getUserStats: RequestHandler = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user progress
    const { data: userProgress, error: progressError } = await withRetry(async () =>
      await supabaseAdmin
        .from('user_lesson_progress')
        .select('*')
        .eq('user_id', userId)
    );

    if (progressError) {
      console.error('Get user progress error:', progressError);
      return res.status(500).json({ error: 'Failed to fetch user progress' });
    }

    // Get all lessons to calculate totals
    const { data: allLessons, error: lessonsError } = await withRetry(async () =>
      await supabaseAdmin
        .from('track_lessons')
        .select('id, duration_minutes')
    );

    if (lessonsError) {
      console.error('Get all lessons error:', lessonsError);
      return res.status(500).json({ error: 'Failed to fetch lessons' });
    }

    const totalLessons = allLessons?.length || 0;
    const completedLessons = (userProgress || []).filter(p => p.status === 'completed').length;
    const completionRate = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    // Calculate time statistics
    const totalTime = (allLessons || []).reduce((sum, lesson) => sum + (lesson.duration_minutes || 0), 0);
    const completedLessonIds = (userProgress || [])
      .filter(p => p.status === 'completed')
      .map(p => p.lesson_id);
    
    const completedTime = (allLessons || [])
      .filter(lesson => completedLessonIds.includes(lesson.id))
      .reduce((sum, lesson) => sum + (lesson.duration_minutes || 0), 0);

    // Mock streak data (could be calculated from actual progress dates)
    const streakDays = Math.floor(Math.random() * 10) + 3;

    const stats = {
      totalLessons,
      completedLessons,
      completionRate,
      totalTime,
      completedTime,
      streakDays,
      averageScore: 0 // Could be calculated from lesson scores when implemented
    };

    res.json({ stats });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Route definitions
router.get("/tracks", getTracks);
router.get("/tracks/:trackId", getTrack);
router.get("/tracks/:trackId/modules/:moduleId/lessons/:lessonId", getLesson);
router.get("/progress", getProgress);
router.post("/progress", setProgress);
router.get("/users/:userId/certificates", getCertificatesForUser);
router.get("/recommendations", getRoleRecommendations);
router.get("/stats", getUserStats);

export default router;