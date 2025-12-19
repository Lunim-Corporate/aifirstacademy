import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import LoggedInHeader from "@/components/LoggedInHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { copyText } from "@/lib/utils";
import { Check, Play, BookOpen, Video, FileText, Code, ChevronLeft, ChevronRight, Search, PlusCircle, Trash2, Award, Target, HelpCircle, Lock, Terminal } from "lucide-react";
import type { Track, TrackModule, TrackModuleLesson, LessonContent, LessonType } from "@shared/api";
import { apiGetTrack, apiGetLesson, apiSetLessonProgress, apiGetProgress, apiMe, apiMeCookie } from "@/lib/api";
import Playground from "@/components/Playground";

function isPreviewHost() {
  return false; // Preview mode disabled
}

// Minimal markdown to HTML converter for lesson content (headings, lists, code, inline code, bold)
function mdToHtml(src: string): string {
  try {
    const html = src
      .split('\n')
      .map(line => {
        if (line.startsWith('### ')) return `<h3 class="text-xl font-semibold mt-6 mb-3">${line.slice(4)}</h3>`;
        if (line.startsWith('## ')) return `<h2 class="text-2xl font-semibold mt-8 mb-4">${line.slice(3)}</h2>`;
        if (line.startsWith('# ')) return `<h1 class="text-3xl font-bold mt-10 mb-6">${line.slice(2)}</h1>`;
        if (line.trim().startsWith('- ')) return `<li class="mb-2">${line.trim().slice(2)}</li>`;
        return line;
      })
      .join('\n')
      // Code fences
      .replace(/```([\w]*)?\n([\s\S]*?)```/g, '<pre class="bg-muted rounded-lg p-4 overflow-x-auto my-4"><code class="text-sm">$2</code></pre>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>')
      // Bold
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      // Paragraphs for plain lines that are not HTML blocks
      .split('\n')
      .map(l => (l.trim() && !l.startsWith('<') ? `<p class="mb-4">${l}</p>` : l))
      .join('\n');
    return html;
  } catch {
    return src.replace(/\n/g, '<br>');
  }
}

function mockCourse(trackId: string, moduleId: string, lessonId: string): { track: Track; lesson: LessonContent } {
  const modules: TrackModule[] = Array.from({ length: 3 }).map((_, mi) => ({
    id: `m${mi + 1}`,
    title: `Module ${mi + 1}`,
    description: `Skills for week ${mi + 1}`,
    lessons: Array.from({ length: 5 }).map((__, li) => ({
      id: `l${li + 1}`,
      title: `Lesson ${li + 1}`,
      durationMin: 8 + li * 2,
      type: li % 3 === 0 ? ("video" as LessonType) : li % 3 === 1 ? ("text" as LessonType) : ("playground" as LessonType),
      status: li === 0 ? "in-progress" : "locked",
    })),
  }));
  const track: Track = { id: trackId || "t_js", title: "AI Engineering Fundamentals", level: "beginner", modules };
  const mod = modules.find((m) => m.id === moduleId) || modules[0];
  const les = mod.lessons.find((l) => l.id === lessonId) || mod.lessons[0];
  const modIdx = modules.findIndex((m) => m.id === mod.id);
  const lesIdx = mod.lessons.findIndex((l) => l.id === les.id);
  const prev = lesIdx > 0 ? { trackId: track.id, moduleId: mod.id, lessonId: mod.lessons[lesIdx - 1].id } : modIdx > 0 ? { trackId: track.id, moduleId: modules[modIdx - 1].id, lessonId: modules[modIdx - 1].lessons.slice(-1)[0].id } : null;
  const next = lesIdx < mod.lessons.length - 1 ? { trackId: track.id, moduleId: mod.id, lessonId: mod.lessons[lesIdx + 1].id } : modIdx < modules.length - 1 ? { trackId: track.id, moduleId: modules[modIdx + 1].id, lessonId: modules[modIdx + 1].lessons[0].id } : null;
  const lesson: LessonContent = {
    trackId: track.id,
    moduleId: mod.id,
    lesson: {
      ...les,
      type: les.type || "video",
      content: les.type === "text" || les.type === "playground" ?
        (les.type === "text" ?
          "Welcome to the lesson. This is a sample reading with selectable text so you can add notes. Use the notes panel on the right to jot ideas.\n\nTips: Keep prompts specific, add constraints, and iterate based on model feedback." :
          "You are an AI engineer. Create a prompt that extracts key insights from product reviews and outputs a JSON with sentiment, features, and issues.") :
        undefined,
      videoUrl: les.type === "video" ?
        "https://www.youtube.com/embed/dQw4w9WgXcQ" :
        undefined,
    },
    prev,
    next,
  };
  return { track, lesson };
}

