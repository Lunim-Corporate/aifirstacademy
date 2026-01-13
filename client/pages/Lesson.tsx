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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { copyText } from "@/lib/utils";
import { Check, Play, BookOpen, Video, FileText, Code, ChevronLeft, ChevronRight, Search, PlusCircle, Trash2, Award, Target, HelpCircle, Lock, Terminal, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import type { Track, TrackModule, TrackModuleLesson, LessonContent, LessonType } from "@shared/api";
import { apiGetTrack, apiGetLesson, apiSetLessonProgress, apiGetProgress, apiMe, apiMeCookie } from "@/lib/api";
import Playground from "@/components/Playground";
import { toast } from "@/hooks/use-toast";
import Sandbox from "./Sandbox";
import SandboxPlayground from "./SandboxPlayground";


function isPreviewHost() {
  return false; // Preview mode disabled
}

// Simple markdown to HTML converter for lesson content
function mdToHtml(src: string): string {
  try {
    // Process tables first (most complex)
    let processed = src;
    
    // Simple table detection and conversion
    const lines = processed.split('\n');
    const result: string[] = [];
    let i = 0;
    
    while (i < lines.length) {
      const line = lines[i].trim();
      
      // Check for table start (line with pipes)
      if (line.startsWith('|') && line.endsWith('|')) {
        const tableStart = i;
        let tableEnd = i;
        
        // Find table bounds
        while (tableEnd < lines.length) {
          const currentLine = lines[tableEnd].trim();
          if (currentLine.startsWith('|') && currentLine.endsWith('|')) {
            tableEnd++;
          } else {
            break;
          }
        }
        
        // Check if it looks like a valid table (header + separator + data)
        if (tableEnd - tableStart >= 2) {
          const tableLines = lines.slice(tableStart, tableEnd);
          let hasSeparator = false;
          
          // Check for separator row
          for (const tableLine of tableLines) {
            const trimmed = tableLine.trim();
            if (trimmed.includes('|') && trimmed.includes('-') && trimmed.replace(/[|\-\s]/g, '').length === 0) {
              hasSeparator = true;
              break;
            }
          }
          
          if (hasSeparator) {
            // Convert to HTML table
            let tableHtml = '<table class="border-collapse border border-gray-300 my-4">';
            let inHeader = true;
            
            for (const tableLine of tableLines) {
              const trimmedLine = tableLine.trim();
              
              // Check if separator row
              if (trimmedLine.includes('|') && trimmedLine.includes('-') && trimmedLine.replace(/[|\-\s]/g, '').length === 0) {
                inHeader = false;
                continue;
              }
              
              // Extract cells
              const cells = trimmedLine
                .replace(/^\|/, '')
                .replace(/\|$/, '')
                .split('|')
                .map(cell => cell.trim());
              
              if (inHeader) {
                tableHtml += '<thead class="bg-gray-100"><tr>';
                for (const cell of cells) {
                  tableHtml += `<th class="border border-gray-300 px-4 py-2 font-semibold text-gray-900">${cell}</th>`;
                }
                tableHtml += '</tr></thead>';
              } else {
                if (!tableHtml.includes('<tbody>')) tableHtml += '<tbody>';
                tableHtml += '<tr>';
                for (const cell of cells) {
                  tableHtml += `<td class="border border-gray-300 px-4 py-2">${cell}</td>`;
                }
                tableHtml += '</tr>';
              }
            }
            
            if (tableHtml.includes('<tbody>')) tableHtml += '</tbody>';
            tableHtml += '</table>';
            
            result.push(tableHtml);
            i = tableEnd;
            continue;
          }
        }
      }
      
      result.push(lines[i]);
      i++;
    }
    
    processed = result.join('\n');
    
    // Process remaining markdown elements
    return processed
      // Code fences
      .replace(/```([\w]*)?\n([\s\S]*?)```/g, '<pre class="bg-muted rounded-lg p-4 overflow-x-auto my-4"><code class="text-sm">$2</code></pre>')
      // Headers
      .replace(/^### (.*)$/gm, '<h3 class="text-xl font-semibold mt-6 mb-3">$1</h3>')
      .replace(/^## (.*)$/gm, '<h2 class="text-2xl font-semibold mt-8 mb-4">$1</h2>')
      .replace(/^# (.*)$/gm, '<h1 class="text-3xl font-bold mt-10 mb-6">$1</h1>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Inline code
      .replace(/`(.*?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>')
      // Lists
      .replace(/^\s*-\s+(.*)$/gm, '<li class="mb-2">$1</li>')
      // Wrap consecutive list items
      .replace(/(<li class="mb-2">.*<\/li>\s*)+/g, '<ul class="list-disc pl-5 mb-4">$&</ul>')
      // Wrap remaining content in paragraphs
      .replace(/^(?!\s*<[^>]+>)(.+)$/gm, '<p class="mb-4">$1</p>')
      // Clean up empty paragraphs around HTML elements
      .replace(/<p[^>]*>\s*(<[a-z][^>]*>.*<\/[^>]+>)\s*<\/p>/gi, '$1')
      .replace(/<p[^>]*>\s*<\/p>/g, '');
  } catch {
    return src.replace(/\n/g, '<br>');
  }
}

function formatProgress(track: Track | null, current: { moduleId: string; lessonId: string }, userProgress: any[] = []) {
  const modules = track?.modules || [];
  const allLessons = modules.flatMap((m) => m.lessons.map((l) => ({ m: m.id, l: l.id })));
  const idx = allLessons.findIndex((x) => x.m === current.moduleId && x.l === current.lessonId);

  // Count only completed lessons for progress percentage
  const completedCount = userProgress.filter((p: any) => p.status === 'completed').length;
  const percent = allLessons.length ? Math.min(100, Math.round((completedCount / allLessons.length) * 100)) : 0;

  return {
    total: allLessons.length,
    index: idx + 1,
    percent,
    completed: completedCount
  };
}

function highlight(text: string, q: string) {
  if (!q) return text;
  const escapedQuery = q.replace(/[-/\^$*+?.()|[\]{}]/g, "\\$&");
  const regex = new RegExp(`(${escapedQuery})`, "ig");
  return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-600/40 rounded px-0.5">$1</mark>');
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

// Utility functions for navigation and progress

// Find next lesson in the track
function findNextLesson(track: Track | null, moduleId: string, lessonId: string) {
  if (!track) return null;

  const modules = track.modules || [];
  const moduleIndex = modules.findIndex(m => m.id === moduleId);
  if (moduleIndex === -1) return null;

  const currentModule = modules[moduleIndex];
  const lessons = currentModule.lessons || [];
  const lessonIndex = lessons.findIndex(l => l.id === lessonId);
  if (lessonIndex === -1) return null;

  // If not the last lesson in the module, go to next lesson in same module
  if (lessonIndex < lessons.length - 1) {
    const nextLesson = lessons[lessonIndex + 1];
    return {
      trackId: track.id,
      moduleId,
      lessonId: nextLesson.id
    };
  }

  // If last lesson in module but not last module, go to first lesson of next module
  if (moduleIndex < modules.length - 1) {
    const nextModule = modules[moduleIndex + 1];
    const nextLessons = nextModule.lessons || [];
    if (nextLessons.length > 0) {
      const firstLesson = nextLessons[0];
      return {
        trackId: track.id,
        moduleId: nextModule.id,
        lessonId: firstLesson.id
      };
    }
  }

  // No next lesson found
  return null;
}

// Find previous lesson in the track
function findPrevLesson(track: Track | null, moduleId: string, lessonId: string) {
  if (!track) return null;

  const modules = track.modules || [];
  const moduleIndex = modules.findIndex(m => m.id === moduleId);
  if (moduleIndex === -1) return null;

  const currentModule = modules[moduleIndex];
  const lessons = currentModule.lessons || [];
  const lessonIndex = lessons.findIndex(l => l.id === lessonId);
  if (lessonIndex === -1) return null;

  // If not the first lesson in the module, go to previous lesson in same module
  if (lessonIndex > 0) {
    const prevLesson = lessons[lessonIndex - 1];
    return {
      trackId: track.id,
      moduleId,
      lessonId: prevLesson.id
    };
  }

  // If first lesson in module but not first module, go to last lesson of previous module
  if (moduleIndex > 0) {
    const prevModule = modules[moduleIndex - 1];
    const prevLessons = prevModule.lessons || [];
    if (prevLessons.length > 0) {
      const lastLesson = prevLessons[prevLessons.length - 1];
      return {
        trackId: track.id,
        moduleId: prevModule.id,
        lessonId: lastLesson.id
      };
    }
  }

  // No previous lesson found
  return null;
}

// Check if lesson is the last lesson in the track
function isLastLesson(track: Track | null, moduleId: string, lessonId: string): boolean {
  if (!track) return false;

  const modules = track.modules || [];
  const moduleIndex = modules.findIndex(m => m.id === moduleId);
  if (moduleIndex === -1) return false;

  const currentModule = modules[moduleIndex];
  const lessons = currentModule.lessons || [];
  const lessonIndex = lessons.findIndex(l => l.id === lessonId);
  if (lessonIndex === -1) return false;

  // Check if this is the last lesson in the last module
  const isLastLessonInModule = lessonIndex === lessons.length - 1;
  const isLastModule = moduleIndex === modules.length - 1;

  return isLastModule && isLastLessonInModule;
}

// Check if lesson is locked based on progress
function checkLessonLocked(track: Track | null, moduleId: string, lessonId: string, userProgress: any[], trackId: string): boolean {
  if (!track || !moduleId || !lessonId || !userProgress || !trackId) {
    return false;
  }

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
  let previousLessonModuleId;

  if (lessonIndex > 0) {
    // Previous lesson in the same module
    previousLessonId = lessons[lessonIndex - 1].id;
    previousLessonModuleId = moduleId;
  } else if (moduleIndex > 0) {
    // Last lesson of the previous module
    const prevModule = modules[moduleIndex - 1];
    const prevModuleLessons = prevModule.lessons || [];
    if (prevModuleLessons.length > 0) {
      previousLessonId = prevModuleLessons[prevModuleLessons.length - 1].id;
      previousLessonModuleId = prevModule.id;
    }
  }

  if (!previousLessonId) return false;

  // Check if that specific previous lesson is completed
  const previousProgress = userProgress.find((p: any) =>
    p.track_id === trackId &&
    p.module_id === previousLessonModuleId &&
    p.lesson_id === previousLessonId
  );

  // The lesson is locked if the previous lesson is NOT completed
  return previousProgress?.status !== 'completed';
}

export default function Lesson() {
  const navigate = useNavigate();
  const { trackId = "", moduleId = "", lessonId = "" } = useParams();
  const [track, setTrack] = useState<Track | null>(null);
  const [lesson, setLesson] = useState<LessonContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [userProgress, setUserProgress] = useState<any[]>([]);
  // const [showPlayground, setShowPlayground] = useState(false);

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

    // Reset navigating state when component mounts
    setNavigating(false);

    (async () => {
      // Debug authentication
      // const token = localStorage.getItem("auth_token");
      // console.log('Lesson data loading useEffect - Auth token:', token ? 'Present' : 'Missing');

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
        // Small delay to ensure API has time to update after previous lesson completion
        await new Promise(resolve => setTimeout(resolve, 500));
        const progressData = await apiGetProgress();
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
        // console.warn('Could not load user progress:', error);
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
      } catch (e) {
        console.warn('Could not clear progress cache:', e);
      }
    };
  }, [trackId, moduleId, lessonId]);





  const moduleList: TrackModule[] = useMemo(() => track?.modules || [], [track]);
  const progress = useMemo(() => formatProgress(track, { moduleId, lessonId }, userProgress), [track, moduleId, lessonId, userProgress]);

  // Compute if current lesson is locked
  const lessonLocked = useMemo(() => {
    return checkLessonLocked(track, moduleId, lessonId, userProgress, trackId);
  }, [track, moduleId, lessonId, userProgress, trackId]);

  // Check if next lesson is locked
  const nextLessonLocked = useMemo(() => {
    const nextLesson = lesson?.next || findNextLesson(track, moduleId, lessonId);
    if (!nextLesson) return false;
    return checkLessonLocked(track, nextLesson.moduleId, nextLesson.lessonId, userProgress, trackId);
  }, [lesson, track, moduleId, lessonId, userProgress, trackId]);

  // Check if prev lesson exists and is accessible
  const hasPrevLesson = useMemo(() => {
    return !!(lesson?.prev || findPrevLesson(track, moduleId, lessonId));
  }, [lesson, track, moduleId, lessonId]);

  // Check if next lesson exists and is accessible
  const hasNextLesson = useMemo(() => {
    const nextLesson = lesson?.next || findNextLesson(track, moduleId, lessonId);
    return !!nextLesson && !nextLessonLocked;
  }, [lesson, track, moduleId, lessonId, nextLessonLocked]);

  // Update lesson status to in_progress when lesson loads (if not locked)
  useEffect(() => {
    if (track && moduleId && lessonId && !lessonLocked && userProgress && trackId) {
      const updateProgress = async () => {
        try {
          await apiSetLessonProgress({ trackId, moduleId, lessonId, status: "in_progress" });
        } catch (error) {
          console.error('Failed to set lesson progress to in_progress:', error);
        }
      };

      // Only update if not already completed
      const currentLessonProgress = userProgress.find((p: any) =>
        p.track_id === trackId && p.module_id === moduleId && p.lesson_id === lessonId
      );

      if (currentLessonProgress?.status !== 'completed') {
        updateProgress();
      }
    }
  }, [track, moduleId, lessonId, lessonLocked, userProgress, trackId]);

  // Compute if current lesson is completed
  const lessonCompleted = useMemo(() => {

    if (!trackId || !moduleId || !lessonId || !userProgress) {
      return false;
    }

    const progress = userProgress.find((p: any) =>
      p.track_id === trackId && p.module_id === moduleId && p.lesson_id === lessonId
    );

    const isCompleted = progress?.status === 'completed';
    return isCompleted;
  }, [trackId, moduleId, lessonId, userProgress]);

  // Compute if there is a previous lesson
  // Compute if there is a previous lesson
  {/* const hasPrevLesson = useMemo(() => {
    return !!lesson?.prev || !!findPrevLesson(track, moduleId, lessonId);
  }, [lesson, track, moduleId, lessonId]); 

  // Compute if there is a next lesson
  const hasNextLesson = useMemo(() => {
    return !!lesson?.next || !!findNextLesson(track, moduleId, lessonId);
  }, [lesson, track, moduleId, lessonId]); */}

  // Helper function to handle API calls for marking lesson complete
  const markLessonCompleteApi = async () => {
    // Validate authentication
    let userInfo;
    try {
      userInfo = await apiMe();
    } catch {
      try {
        userInfo = await apiMeCookie();
      } catch (authError) {
        console.error('Authentication failed during completion:', authError);
        throw new Error('Unauthorized');
      }
    }

    // Mark lesson as completed via API
    const result = await apiSetLessonProgress({ trackId, moduleId, lessonId, status: "completed" });

    // Update local progress state
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
    setUserProgress(updatedProgress);

    return result;
  };

  // Function to refresh progress data with retry logic
  const refreshProgress = async () => {
    const maxRetries = 3;
    let retries = 0;

    while (retries < maxRetries) {
      try {
        // Small delay to ensure API has updated
        await new Promise(resolve => setTimeout(resolve, 300));
        const progressData = await apiGetProgress();

        // Only update if we got valid data
        if (progressData && progressData.progress !== undefined) {
          setUserProgress(progressData.progress || []);
          // Update cache with fresh data
          try {
            localStorage.setItem('userProgressCache', JSON.stringify(progressData.progress || []));
          } catch (e) {
            console.warn('Could not update progress cache:', e);
          }
          break; // Success, exit retry loop
        }
      } catch (error) {
        retries++;
        console.warn(`Failed to refresh progress (attempt ${retries}/${maxRetries}):`, error);

        // If this was the last attempt, show an error
        if (retries >= maxRetries) {
          console.error('Failed to refresh progress after all retries:', error);
        }
      }
    }
  };

  // Helper function to handle navigation after lesson completion
  const navigateAfterComplete = async () => {
    // Refresh progress data to ensure it's up to date
    await refreshProgress();

    // Small additional delay to ensure API has fully processed the completion
    await new Promise(resolve => setTimeout(resolve, 200));

    // Check if this is actually the last lesson in the track
    const isLastLessonCheck = !lesson?.next && !findNextLesson(track, moduleId, lessonId);

    if (lesson?.next) {
      setNavigating(true);
      navigate(`/learning/${lesson.next.trackId}/${lesson.next.moduleId}/${lesson.next.lessonId}`);
    } else if (isLastLessonCheck) {
      // Only show final lesson message if this is truly the last lesson
      toast({
        title: 'Congratulations!',
        description: 'You have completed the final lesson in this track.',
        variant: 'default',
      });
    } else {
      // Try to compute next lesson manually as fallback
      const nextLesson = findNextLesson(track, moduleId, lessonId);
      if (nextLesson) {
        setNavigating(true);
        navigate(`/learning/${nextLesson.trackId}/${nextLesson.moduleId}/${nextLesson.lessonId}`);
        return;
      }

      // If we can't compute next lesson, show a generic completion message
      toast({
        title: 'Continuing to next lesson',
        description: 'Lesson completed! Continuing to next lesson...',
        variant: 'default',
      });
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Skip keyboard shortcuts if user is typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return;
      }
      
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
    const prevLesson = lesson?.prev || findPrevLesson(track, moduleId, lessonId);
    if (prevLesson && !navigating) {
      setNavigating(true);
      navigate(`/learning/${prevLesson.trackId}/${prevLesson.moduleId}/${prevLesson.lessonId}`);
    }
  };

  // Compute next lesson navigation
  const goNext = () => {
    const nextLesson = lesson?.next || findNextLesson(track, moduleId, lessonId);
    if (!nextLesson || navigating) return;
    
    // Check if next lesson is locked
    const isLocked = checkLessonLocked(track, nextLesson.moduleId, nextLesson.lessonId, userProgress, trackId);
    if (isLocked) {
      toast({
        title: "Lesson Locked",
        description: "Please complete the previous lesson before accessing this one.",
        variant: "destructive",
      });
      return;
    }
    
    setNavigating(true);
    navigate(`/learning/${nextLesson.trackId}/${nextLesson.moduleId}/${nextLesson.lessonId}`);
  };



  const markComplete = async () => {
    if (!lesson) return;

    // Debug authentication
    // const token = localStorage.getItem("auth_token");
    // console.log('Mark complete - Auth token:', token ? 'Present' : 'Missing');

    // Don't allow marking a completed lesson again
    if (lessonCompleted) {
      // Navigate to next lesson if available
      const nextLesson = lesson?.next || findNextLesson(track, moduleId, lessonId);
      if (nextLesson) {
        setNavigating(true);
        navigate(`/learning/${nextLesson.trackId}/${nextLesson.moduleId}/${nextLesson.lessonId}`);
        return;
      }

      // If we can't compute next lesson, show a message
      toast({
        title: 'Already Completed',
        description: 'You have already completed this lesson.',
        variant: 'default',
      });
      return;
    }

    // Don't allow marking a locked lesson
    if (lessonLocked) {
      toast({
        title: 'Lesson Locked',
        description: 'This lesson is locked. Please complete the previous lessons first.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      // 1. Mark lesson as completed via API
      await markLessonCompleteApi();

      // 2. Navigate to next lesson
      await navigateAfterComplete();

    } catch (e: any) {
      console.error('Failed to mark lesson complete:', e);

      // Provide more specific error messages
      let errorMessage = 'Failed to save your progress.';

      if (e?.message?.includes('Unauthorized')) {
        errorMessage = 'Your session has expired. Please log in again to save your progress.';
        localStorage.removeItem('auth_token');
        toast({
          title: 'Session Expired',
          description: errorMessage,
          variant: 'destructive',
        });
        window.location.href = '/login';
        return;
      } else if (e?.message?.includes('Network') || e?.message?.includes('Failed to fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
        toast({
          title: 'Network Error',
          description: errorMessage,
          variant: 'destructive',
        });
      } else if (e?.message) {
        errorMessage = `Error: ${e.message}`;
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: 'An unexpected error occurred while saving your progress.',
          variant: 'destructive',
        });
      }
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

    // Unified lesson rendering for all types
    return (
        <div className="space-y-6">
          {/* Render content based on lesson type */}
          {(() => {
            switch(current.type) {
              case "video":
                const isMp4 = (current.videoUrl || "").endsWith(".mp4");
                return (
                  <>
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
                    {current?.content && (
                      <div className="space-y-4 mt-4">
                        <div className="border-l-4 border-brand-500 pl-4">
                          <h3 className="font-semibold mb-2">Lesson Overview</h3>
                          <div className="flex items-center gap-4 mb-6">
                          <Input
                            placeholder="Search content..."
                            value={transcriptQuery}
                            onChange={(e) => setTranscriptQuery(e.target.value)}
                            ref={searchInputRef}
                            className="text-sm"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setTranscriptQuery("")}
                            className="h-8"
                          >
                            Clear
                          </Button>
                          
                        </div>
                          {(() => {
                            const contentHtml = mdToHtml(current.content);
                            if (!transcriptQuery.trim()) {
                              return (
                                <div
                                  className="prose prose-sm max-w-none"
                                  dangerouslySetInnerHTML={{ __html: contentHtml }}
                                />
                              );
                            }
                            // Filter content by search query
                            const query = transcriptQuery.toLowerCase();
                            const tempDiv = document.createElement('div');
                            tempDiv.innerHTML = contentHtml;
                            const textContent = tempDiv.textContent || '';
                            if (textContent.toLowerCase().includes(query)) {
                              // Highlight matching text
                              const regex = new RegExp(`(${transcriptQuery})`, 'gi');
                              const highlighted = contentHtml.replace(regex, '<mark>$1</mark>');
                              return (
                                <div
                                  className="prose prose-sm max-w-none"
                                  dangerouslySetInnerHTML={{ __html: highlighted }}
                                />
                              );
                            } else {
                              return (
                                <div className="text-sm text-muted-foreground">
                                  No results found for "{transcriptQuery}"
                                </div>
                              );
                            }
                          })()}
                        </div>
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground border-t pt-4">
                      💡 <strong>Pro tip:</strong> Use the Transcript and Notes panels to the right. Press{' '}
                      <kbd className="bg-muted px-1 rounded text-xs">/</kbd> to search transcript,{' '}
                      <kbd className="bg-muted px-1 rounded text-xs">N</kbd> to focus notes.
                    </p>
                   {/* Sandbox */}
               <SandboxPlayground lessonId={lessonId}/>
                  </>
                );

              case "text":
                return (
                  <>
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
                  </>
                );

              case "sandbox":
              case "playground":
                return (
                  <>
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
                          const codeMatch = current.content.match(/```[\w]*\n([[\\\\s\\\\S]*?S]*?)```/);
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
                                  <SandboxPlayground lessonId={lessonId}/>
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
                      <>
                        <div className="text-center py-6">
                          <Code className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                          <h3 className="font-semibold text-lg mb-2">{current.title}</h3>
                          <p className="text-muted-foreground mb-4">Interactive exercise with Playground</p>
                        </div>

                        {current.content && (
                          <div className="prose prose-gray dark:prose-invert max-w-none border-t pt-6">
                            <div dangerouslySetInnerHTML={{ __html: mdToHtml(current.content) }} />
                          </div>
                        )}
                      </>
                    )}
                  </>
                );

              case "quiz":
              case "assessment":
                return (
                  <>
                    <div className="text-center py-12">
                      <HelpCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-semibold text-lg mb-2">{current.title}</h3>
                      <p className="text-muted-foreground mb-4">Interactive quiz feature coming soon.</p>
                      <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-4 max-w-sm mx-auto">
                        This will include knowledge checks, practical assessments, and progress validation.
                      </div>
                    </div>
                  </>
                );

              default:
                return (
                  <>
                    <div className="text-center py-12">
                      <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-semibold text-lg mb-2">{current.title}</h3>
                      <p className="text-muted-foreground mb-4">Lesson type "{current.type}" is not yet supported.</p>
                      <div className="text-sm text-muted-foreground">
                        Please contact support or check back later.
                      </div>
                    </div>
                  </>
                );
            }
          })()}

          {/* Playground - Always render when showPlayground is true */}
        {/*}  {showPlayground && (
            <div className="my-6">
              <Playground
                initialPrompt={current?.content ? extractPromptFromContent(current.content) : current?.title || ""}
                onClose={() => setShowPlayground(false)}
              />
            </div>
          )} */}
        </div>
      );
  };

  const transcriptText = (() => {
    if (!current) return "";
    
    // For video lessons, we want to use content as additional material
    if (current.type === "video") {
      // Return content - this could be transcript, summary, or additional notes
      // Clean up any problematic markdown that might cause layout issues
      const cleanContent = (current.content || "")
        .replace(/^\s*#+\s*/gm, '\n') // Remove leading markdown headers
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold formatting
        .replace(/`(.*?)`/g, '$1') // Remove inline code formatting
        .trim();
      return cleanContent;
    }
    
    return ""; // Only show for video lessons
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
      <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
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
          <div className="flex-1 overflow-y-auto p-6">
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
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button
                          variant="outline"
                          onClick={goPrev}
                          disabled={!hasPrevLesson || navigating}
                          aria-label="Previous lesson"
                          className="bg-black text-white border-white hover:bg-black hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="h-4 w-4 mr-1 text-white" />
                          Prev
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {!hasPrevLesson && (
                      <TooltipContent>
                        <p>No previous lesson available</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button
                          variant="outline"
                          onClick={goNext}
                          disabled={!hasNextLesson || navigating}
                          aria-label="Next lesson"
                          className="bg-black text-white border-white hover:bg-black hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Next
                          <ChevronRight className="h-4 w-4 ml-1 text-white" />
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {!hasNextLesson && (
                      <TooltipContent>
                        <p>{nextLessonLocked ? "Please complete the current lesson first" : "No next lesson available"}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>

                <Button
                  onClick={markComplete}
                  disabled={saving || lessonLocked || lessonCompleted || navigating}
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

            <div className="flex gap-6 min-h-0">
              <div className="flex-1 min-w-0 min-h-0">
                <Card className="h-full">
                  <CardContent className="pt-6 h-full">{renderContent()}</CardContent>
                </Card>
              </div>
              
              <div className="space-y-4 flex-shrink-0 min-h-0">
                {/* Notes panel - always visible */}
                <Card className="w-80 flex-shrink-0">
                  <CardHeader>
                    <CardTitle className="text-lg">Notes</CardTitle>
                    <CardDescription>
                      Personal notes for this lesson
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Textarea
                        placeholder="Add a note..."
                        ref={noteInputRef}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            addNote((e.target as HTMLTextAreaElement).value);
                          }
                        }}
                        className="text-sm min-h-[100px]"
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          const text = noteInputRef.current?.value.trim();
                          if (text) addNote(text);
                        }}
                        className="w-full"
                      >
                        Add Note
                      </Button>
                      
                      <div className="max-h-96 overflow-y-auto space-y-2">
                        {notes.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No notes yet
                          </p>
                        ) : (
                          notes.map((note) => (
                            <div key={note.id} className="p-3 bg-muted/30 rounded-lg border text-sm relative group break-words">
                              <p className="whitespace-pre-wrap break-words">{note.text}</p>
                              <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                                <span>{new Date(note.createdAt).toLocaleString()}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeNote(note.id)}
                                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                                >
                                  <XCircle className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
