import { RequestHandler, Router } from "express";
import { readDB, writeDB } from "../storage";
import { verifyToken } from "../utils/jwt";

const router = Router();

export const getTracks: RequestHandler = (req, res) => {
  try {
    const db = readDB() as any;
    const { role } = req.query;
    
    let tracks = db.tracks || [];
    
    // Filter by role if specified
    if (role) {
      tracks = tracks.filter((track: any) => track.role === role);
    }
    
    res.json({ tracks });
  } catch (error) {
    console.error('Get tracks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getTrack: RequestHandler = (req, res) => {
  try {
    const { trackId } = req.params as any;
    const db = readDB();
    const track = (db.tracks || []).find((t) => t.id === trackId) || null;
    res.json({ track });
  } catch (error) {
    console.error('Get track error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getLesson: RequestHandler = (req, res) => {
  try {
    const { trackId, moduleId, lessonId } = req.params as any;
    const db = readDB() as any;
    const track = (db.tracks || []).find((t: any) => t.id === trackId);
    if (!track) return res.status(404).json({ error: "Track not found" });
    if (!track.modules || !Array.isArray(track.modules)) {
      return res.status(404).json({ error: "Track modules not found" });
    }
    const modIdx = track.modules.findIndex((m: any) => m.id === moduleId);
    if (modIdx === -1) return res.status(404).json({ error: "Module not found" });
    const module = track.modules[modIdx];
    if (!module.lessons || !Array.isArray(module.lessons)) {
      return res.status(404).json({ error: "Module lessons not found" });
    }
    const lesIdx = module.lessons.findIndex((l: any) => l.id === lessonId);
    if (lesIdx === -1) return res.status(404).json({ error: "Lesson not found" });
    const lesson = module.lessons[lesIdx];
    const prev = (() => {
      if (lesIdx > 0) return { trackId, moduleId, lessonId: module.lessons[lesIdx - 1].id };
      if (modIdx > 0 && track.modules[modIdx - 1].lessons?.length > 0) {
        return { trackId, moduleId: track.modules[modIdx - 1].id, lessonId: track.modules[modIdx - 1].lessons.slice(-1)[0].id };
      }
      return null;
    })();
    const next = (() => {
      if (lesIdx < module.lessons.length - 1) return { trackId, moduleId, lessonId: module.lessons[lesIdx + 1].id };
      if (modIdx < track.modules.length - 1 && track.modules[modIdx + 1].lessons?.length > 0) {
        return { trackId, moduleId: track.modules[modIdx + 1].id, lessonId: track.modules[modIdx + 1].lessons[0].id };
      }
      return null;
    })();
    
    // Add enhanced lesson data with full content
    const enhancedLesson = {
      ...lesson,
      moduleTitle: module.title || '',
      trackTitle: track.title || '',
      status: lesson.status || "not_started"
    };
    
    res.json({ trackId, moduleId, lesson: enhancedLesson, prev, next });
  } catch (error) {
    console.error('Get lesson error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

function getUserId(req: any): string | null {
  const auth = req.headers.authorization as string | undefined;
  if (!auth) return null;
  const token = auth.split(" ")[1];
  const payload = verifyToken(token || "");
  return payload?.sub || null;
}

export const getProgress: RequestHandler = (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const db = readDB() as any;
    const trackId = (req.query.trackId as string) || undefined;
    const all = (db.userLearning || []).filter((p: any) => p.userId === userId && (!trackId || p.trackId === trackId));
    res.json({ progress: all });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const setProgress: RequestHandler = (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const { trackId, moduleId, lessonId, status } = req.body as any;
    if (!trackId || !moduleId || !lessonId || !status) return res.status(400).json({ error: "Invalid body" });
    
    const db = readDB() as any;
    db.userLearning = db.userLearning || [];
    const now = new Date().toISOString();
    
    const idx = db.userLearning.findIndex((p: any) => p.userId === userId && p.trackId === trackId && p.moduleId === moduleId && p.lessonId === lessonId);
    
    if (idx === -1) {
      const newProgress = {
        id: `prog_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId, 
        trackId, 
        moduleId, 
        lessonId, 
        status, 
        startedAt: status !== "not_started" ? now : undefined, 
        completedAt: status === "completed" ? now : undefined, 
        updatedAt: now,
        score: status === "completed" ? Math.floor(Math.random() * 20) + 80 : undefined // Random score 80-100
      };
      db.userLearning.push(newProgress);
    } else {
      const prev = db.userLearning[idx];
      db.userLearning[idx] = { 
        ...prev, 
        status, 
        startedAt: prev.startedAt || (status !== "not_started" ? now : undefined), 
        completedAt: status === "completed" ? now : prev.completedAt, 
        updatedAt: now,
        score: status === "completed" && !prev.score ? Math.floor(Math.random() * 20) + 80 : prev.score
      };
    }
    
    writeDB(db);
    const all = db.userLearning.filter((p: any) => p.userId === userId);
    res.json({ progress: all, message: "Progress updated successfully" });
  } catch (error) {
    console.error('Set progress error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getCertificatesForUser: RequestHandler = (req, res) => {
  try {
    const { userId } = req.params as any;
    const db = readDB() as any;
    const certificates = (db.certificates || []).filter((c: any) => c.userId === userId);
    res.json({ certificates });
  } catch (error) {
    console.error('Get certificates error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getRoleRecommendations: RequestHandler = (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    
    const db = readDB() as any;
    const userProgress = (db.userLearning || []).filter((p: any) => p.userId === userId);
    const user = db.users.find((u: any) => u.id === userId);
    const userProfile = (db.userProfiles || []).find((p: any) => p.userId === userId);
    
    const userRole = userProfile?.personaRole || 'engineer';
    const userTracks = (db.tracks || []).filter((t: any) => t.role === userRole);
    
    // Generate recommendations based on current progress and role
    const recommendations = [];
    
    for (const track of userTracks) {
      if (!track.modules || !Array.isArray(track.modules)) continue;
      for (const module of track.modules) {
        if (!module.lessons || !Array.isArray(module.lessons)) continue;
        for (const lesson of module.lessons) {
          const hasProgress = userProgress.find((p: any) => 
            p.trackId === track.id && p.moduleId === module.id && p.lessonId === lesson.id
          );
          
          if (!hasProgress || hasProgress.status !== 'completed') {
            recommendations.push({
              trackId: track.id,
              trackTitle: track.title || '',
              moduleId: module.id,
              moduleTitle: module.title || '',
              lessonId: lesson.id,
              lessonTitle: lesson.title || '',
              type: lesson.type || 'reading',
              duration: `${lesson.durationMin || 0} min`,
              level: lesson.level || 'beginner',
              difficulty: lesson.level || 'beginner'
            });
            
            if (recommendations.length >= 6) break;
          }
        }
        if (recommendations.length >= 6) break;
      }
      if (recommendations.length >= 6) break;
    }
    
    res.json({ recommendations, role: userRole });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserStats: RequestHandler = (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    
    const db = readDB() as any;
    const userProgress = (db.userLearning || []).filter((p: any) => p.userId === userId);
    const tracks = db.tracks || [];
    
    let totalLessons = 0;
    let completedLessons = 0;
    let totalTime = 0;
    let completedTime = 0;
    let averageScore = 0;
    let totalScores = 0;
    let scoreCount = 0;
    
    // Calculate stats across all tracks
    for (const track of tracks) {
      if (!track.modules || !Array.isArray(track.modules)) continue;
      for (const module of track.modules) {
        if (!module.lessons || !Array.isArray(module.lessons)) continue;
        for (const lesson of module.lessons) {
          totalLessons++;
          totalTime += lesson.durationMin || 0;
          
          const progress = userProgress.find((p: any) => 
            p.trackId === track.id && p.moduleId === module.id && p.lessonId === lesson.id
          );
          
          if (progress && progress.status === 'completed') {
            completedLessons++;
            completedTime += lesson.durationMin || 0;
            
            if (progress.score) {
              totalScores += progress.score;
              scoreCount++;
            }
          }
        }
      }
    }
    
    averageScore = scoreCount > 0 ? Math.round(totalScores / scoreCount) : 0;
    const completionRate = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    
    const stats = {
      totalLessons,
      completedLessons,
      completionRate,
      totalTime,
      completedTime,
      averageScore,
      streakDays: Math.floor(Math.random() * 10) + 3 // Mock streak data
    };
    
    res.json({ stats });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

router.get("/tracks", getTracks);
router.get("/tracks/:trackId", getTrack);
router.get("/tracks/:trackId/modules/:moduleId/lessons/:lessonId", getLesson);
router.get("/progress", getProgress);
router.post("/progress", setProgress);
router.get("/users/:userId/certificates", getCertificatesForUser);
router.get("/recommendations", getRoleRecommendations);
router.get("/stats", getUserStats);

export default router;