function formatProgress(track: Track | null, current: { moduleId: string; lessonId: string }, userProgress: any[] = []) {
  const modules = track?.modules || [];
  const allLessons = modules.flatMap((m) => m.lessons.map((l) => ({ m: m.id, l: l.id })));
  const idx = allLessons.findIndex((x) => x.m === current.moduleId && x.l === current.lessonId);
  
  // Count only completed lessons for progress percentage
  const completedCount = userProgress.filter((p: any) => p.status === 'completed').length;
  const percent = allLessons.length ? Math.round((completedCount / allLessons.length) * 100) : 0;
  
  return { 
    total: allLessons.length, 
    index: idx + 1, 
    percent,
    completed: completedCount
  };
}

function highlight(text: string, q: string) {
  if (!q) return text;
  const parts = text.split(new RegExp(`(${q.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")})`, "ig"));
  return parts.map((p, i) => (i % 2 === 1 ? <mark key={i} className="bg-yellow-200 dark:bg-yellow-600/40 rounded px-0.5">{p}</mark> : <span key={i}>{p}</span>));
}

function extractPromptFromContent(content: string): string {
  // Extract prompt from content if it exists
  // Look for code blocks that might contain prompts
  const codeBlockMatch = content.match(/```(?:\w+)?\n([\s\S]*?)\n```/);
  if (codeBlockMatch && codeBlockMatch[1]) {
    return codeBlockMatch[1].trim();
  }
  
  // If no code block, return the first paragraph
  const paragraphMatch = content.match(/^(.*?)\n/);
  if (paragraphMatch && paragraphMatch[1]) {
    return paragraphMatch[1].trim();
  }
  
  return content.substring(0, 200); // fallback to first 200 characters
}

