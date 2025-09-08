import { Router } from "express";
import { readDB } from "../storage";
import { verifyToken } from "../utils/jwt";

const router = Router();

function getTokenFromCookie(req: any): string | null {
  const raw = req.headers.cookie as string | undefined;
  if (!raw) return null;
  const parts = raw.split(/;\s*/);
  for (const p of parts) {
    const [k, v] = p.split("=");
    if (k === "auth_token") return decodeURIComponent(v || "");
  }
  return null;
}

router.get("/", (req, res) => {
  try {
    const auth = req.headers.authorization;
    const token = auth ? (auth as string).split(" ")[1] : getTokenFromCookie(req);
    if (!token) return res.status(401).json({ error: "Missing Authorization" });
    const payload = verifyToken(token || "");
    if (!payload) return res.status(401).json({ error: "Invalid token" });

    const db = readDB();
    const user = db.users.find((u) => u.id === (payload as any).sub);
    if (!user) return res.status(404).json({ error: "User not found" });

  // Get user profile to determine role
  const userProfile = (db.userProfiles || []).find((p: any) => p.userId === user.id);
  const userRole = userProfile?.personaRole || 'engineer';
  
  // Get user's learning progress
  const userProgress = (db.userLearning || []).filter((p: any) => p.userId === user.id);
  const userTracks = (db.tracks || []).filter((t: any) => t.role === userRole);
  
  // Calculate real learning statistics
  let totalLessons = 0;
  let completedLessons = 0;
  let totalModules = 0;
  let completedModules = 0;
  let currentTrack = null;
  let currentModule = null;
  let currentLesson = null;
  
  for (const track of userTracks) {
    for (const module of track.modules) {
      totalModules++;
      let moduleCompleted = true;
      let moduleStarted = false;
      
      for (const lesson of module.lessons) {
        totalLessons++;
        const progress = userProgress.find((p: any) => 
          p.trackId === track.id && p.moduleId === module.id && p.lessonId === lesson.id
        );
        
        if (progress) {
          if (progress.status === 'completed') {
            completedLessons++;
          } else if (progress.status === 'in_progress') {
            moduleStarted = true;
            moduleCompleted = false;
            if (!currentLesson) {
              currentTrack = track;
              currentModule = module;
              currentLesson = lesson;
            }
          } else {
            moduleCompleted = false;
          }
        } else {
          moduleCompleted = false;
        }
      }
      
      if (moduleCompleted && moduleStarted) {
        completedModules++;
      }
    }
  }
  
  // If no current lesson, find the first incomplete one
  if (!currentLesson && userTracks.length > 0) {
    outerLoop: for (const track of userTracks) {
      for (const module of track.modules) {
        for (const lesson of module.lessons) {
          const progress = userProgress.find((p: any) => 
            p.trackId === track.id && p.moduleId === module.id && p.lessonId === lesson.id
          );
          if (!progress || progress.status !== 'completed') {
            currentTrack = track;
            currentModule = module;
            currentLesson = lesson;
            break outerLoop;
          }
        }
      }
    }
  }
  
  const progressOverall = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const moduleProgress = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
  const sandboxAvg = 87; // Keep as demo metric for now

  const skills = [
    { name: "Prompt Engineering", progress: 87, level: "Advanced" as const },
    { name: "Context Design", progress: 65, level: "Intermediate" as const },
    { name: "Output Evaluation", progress: 72, level: "Intermediate" as const },
    { name: "Chain-of-Thought", progress: 43, level: "Beginner" as const },
  ];

  // Generate personalized recommendations based on user's role and progress
  const recommendations = [];
  for (const track of userTracks) {
    for (const module of track.modules) {
      for (const lesson of module.lessons) {
        const hasProgress = userProgress.find((p: any) => 
          p.trackId === track.id && p.moduleId === module.id && p.lessonId === lesson.id && p.status === 'completed'
        );
        
        if (!hasProgress && recommendations.length < 3) {
          recommendations.push({
            title: lesson.title,
            track: track.title,
            duration: `${lesson.durationMin} min`,
            difficulty: (lesson as any).level || 'Beginner',
            trackId: track.id,
            moduleId: module.id,
            lessonId: lesson.id
          });
        }
      }
    }
  }

  const activity = [
    { type: "completed" as const, title: "Completed Module: Advanced Prompting Patterns", time: "2 hours ago", points: 120 },
    { type: "shared" as const, title: "Shared prompt in Community Gallery", time: "5 hours ago", upvotes: 12 },
    { type: "certificate" as const, title: "Earned Engineering Track Certificate", time: "1 day ago", badge: "Engineering" },
    { type: "challenge" as const, title: "Won Weekly Challenge: Code Refactoring", time: "2 days ago", rank: "#1" },
  ];

  const events = [
    { title: "Live Workshop: Advanced RAG Patterns", date: "Tomorrow, 2:00 PM", instructor: "Dr. Sarah Chen", attendees: 47 },
    { title: "Community Challenge: Marketing Copy", date: "Friday, 10:00 AM", participants: 234 },
  ];

  const response = {
    streakDays: Math.floor(Math.random() * 10) + 3,
    progress: { overall: progressOverall, deltaWeek: 12 },
    modules: { completed: completedModules, total: totalModules, percent: moduleProgress },
    sandboxScore: { average: sandboxAvg },
    currentModule: currentModule && currentTrack
      ? {
          id: currentModule.id,
          track: currentTrack.title,
          title: currentModule.title,
          progress: Math.floor(Math.random() * 40) + 30, // Random progress 30-70%
          lessonIndex: currentTrack.modules.findIndex((m: any) => m.id === currentModule.id) + 1,
          lessonsTotal: currentModule.lessons?.length || 0,
          remainingMin: Math.floor(Math.random() * 40) + 10,
        }
      : null,
    skills: skills.map(skill => ({
      ...skill,
      progress: Math.min(100, skill.progress + (completedLessons * 2)) // Progress based on completed lessons
    })),
    recommendations,
    activity,
    events,
  };

    res.json(response);
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
