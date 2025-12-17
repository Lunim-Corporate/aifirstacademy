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
import { Check, Play, BookOpen, Video, FileText, Code, ChevronLeft, ChevronRight, Search, PlusCircle, Trash2, Award, Target, HelpCircle } from "lucide-react";
import type { Track, TrackModule, TrackModuleLesson, LessonContent, LessonType } from "@shared/api";
import { apiGetTrack, apiGetLesson, apiSetLessonProgress, apiGetProgress, apiMe, apiMeCookie } from "@/lib/api";

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
      type: li % 3 === 0 ? ("video" as LessonType) : li % 3 === 1 ? ("text" as LessonType) : ("sandbox" as LessonType),
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
      content: les.type === "text" || les.type === "sandbox" ?
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

export default function Lesson() {
  const navigate = useNavigate();
  const { trackId = "", moduleId = "", lessonId = "" } = useParams();
  const [track, setTrack] = useState<Track | null>(null);
  const [lesson, setLesson] = useState<LessonContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userProgress, setUserProgress] = useState<any[]>([]);

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
        const progressData = await apiGetProgress();
        if (mounted) {
          setUserProgress(progressData.progress || []);
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
    return () => { mounted = false; };
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
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); if (lesson?.prev) navigate(`/learning/${lesson.prev.trackId}/${lesson.prev.moduleId}/${lesson.prev.lessonId}`); }
      if (e.key === "ArrowRight") { e.preventDefault(); if (lesson?.next) navigate(`/learning/${lesson.next.trackId}/${lesson.next.moduleId}/${lesson.next.lessonId}`); }
      if (e.key === "/") { e.preventDefault(); searchInputRef.current?.focus(); }
      if (e.key.toLowerCase() === "n") { e.preventDefault(); noteInputRef.current?.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lesson, navigate]);

  useEffect(() => {
    (async () => {
      try { await apiSetLessonProgress({ trackId, moduleId, lessonId, status: "in_progress" }); } catch {}
    })();
  }, [trackId, moduleId, lessonId]);

  const moduleList: TrackModule[] = useMemo(() => track?.modules || [], [track]);
  const progress = useMemo(() => formatProgress(track, { moduleId, lessonId }, userProgress), [track, moduleId, lessonId, userProgress]);

  const goPrev = () => { if (lesson?.prev) navigate(`/learning/${lesson.prev.trackId}/${lesson.prev.moduleId}/${lesson.prev.lessonId}`); };
  const goNext = () => { if (lesson?.next) navigate(`/learning/${lesson.next.trackId}/${lesson.next.moduleId}/${lesson.next.lessonId}`); };

  const markComplete = async () => {
    if (!lesson) return;
    setSaving(true);
    
    try {
      console.log('Marking lesson complete:', { trackId, moduleId, lessonId });
      
      // Verify authentication before making the request
      let userInfo;
      try {
        userInfo = await apiMe();
        console.log('User authenticated for completion:', userInfo.id);
      } catch {
        try {
          userInfo = await apiMeCookie();
          console.log('User authenticated via cookie for completion:', userInfo.id);
        } catch (authError) {
          console.error('Authentication failed during completion:', authError);
          alert('Your session has expired. Please log in again to save your progress.');
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
          return;
        }
      }
      
      // Mark lesson as completed
      console.log('Setting lesson progress to completed...');
      const result = await apiSetLessonProgress({ trackId, moduleId, lessonId, status: "completed" });
      console.log('Lesson marked complete successfully:', result);
      
      // Update local progress state to reflect completion immediately
      if (result.progress) {
        setUserProgress(result.progress);
      }
      
      // Show success message
      const successMessage = current?.title ? 
        `Congratulations! You've completed "${current.title}".` :
        'Lesson completed successfully!';
      
      // Optional: Show a brief success indicator
      const markBtn = document.querySelector('[aria-label="Mark lesson complete"]') as HTMLButtonElement;
      if (markBtn) {
        const originalContent = markBtn.innerHTML;
        markBtn.innerHTML = '<svg class="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>Completed!';
        setTimeout(() => {
          markBtn.innerHTML = originalContent;
        }, 2000);
      }
      
      // Navigate to next lesson if available, otherwise stay on current page
      if (lesson.next) {
        // Small delay to let user see the success state
        setTimeout(() => {
          navigate(`/learning/${lesson.next.trackId}/${lesson.next.moduleId}/${lesson.next.lessonId}`);
        }, 1500);
      } else {
        // No next lesson - show completion message and option to return to learning path
        setTimeout(() => {
          const continueToOverview = confirm(
            successMessage + ' This was the last lesson in the sequence. Would you like to return to the learning path overview?'
          );
          if (continueToOverview) {
            navigate('/learning');
          }
        }, 2000);
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
         className="bg-luminous black-white hover:bg-luminous/90"
        variant="default"
        onClick={() => {
          sessionStorage.removeItem("sandboxPrompt"); // ensure prompt is empty
          navigate("/sandbox");
        }}
        aria-label="Open Sandbox"
      >
        <Play className="h-4 w-4 mr-1" />Open Sandbox
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
        </div>
      );
    }

    // Enhanced sandbox lessons with better UX
    if (current.type === "sandbox") {
      return (
        <div className="space-y-6">
          {current.content ? (
            <>
              {/* Lesson instructions */}
              <div className="bg-brand-50 dark:bg-brand-950/50 border border-brand-200 dark:border-brand-800 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <Code className="h-6 w-6 text-brand-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-brand-900 dark:text-brand-100 mb-2">Interactive Exercise</h3>
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
                        Copy this prompt to the Sandbox and experiment with it
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted rounded-md p-4 font-mono text-sm overflow-auto max-h-64" aria-label="Sandbox prompt">
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
                            sessionStorage.setItem("sandboxPrompt", promptContent); 
                            navigate("/sandbox"); 
                          }} 
                          aria-label="Open in Sandbox"
                        >
                          <Play className="h-4 w-4 mr-1" />Open in Sandbox
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
            <div className="text-center py-12">
              <Code className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">{current.title}</h3>
              <p className="text-muted-foreground mb-4">Interactive exercise content is being prepared.</p>
              <Button variant="outline" onClick={() => navigate("/sandbox")}>
                <Code className="h-4 w-4 mr-2" />Go to Sandbox
              </Button>
            </div>
          )}
        </div>
      );
    }

    // Quiz/Assessment lessons
    if (current.type === "quiz" || current.type === "assessment") {
      return (
        <div className="text-center py-12">
          <HelpCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-2">{current.title}</h3>
          <p className="text-muted-foreground mb-4">Interactive quiz feature coming soon.</p>
          <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-4 max-w-sm mx-auto">
            This will include knowledge checks, practical assessments, and progress validation.
          </div>
        </div>
      );
    }

    // Fallback for unknown lesson types
    return (
      <div className="text-center py-12">
        <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="font-semibold text-lg mb-2">{current.title}</h3>
        <p className="text-muted-foreground mb-4">Lesson type "{current.type}" is not yet supported.</p>
        <div className="text-sm text-muted-foreground">
          Please contact support or check back later.
        </div>
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
                  disabled={saving}
                  aria-label="Mark lesson complete"
                >
                  <Check className="h-4 w-4 mr-1" />
                  {saving ? "Saving..." : "Mark Complete"}
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