export default function Lesson() {
  const navigate = useNavigate();
  const { trackId = "", moduleId = "", lessonId = "" } = useParams();
  const [track, setTrack] = useState<Track | null>(null);
  const [lesson, setLesson] = useState<LessonContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userProgress, setUserProgress] = useState<any[]>([]);
  const [showPlayground, setShowPlayground] = useState(false);

  const [transcriptQuery, setTranscriptQuery] = useState("");
  const noteInputRef = useRef<HTMLTextAreaElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const storageKey = `notes:${trackId}:${moduleId}:${lessonId}`;
  const [notes, setNotes] = useState<{ id: string; text: string; createdAt: string }[]>(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) || "[]"); } catch { return []; }
  });
  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(notes)); } catch {}
  }, [storageKey, notes]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      // Debug authentication
      const token = localStorage.getItem("auth_token");
      console.log('Lesson data loading useEffect - Auth token:', token ? 'Present' : 'Missing');
      
      try {
        const t = await apiGetTrack(trackId);
        if (!mounted) return;
        setTrack(t?.track || null);
      } catch { setTrack(null); }
      try {
        const l = await apiGetLesson(trackId, moduleId, lessonId);
        if (!mounted) return;
        if (l) {
          setLesson({
            trackId,
            moduleId,
            lesson: l, // flatten all lesson fields here
          });
        }
      } catch {
        setLesson(null);
      }
      // Load user progress for accurate progress bar
      try {
        console.log('Loading user progress for:', { trackId, moduleId, lessonId });
        
        // Check if we have cached progress from previous lesson completion
        const cachedProgress = localStorage.getItem('userProgressCache');
        if (cachedProgress) {
          console.log('Using cached progress');
          const parsedProgress = JSON.parse(cachedProgress);
          if (mounted) {
            setUserProgress(parsedProgress);
            // Don't return here, still fetch from API to ensure we have the latest data
          }
        }
        
        // Small delay to ensure API has time to update after previous lesson completion
        await new Promise(resolve => setTimeout(resolve, 300));
        const progressData = await apiGetProgress();
        console.log('Loaded user progress from API:', progressData);
        if (mounted) {
          setUserProgress(progressData.progress || []);
          // Update cache with fresh data
          try {
            localStorage.setItem('userProgressCache', JSON.stringify(progressData.progress || []));
          } catch (e) {
            console.warn('Could not update progress cache:', e);
          }
        }
      } catch (error) {
        console.warn('Could not load user progress:', error);
        if (mounted) {
          setUserProgress([]);
        }
      }
      
      finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { 
      mounted = false; 
      // Clear progress cache when component unmounts to avoid stale data
      try {
        localStorage.removeItem('userProgressCache');
        console.log('Cleared progress cache');
      } catch (e) {
        console.warn('Could not clear progress cache:', e);
      }
    };
  }, [trackId, moduleId, lessonId]);

  useEffect(() => {
    // Mock data fallback for development
    if (!loading && (!track || !lesson)) {
      const mock = mockCourse(trackId, moduleId, lessonId);
      if (!track) setTrack(mock.track);
      if (!lesson) setLesson(mock.lesson);
    }
  }, [loading, track, lesson, trackId, moduleId, lessonId]);

  useEffect(() => {
    (async () => {
      // Debug authentication
      const token = localStorage.getItem("auth_token");
      console.log('Lesson progress useEffect - Auth token:', token ? 'Present' : 'Missing');
      
      // Calculate lessonLocked locally for this effect
      const calculatedLessonLocked = (() => {
        if (!track || !moduleId || !lessonId || !userProgress || !trackId) {
          console.log('Lesson locking calculation - missing required data');
          return false;
        }
        
        // Find current module and lesson positions
        const modules = track.modules || [];
        const moduleIndex = modules.findIndex(m => m.id === moduleId);
        if (moduleIndex === -1) {
          console.log('Lesson locking calculation - module not found');
          return false;
        }
        
        const currentModule = modules[moduleIndex];
        const lessons = currentModule.lessons || [];
        const lessonIndex = lessons.findIndex(l => l.id === lessonId);
        if (lessonIndex === -1) {
          console.log('Lesson locking calculation - lesson not found');
          return false;
        }
        
        console.log('Lesson locking calculation - checking lesson', { moduleId, lessonId, moduleIndex, lessonIndex, userProgressLength: userProgress?.length });
        
        // First lesson of first module is never locked
        if (moduleIndex === 0 && lessonIndex === 0) {
          console.log('Lesson locking calculation - first lesson of first module, not locked');
          return false;
        }
        
        // For lessons in the same module, check if previous lesson is completed
        if (lessonIndex > 0) {
          const previousLesson = lessons[lessonIndex - 1];
          const previousProgress = userProgress.find((p: any) => 
            p.track_id === trackId && p.module_id === moduleId && p.lesson_id === previousLesson.id
          );
          console.log('Lesson locking calculation - checking previous lesson in same module', { 
            previousLessonId: previousLesson.id, 
            previousProgress 
          });
          return previousProgress?.status !== 'completed';
        }
        
        // For first lesson in a module, check if previous module is completed
        if (lessonIndex === 0 && moduleIndex > 0) {
          const previousModule = modules[moduleIndex - 1];
          // Check if all lessons in previous module are completed
          const allPreviousCompleted = (previousModule.lessons || []).every(lesson => {
            const progress = userProgress.find((p: any) => 
              p.track_id === trackId && p.module_id === previousModule.id && p.lesson_id === lesson.id
            );
            return progress?.status === 'completed';
          });
          console.log('Lesson locking calculation - checking previous module completion', { 
            previousModuleId: previousModule.id, 
            allPreviousCompleted 
          });
          return !allPreviousCompleted;
        }
        
        console.log('Lesson locking calculation - default case, not locked');
        return false;
      })();

      console.log('Lesson locking effect - calculatedLessonLocked:', calculatedLessonLocked);
      // Only mark as in_progress if lesson is not locked
      if (!calculatedLessonLocked) {
        try { 
          console.log('Setting lesson progress to in_progress');
          await apiSetLessonProgress({ trackId, moduleId, lessonId, status: "in_progress" }); 
          console.log('Successfully set lesson progress to in_progress');
        } catch (error) {
          console.error('Failed to set lesson progress to in_progress:', error);
        } 
      } else {
        console.log('Lesson is locked, not setting in_progress status');
      }
    })();
  }, [trackId, moduleId, lessonId, track, userProgress]);

  const moduleList: TrackModule[] = useMemo(() => track?.modules || [], [track]);
  const progress = useMemo(() => formatProgress(track, { moduleId, lessonId }, userProgress), [track, moduleId, lessonId, userProgress]);
  
  // Compute if current lesson is locked
  const lessonLocked = useMemo(() => {
    // If we don't have the necessary data, assume not locked
    if (!trackId || !moduleId || !lessonId || !userProgress || !track) return false;
    
    // Find the current lesson's position in the track
    const modules = track.modules || [];
    const moduleIndex = modules.findIndex(m => m.id === moduleId);
    if (moduleIndex === -1) return false;
    
    const currentModule = modules[moduleIndex];
    const lessons = currentModule.lessons || [];
    const lessonIndex = lessons.findIndex(l => l.id === lessonId);
    if (lessonIndex === -1) return false;
    
    // First lesson of first module is never locked
    if (moduleIndex === 0 && lessonIndex === 0) return false;
    
    // Check if the DIRECT previous lesson is completed
    let previousLessonId;
    
    if (lessonIndex > 0) {
      // Previous lesson in the same module
      previousLessonId = lessons[lessonIndex - 1].id;
    } else if (moduleIndex > 0) {
      // Last lesson of the previous module
      const prevModule = modules[moduleIndex - 1];
      const prevModuleLessons = prevModule.lessons || [];
      if (prevModuleLessons.length > 0) {
        previousLessonId = prevModuleLessons[prevModuleLessons.length - 1].id;
      }
    }
    
    if (!previousLessonId) return false;
    
    // Check if that specific previous lesson is completed
    const previousProgress = userProgress.find((p: any) => 
      p.track_id === trackId && 
      p.module_id === (lessonIndex > 0 ? moduleId : modules[moduleIndex - 1].id) && 
      p.lesson_id === previousLessonId
    );
    
    // The lesson is locked if the previous lesson is NOT completed
    return previousProgress?.status !== 'completed';
  }, [track, moduleId, lessonId, userProgress, trackId]);
  
  // Compute if current lesson is completed
  const lessonCompleted = useMemo(() => {
    console.log('Calculating lessonCompleted for:', { trackId, moduleId, lessonId });
    console.log('User progress for completed check:', userProgress);
    
    if (!trackId || !moduleId || !lessonId || !userProgress) {
      console.log('lessonCompleted calculation - missing required data');
      return false;
    }
    
    const progress = userProgress.find((p: any) => 
      p.track_id === trackId && p.module_id === moduleId && p.lesson_id === lessonId
    );
    
    console.log('Found progress for current lesson:', progress);
    const isCompleted = progress?.status === 'completed';
    console.log('lessonCompleted calculation result:', isCompleted);
    return isCompleted;
  }, [trackId, moduleId, lessonId, userProgress]);
  
  // Compute if there is a previous lesson
  // Compute if there is a previous lesson
  const hasPrevLesson = useMemo(() => {
    return !!lesson?.prev;
  }, [lesson]);
  
  // Compute if there is a next lesson
  const hasNextLesson = useMemo(() => {
    return !!lesson?.next;
  }, [lesson]);
  
  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); if (hasPrevLesson) goPrev(); }
      if (e.key === "ArrowRight") { e.preventDefault(); if (hasNextLesson) goNext(); }
      if (e.key === "/") { e.preventDefault(); searchInputRef.current?.focus(); }
      if (e.key.toLowerCase() === "n") { e.preventDefault(); noteInputRef.current?.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Compute previous lesson navigation
  const goPrev = () => {
    if (lesson?.prev) {
      navigate(`/learning/${lesson.prev.trackId}/${lesson.prev.moduleId}/${lesson.prev.lessonId}`);
    } else {
      // Fallback logic if lesson.prev is not available
      if (track && moduleId && lessonId) {
        const modules = track.modules || [];
        const moduleIndex = modules.findIndex(m => m.id === moduleId);
        if (moduleIndex !== -1) {
          const currentModule = modules[moduleIndex];
          const lessons = currentModule.lessons || [];
          const lessonIndex = lessons.findIndex(l => l.id === lessonId);
          
          if (lessonIndex !== -1) {
            // If not the first lesson in the module, go to previous lesson in same module
            if (lessonIndex > 0) {
              const prevLesson = lessons[lessonIndex - 1];
              navigate(`/learning/${trackId}/${moduleId}/${prevLesson.id}`);
              return;
            }
            
            // If first lesson in module but not first module, go to last lesson of previous module
            if (moduleIndex > 0) {
              const prevModule = modules[moduleIndex - 1];
              const prevLessons = prevModule.lessons || [];
              if (prevLessons.length > 0) {
                const lastLesson = prevLessons[prevLessons.length - 1];
                navigate(`/learning/${trackId}/${prevModule.id}/${lastLesson.id}`);
                return;
              }
            }
          }
        }
      }
    }
  };
  
  // Compute next lesson navigation
  const goNext = () => {
    if (lesson?.next) {
      navigate(`/learning/${lesson.next.trackId}/${lesson.next.moduleId}/${lesson.next.lessonId}`);
    } else {
      // Fallback logic if lesson.next is not available
      if (track && moduleId && lessonId) {
        const modules = track.modules || [];
        const moduleIndex = modules.findIndex(m => m.id === moduleId);
        if (moduleIndex !== -1) {
          const currentModule = modules[moduleIndex];
          const lessons = currentModule.lessons || [];
          const lessonIndex = lessons.findIndex(l => l.id === lessonId);
          
          if (lessonIndex !== -1) {
            // If not the last lesson in the module, go to next lesson in same module
            if (lessonIndex < lessons.length - 1) {
              const nextLesson = lessons[lessonIndex + 1];
              navigate(`/learning/${trackId}/${moduleId}/${nextLesson.id}`);
              return;
            }
            
            // If last lesson in module but not last module, go to first lesson of next module
            if (moduleIndex < modules.length - 1) {
              const nextModule = modules[moduleIndex + 1];
              const nextLessons = nextModule.lessons || [];
              if (nextLessons.length > 0) {
                const firstLesson = nextLessons[0];
                navigate(`/learning/${trackId}/${nextModule.id}/${firstLesson.id}`);
                return;
              }
            }
          }
        }
      }
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); if (lesson?.prev) goPrev(); }
      if (e.key === "ArrowRight") { e.preventDefault(); if (lesson?.next) goNext(); }
      if (e.key === "/") { e.preventDefault(); searchInputRef.current?.focus(); }
      if (e.key.toLowerCase() === "n") { e.preventDefault(); noteInputRef.current?.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lesson, goPrev, goNext]);

  const markComplete = async () => {
    if (!lesson) return;
    
    // Debug authentication
    const token = localStorage.getItem("auth_token");
    console.log('Mark complete - Auth token:', token ? 'Present' : 'Missing');
    
    // Don't allow marking a completed lesson again
    if (lessonCompleted) {
      // Navigate to next lesson if available
      // Use the same logic as in markComplete for consistency
      if (lesson?.next) {
        navigate(`/learning/${lesson.next.trackId}/${lesson.next.moduleId}/${lesson.next.lessonId}`);
      } else {
        // Try to compute next lesson manually as fallback
        if (track && moduleId && lessonId) {
          const modules = track.modules || [];
          const moduleIndex = modules.findIndex(m => m.id === moduleId);
          if (moduleIndex !== -1) {
            const currentModule = modules[moduleIndex];
            const lessons = currentModule.lessons || [];
            const lessonIndex = lessons.findIndex(l => l.id === lessonId);
            
            if (lessonIndex !== -1) {
              // If not the last lesson in the module, go to next lesson in same module
              if (lessonIndex < lessons.length - 1) {
                const nextLesson = lessons[lessonIndex + 1];
                navigate(`/learning/${trackId}/${moduleId}/${nextLesson.id}`);
                return;
              }
              
              // If last lesson in module but not last module, go to first lesson of next module
              if (moduleIndex < modules.length - 1) {
                const nextModule = modules[moduleIndex + 1];
                const nextLessons = nextModule.lessons || [];
                if (nextLessons.length > 0) {
                  const firstLesson = nextLessons[0];
                  navigate(`/learning/${trackId}/${nextModule.id}/${firstLesson.id}`);
                  return;
                }
              }
            }
          }
        }
        
        // If we can't compute next lesson, show a message
        alert('You have already completed this lesson.');
      }
      return;
    }
    
    // Don't allow marking a locked lesson
    if (lessonLocked) {
      alert('This lesson is locked. Please complete the previous lessons first.');
      return;
    }
    
    setSaving(true);
    
    try {
      console.log('Marking lesson complete:', { trackId, moduleId, lessonId });
      let userInfo;
      try {
        userInfo = await apiMe();
      } catch {
        try {
          userInfo = await apiMeCookie();
        } catch (authError) {
          console.error('Authentication failed during completion:', authError);
          alert('Your session has expired. Please log in again to save your progress.');
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
          return;
        }
      }
      
      // 1. Mark lesson as completed via API
      const result = await apiSetLessonProgress({ trackId, moduleId, lessonId, status: "completed" });
      console.log('Lesson marked complete successfully:', result);
      
      // 2. Update local progress state IMMEDIATELY and consistently
      // This approach updates the state by adding the new completion
      const updatedProgress = [
        ...userProgress.filter((p: any) => 
          !(p.track_id === trackId && p.module_id === moduleId && p.lesson_id === lessonId)
        ),
        {
          track_id: trackId,
          module_id: moduleId,
          lesson_id: lessonId,
          status: "completed",
          updated_at: new Date().toISOString()
        }
      ];
      console.log('Setting updated progress state:', updatedProgress);
      setUserProgress(updatedProgress);
      
      // Small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 3. Navigate to next lesson
      // Check if this is actually the last lesson in the track
      const isLastLesson = !lesson?.next;
      
      if (lesson?.next) {
        setTimeout(() => {
          navigate(`/learning/${lesson.next.trackId}/${lesson.next.moduleId}/${lesson.next.lessonId}`);
        }, 1000); // Reduced delay for smoother navigation
      } else if (isLastLesson) {
        // Only show final lesson message if this is truly the last lesson
        setTimeout(() => {
          alert('Congratulations! You have completed the final lesson in this track.');
        }, 1000);
      } else {
        // If there's no next lesson data but it's not the last lesson, 
        // still navigate to what should be the next lesson
        // This handles cases where lesson.next might not be populated
        console.log('No next lesson data found, checking track structure');
        
        // Try to compute next lesson manually as fallback
        if (track && moduleId && lessonId) {
          const modules = track.modules || [];
          const moduleIndex = modules.findIndex(m => m.id === moduleId);
          if (moduleIndex !== -1) {
            const currentModule = modules[moduleIndex];
            const lessons = currentModule.lessons || [];
            const lessonIndex = lessons.findIndex(l => l.id === lessonId);
            
            if (lessonIndex !== -1) {
              // If not the last lesson in the module, go to next lesson in same module
              if (lessonIndex < lessons.length - 1) {
                const nextLesson = lessons[lessonIndex + 1];
                setTimeout(() => {
                  navigate(`/learning/${trackId}/${moduleId}/${nextLesson.id}`);
                }, 1000);
                return;
              }
              
              // If last lesson in module but not last module, go to first lesson of next module
              if (moduleIndex < modules.length - 1) {
                const nextModule = modules[moduleIndex + 1];
                const nextLessons = nextModule.lessons || [];
                if (nextLessons.length > 0) {
                  const firstLesson = nextLessons[0];
                  setTimeout(() => {
                    navigate(`/learning/${trackId}/${nextModule.id}/${firstLesson.id}`);
                  }, 1000);
                  return;
                }
              }
            }
          }
        }
        
        // If we can't compute next lesson, show a generic completion message
        setTimeout(() => {
          alert('Lesson completed! Continuing to next lesson...');
        }, 1000);
      }
      
    } catch (e: any) {
      console.error('Failed to mark lesson complete:', e);
      console.error('Error details:', { message: e?.message, status: e?.status, stack: e?.stack });
      
      // Provide more specific error messages
      let errorMessage = 'Failed to save your progress.';
      
      if (e?.message?.includes('Unauthorized')) {
        errorMessage = 'Your session has expired. Please log in again to save your progress.';
        localStorage.removeItem('auth_token');
        alert(errorMessage);
        window.location.href = '/login';
        return;
      } else if (e?.message?.includes('Network') || e?.message?.includes('Failed to fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (e?.message) {
        errorMessage = `Error: ${e.message}`;
      }
      
      alert(errorMessage);
    } finally { 
      setSaving(false); 
    }
  };

  const addNote = (text: string) => {
    const t = text.trim();
    if (!t) return;
    setNotes((prev) => [{ id: `${Date.now()}`, text: t, createdAt: new Date().toISOString() }, ...prev]);
    if (noteInputRef.current) noteInputRef.current.value = "";
  };
  const removeNote = (id: string) => setNotes((prev) => prev.filter((n) => n.id !== id));

  const current = lesson?.lesson;

  const renderContent = () => {
    if (!current) return (
      <div className="text-center py-12">
        <div className="text-muted-foreground mb-4">⚠️ Lesson content not available</div>
        <p className="text-sm text-muted-foreground">This lesson may be loading or there might be an issue with the content.</p>
        <Button variant="outline" onClick={() => window.location.reload()} className="mt-4">
          Refresh Page
        </Button>
      </div>
    );

    // Enhanced video lessons with proper content support
    if (current.type === "video") {
      const isMp4 = (current.videoUrl || "").endsWith(".mp4");
      const hasRealVideo = current.videoUrl && !current.videoUrl.includes('dQw4w9WgXcQ'); // Detect placeholder
      
      return (
        <div className="space-y-6">
  <div className="aspect-video rounded-md overflow-hidden border border-gray-200 dark:border-gray-700/50 bg-muted/30">
    {current?.videoUrl ? (
      current.videoUrl.endsWith('.mp4') ? (
        <video
          className="w-full h-full"
          controls
          controlsList="nodownload"
          src={current.videoUrl}
        >
          Sorry, your browser doesn't support embedded videos.
        </video>
      ) : (
        <iframe
          className="w-full h-full"
          src={current.videoUrl}
          title={current.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
        
      )
    ) : (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted/50 to-muted">
        <div className="text-center space-y-4">
          <Video className="h-16 w-16 mx-auto text-muted-foreground" />
          <div>
            <h3 className="font-semibold text-lg mb-2">{current?.title || 'Lesson'}</h3>
            <p className="text-sm text-muted-foreground mb-4">Video content coming soon</p>
            <div className="text-xs text-muted-foreground bg-muted/50 rounded px-3 py-2">
              Duration: {current?.durationMin || 'TBD'} minutes
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
  <div className="flex justify-end mt-2">
  <Button
        size="sm"
         className="bg-[#bdeeff] hover:bg-[#bdeeff]/90 text-black"
        variant="default"
        onClick={() => {
          console.log('Video lesson playground button clicked', showPlayground);
          setShowPlayground(!showPlayground);
        }}
        aria-label="Toggle Playground"
      >
        <Terminal className="h-4 w-4 mr-1" />
        {showPlayground ? "Close Playground" : "Open Playground"}
      </Button>
      </div>
  {/* Lesson Content */}
  {current?.content && (
    <div className="space-y-4">
      <div className="border-l-4 border-brand-500 pl-4">
        <h3 className="font-semibold mb-2">Lesson Overview</h3>
        <div
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: mdToHtml(current.content) }}
        />
      </div>
    </div>
  )}
  
  {/* Playground - Always render when showPlayground is true */}
  {showPlayground && (
    <div className="my-6">
      <Playground 
        initialPrompt={current?.content ? extractPromptFromContent(current.content) : ""}
        onClose={() => setShowPlayground(false)}
      />
    </div>
  )}
  
  <p className="text-sm text-muted-foreground border-t pt-4">
    💡 <strong>Pro tip:</strong> Use the Transcript and Notes panels to the right. Press{' '}
    <kbd className="bg-muted px-1 rounded text-xs">/</kbd> to search transcript,{' '}
    <kbd className="bg-muted px-1 rounded text-xs">N</kbd> to focus notes.
  </p>
</div>
      )};

    // Enhanced text lessons with better formatting
    if (current.type === "text") {
      return (
        <div className="space-y-6">
          <div className="flex justify-end">
            <Button
              size="sm"
              className="bg-[#bdeeff] hover:bg-[#bdeeff]/90 text-black"
              variant="default"
              onClick={() => setShowPlayground(!showPlayground)}
              aria-label="Toggle Playground"
            >
              <Terminal className="h-4 w-4 mr-1" />
              {showPlayground ? "Close Playground" : "Open Playground"}
            </Button>
          </div>
          
          {current.content ? (
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <div dangerouslySetInnerHTML={{ __html: mdToHtml(current.content) }} />
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">{current.title}</h3>
              <p className="text-muted-foreground">Reading content is being prepared for this lesson.</p>
            </div>
          )}
          
          {/* Playground - Rendered when showPlayground is true */}
          {showPlayground && (
            <div className="my-6">
              <Playground 
                initialPrompt={current?.content ? extractPromptFromContent(current.content) : ""}
                onClose={() => setShowPlayground(false)}
              />
            </div>
          )}
        </div>
      );
    }

    // Enhanced playground lessons with better UX
    if (current.type === "sandbox" || current.type === "playground") {
      return (
        <div className="space-y-6">
          {current.content ? (
            <>
              {/* Lesson instructions */}
              <div className="bg-brand-50 dark:bg-brand-950/50 border border-brand-200 dark:border-brand-800 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <Code className="h-6 w-6 text-brand-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-brand-900 dark:text-brand-100 mb-2">Playground Exercise</h3>
                    <div className="prose prose-sm prose-brand max-w-none" dangerouslySetInnerHTML={{
                      __html: mdToHtml(
                        current.content
                          .split('\n')
                          .slice(0, current.content.indexOf('```') > 0 ? current.content.split('\n').findIndex(line => line.includes('```')) : 5)
                          .join('\n')
                      )
                    }} />
                  </div>
                </div>
              </div>
              
              {/* Extract and display code/prompt */}
              {(() => {
                const codeMatch = current.content.match(/```[\w]*\n([\s\S]*?)```/);
                const promptContent = codeMatch ? codeMatch[1].trim() : 
                  // Fallback: look for lines that seem like prompts
                  current.content.split('\n').find(line => 
                    line.includes('prompt') || line.includes('Create') || line.includes('Generate') || line.length > 50
                  ) || current.content.split('\n').slice(-3).join('\n');
                
                return promptContent && (
                  <Card className="border-gray-200 dark:border-gray-700/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Practice Prompt
                      </CardTitle>
                      <CardDescription>
                        Copy this prompt to the Playground and experiment with it
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted rounded-md p-4 font-mono text-sm overflow-auto max-h-64" aria-label="Playground prompt">
                        <pre className="whitespace-pre-wrap">{promptContent}</pre>
                      </div>
                      <div className="flex gap-3 justify-end mt-4">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={async() => { 
                            const ok = await copyText(promptContent); 
                            if (!ok) alert("Failed to copy to clipboard"); 
                            else {
                              // Show success feedback
                              const btn = document.activeElement as HTMLButtonElement;
                              const originalText = btn?.textContent;
                              if (btn && originalText) {
                                btn.textContent = "Copied!";
                                setTimeout(() => btn.textContent = originalText, 2000);
                              }
                            }
                          }} 
                          aria-label="Copy to clipboard"
                        >
                          <Check className="h-4 w-4 mr-1" />Copy
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => {
                            console.log('Open in Playground button clicked');
                            setShowPlayground(true);
                          }}
                          aria-label="Open in Playground"
                        >
                          <Terminal className="h-4 w-4 mr-1" />Open in Playground
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })()} 

              {/* Additional content after the code block */}
              {(() => {
                const afterCodeMatch = current.content.match(/```[\w]*\n[\s\S]*?```\n\n([\s\S]+)/);
                const additionalContent = afterCodeMatch ? afterCodeMatch[1].trim() : null;
                
                return additionalContent && (
                  <div className="prose prose-sm max-w-none pt-4 border-t">
                    <div dangerouslySetInnerHTML={{
                      __html: mdToHtml(additionalContent)
                    }} />
                  </div>
                );
              })()} 
            </>
          ) : (
            <div className="space-y-6">
              <div className="text-center py-6">
                <Code className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">{current.title}</h3>
                <p className="text-muted-foreground mb-4">Interactive exercise with Playground</p>
              </div>
              
              {/* Playground - Rendered when showPlayground is true */}
              {showPlayground && (
                <div className="my-6">
                  <Playground 
                    initialPrompt={current?.content || ""}
                    onClose={() => setShowPlayground(false)}
                  />
                </div>
              )}
              
              {current.content && (
                <div className="prose prose-gray dark:prose-invert max-w-none border-t pt-6">
                  <div dangerouslySetInnerHTML={{ __html: mdToHtml(current.content) }} />
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    // Quiz/Assessment lessons
    if (current.type === "quiz" || current.type === "assessment") {
      return (
        <div className="space-y-6">
          <div className="flex justify-end">
            <Button
              size="sm"
              className="bg-[#bdeeff] hover:bg-[#bdeeff]/90 text-black"
              variant="default"
              onClick={() => setShowPlayground(!showPlayground)}
              aria-label="Toggle Playground"
            >
              <Terminal className="h-4 w-4 mr-1" />
              {showPlayground ? "Close Playground" : "Open Playground"}
            </Button>
          </div>
          
          <div className="text-center py-12">
            <HelpCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">{current.title}</h3>
            <p className="text-muted-foreground mb-4">Interactive quiz feature coming soon.</p>
            <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-4 max-w-sm mx-auto">
              This will include knowledge checks, practical assessments, and progress validation.
            </div>
          </div>
          
          {/* Playground - Rendered when showPlayground is true */}
          {showPlayground && (
            <div className="my-6">
              <Playground 
                initialPrompt={current?.title || ""}
                onClose={() => setShowPlayground(false)}
              />
            </div>
          )}
        </div>
      );
    }

    // Fallback for unknown lesson types
    return (
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button
            size="sm"
            className="bg-[#bdeeff] hover:bg-[#bdeeff]/90 text-black"
            variant="default"
            onClick={() => setShowPlayground(!showPlayground)}
            aria-label="Toggle Playground"
          >
            <Terminal className="h-4 w-4 mr-1" />
            {showPlayground ? "Close Playground" : "Open Playground"}
          </Button>
        </div>
        
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-2">{current.title}</h3>
          <p className="text-muted-foreground mb-4">Lesson type "{current.type}" is not yet supported.</p>
          <div className="text-sm text-muted-foreground">
            Please contact support or check back later.
          </div>
        </div>
        
        {/* Playground - Rendered when showPlayground is true */}
        {showPlayground && (
          <div className="my-6">
            <Playground 
              initialPrompt={current?.title || ""}
              onClose={() => setShowPlayground(false)}
            />
          </div>
        )}
      </div>
    );
  };

  const transcriptText = (() => {
    if (!current) return "";
    /* if (current.type === "video") {
      return (
        "00:00 Welcome to AI Engineering Basics.\n" +
        "00:15 Today we will cover prompting, iteration, and evaluation.\n" +
        "01:10 Prompt structure: role, task, constraints, examples.\n" +
        "02:30 Tips for evaluation and dataset design.\n" +
        "03:40 Summary and recommended readings."
      );
    } */
    return (current.content || "");
  })();

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <LoggedInHeader />
        <div className="h-[calc(100vh-4rem)] flex flex-col">
          <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700/40">
            <Skeleton className="h-3 w-40" />
          </div>
          <main className="flex-1 p-6 space-y-4 overflow-y-auto">
            <Skeleton className="h-8 w-72" />
            <Skeleton className="h-5 w-96" />
            <Skeleton className="h-80 w-full" />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <LoggedInHeader />
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        <div
          className="px-6 py-3 border-b border-gray-200 dark:border-gray-700/40 flex items-center gap-4"
          role="region"
          aria-label="Progress bar"
        >
          <div className="min-w-24 text-xs text-muted-foreground">
            {progress.completed}/{progress.total}
          </div>
          <Progress value={progress.percent} className="h-2" />
          <div className="ml-auto flex items-center gap-2">
            <Badge variant="outline" className="hidden sm:inline-flex">
              {progress.percent}% completed
            </Badge>
            <div className="text-xs text-muted-foreground hidden md:block">
              Lesson {progress.index}/{progress.total}
            </div>
          </div>
        </div>
        <div className="flex flex-1 overflow-hidden">
          {/* Course index sidebar removed for single-course view, kept for future use.
          <aside className="w-64 bg-muted/30 border-r ...">...</aside>
          */}

          <main
            className="flex-1 p-6 space-y-4 overflow-y-auto"
            role="main"
            aria-label="Lesson content"
          >
            <div className="flex items-center justify-between gap-4 mb-2">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/learning")}
                  aria-label="Back to courses"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back to Courses
                </Button>
                <div>
                  <h1 className="text-2xl font-bold">{current?.title ?? ""}</h1>
                  <p className="text-sm text-muted-foreground">
                    {track?.title} • Module{" "}
                    {(track?.modules || []).findIndex((x) => x.id === moduleId) + 1}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={goPrev}
                  disabled={!lesson?.prev}
                  aria-label="Previous lesson"
                  className="bg-black text-white border-white hover:bg-black hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4 mr-1 text-white" />
                  Prev
                </Button>
                <Button
                  variant="outline"
                  onClick={goNext}
                  disabled={!lesson?.next}
                  aria-label="Next lesson"
                  className="bg-black text-white border-white hover:bg-black hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1 text-white" />
                </Button>

                <Button
                  onClick={markComplete}
                  disabled={saving || lessonLocked}
                  aria-label="Mark lesson complete"
                >
                  <Check className="h-4 w-4 mr-1" />
                  {lessonLocked ? (
                    <>
                      <Lock className="h-4 w-4 mr-1" />
                      Locked
                    </>
                  ) : lessonCompleted ? (
                    "Completed"
                  ) : saving ? (
                    "Saving..."
                  ) : (
                    "Mark Complete"
                  )}
                </Button>
              </div>
            </div>

            <Card>
              <CardContent className="pt-6">{renderContent()}</CardContent>
            </Card>

            {/* Right-hand transcript/notes panel removed for simplified course view,
                but the underlying functionality is preserved below for future use.

            <Card>...Recommended next...</Card>
            */}
          </main>

          {/* Full right-hand transcript & notes aside kept for future use.
          <aside className="hidden xl:flex w-96 border-l ...">...</aside>
          */}
        </div>
      </div>
    </div>
  );
}