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
import { Check, Play, BookOpen, Video, FileText, Code, ChevronLeft, ChevronRight, Search, PlusCircle, Trash2, Award } from "lucide-react";
import type { Track, TrackModule, TrackModuleLesson, LessonContent, LessonType } from "@shared/api";
import { apiGetTrack, apiGetLesson, apiSetLessonProgress } from "@/lib/api";

function isPreviewHost() {
  return false; // Preview mode disabled
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

function formatProgress(track: Track | null, current: { moduleId: string; lessonId: string }) {
  const modules = track?.modules || [];
  const allLessons = modules.flatMap((m) => m.lessons.map((l) => ({ m: m.id, l: l.id })));
  const idx = allLessons.findIndex((x) => x.m === current.moduleId && x.l === current.lessonId);
  const percent = allLessons.length ? Math.round(((idx + 1) / allLessons.length) * 100) : 0;
  return { total: allLessons.length, index: idx + 1, percent };
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
        if (l && (l as any).lesson) setLesson(l);
      } catch { setLesson(null); }
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
  const progress = useMemo(() => formatProgress(track, { moduleId, lessonId }), [track, moduleId, lessonId]);

  const goPrev = () => { if (lesson?.prev) navigate(`/learning/${lesson.prev.trackId}/${lesson.prev.moduleId}/${lesson.prev.lessonId}`); };
  const goNext = () => { if (lesson?.next) navigate(`/learning/${lesson.next.trackId}/${lesson.next.moduleId}/${lesson.next.lessonId}`); };

  const markComplete = async () => {
    if (!lesson) return;
    setSaving(true);
    try {
      await apiSetLessonProgress({ trackId, moduleId, lessonId, status: "completed" });
      if (lesson.next) navigate(`/learning/${lesson.next.trackId}/${lesson.next.moduleId}/${lesson.next.lessonId}`);
    } catch (e: any) {
      alert(e?.message || "Failed to update progress");
    } finally { setSaving(false); }
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
    if (!current) return <div className="text-sm text-muted-foreground">Lesson not found.</div>;
    if (current.type === "video") {
      const isMp4 = (current.videoUrl || "").endsWith(".mp4");
      const [speed, setSpeed] = [undefined, undefined] as any; // placeholder to satisfy lints when using iframe-only
      return (
        <div className="space-y-4">
          <div className="aspect-video rounded-md overflow-hidden border border-border/50">
            {isMp4 ? (
              <video className="w-full h-full" controls controlsList="nodownload" src={current.videoUrl} onRateChange={(e)=>{}}>
                Sorry, your browser doesn't support embedded videos.
              </video>
            ) : (
              <iframe className="w-full h-full" src={current.videoUrl || ""} title={current.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
            )}
          </div>
          <p className="text-sm text-muted-foreground">Use the Transcript and Notes panels to the right. Press / to search transcript, N to focus notes.</p>
        </div>
      );
    }
    if (current.type === "text") {
      return (
        <div className="prose prose-sm max-w-none whitespace-pre-wrap" aria-label="Reading content">{current.content || ""}</div>
      );
    }
    if (current.type === "sandbox") {
      return (
        <div className="space-y-3">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Practice Prompt</CardTitle>
              <CardDescription>Copy to Sandbox and try it out</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted rounded-md p-3 text-xs overflow-auto whitespace-pre-wrap" aria-label="Sandbox prompt">{current.content || ""}</pre>
              <div className="flex gap-2 justify-end mt-3">
                <Button variant="outline" size="sm" onClick={async()=>{ const ok = await copyText(current.content || ""); if(!ok) alert("Failed to copy"); }} aria-label="Copy to clipboard">Copy</Button>
                <Button size="sm" onClick={()=>{ sessionStorage.setItem("sandboxPrompt", current.content || ""); navigate("/sandbox"); }} aria-label="Open in Sandbox">Open in Sandbox</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
    return <div className="text-sm text-muted-foreground">Interactive quiz coming soon.</div>;
  };

  const transcriptText = (() => {
    if (!current) return "";
    if (current.type === "video") {
      return (
        "00:00 Welcome to AI Engineering Basics.\n" +
        "00:15 Today we will cover prompting, iteration, and evaluation.\n" +
        "01:10 Prompt structure: role, task, constraints, examples.\n" +
        "02:30 Tips for evaluation and dataset design.\n" +
        "03:40 Summary and recommended readings."
      );
    }
    return (current.content || "");
  })();

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <LoggedInHeader />
        <div className="h-[calc(100vh-4rem)] flex overflow-hidden">
          <aside className="w-64 bg-muted/30 border-r border-border/40 h-full overflow-y-auto">
            <nav className="p-4 space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  {Array.from({ length: 3 }).map((__, j) => (
                    <Skeleton key={j} className="h-3 w-32 ml-2" />
                  ))}
                </div>
              ))}
            </nav>
          </aside>
          <main className="flex-1 p-6 space-y-4 overflow-y-auto">
            <Skeleton className="h-8 w-72" />
            <Skeleton className="h-5 w-96" />
            <Skeleton className="h-80 w-full" />
          </main>
          <aside className="hidden xl:block w-96 border-l border-border/40 p-4 space-y-3">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <LoggedInHeader />
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        <div className="px-6 py-3 border-b border-border/40 flex items-center gap-4" role="region" aria-label="Progress bar">
          <div className="min-w-24 text-xs text-muted-foreground">{progress.index}/{progress.total}</div>
          <Progress value={progress.percent} className="h-2" />
          <div className="ml-auto flex items-center gap-2">
            <Badge variant="outline" className="hidden sm:inline-flex">{progress.percent}% complete</Badge>
          </div>
        </div>
        <div className="flex flex-1 overflow-hidden">
          <aside className="w-64 bg-muted/30 border-r border-border/40 h-full overflow-y-auto" aria-label="Course outline">
            <nav className="p-4 space-y-4">
              <div className="px-2 text-xs uppercase tracking-wide text-muted-foreground">{track?.title}</div>
              {moduleList.map((m) => (
                <div key={m.id} className="space-y-2">
                  <div className="font-semibold flex items-center gap-2"><BookOpen className="h-4 w-4" />{m.title}</div>
                  <div className="space-y-1">
                    {m.lessons.map((l) => {
                      const active = moduleId === m.id && lessonId === l.id;
                      const Icon = l.type === "video" ? Video : l.type === "sandbox" ? Code : FileText;
                      return (
                        <Link key={l.id} to={`/learning/${trackId}/${m.id}/${l.id}`} className={`flex items-center gap-2 text-sm px-2 py-1 rounded ${active ? "bg-brand-100 text-brand-700" : "text-muted-foreground hover:bg-muted/50"}`}>
                          <Icon className="h-3 w-3" /> {l.title}
                          <span className="ml-auto text-xs text-muted-foreground">{l.durationMin}m</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </aside>

          <main className="flex-1 p-6 space-y-4 overflow-y-auto" role="main" aria-label="Lesson content">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">{current?.title ?? ""}</h1>
                <p className="text-sm text-muted-foreground">{track?.title} • Module {(track?.modules || []).findIndex(x=>x.id===moduleId)+1}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={goPrev} disabled={!lesson?.prev} aria-label="Previous lesson"><ChevronLeft className="h-4 w-4 mr-1" />Prev</Button>
                <Button variant="outline" onClick={goNext} disabled={!lesson?.next} aria-label="Next lesson">Next<ChevronRight className="h-4 w-4 ml-1" /></Button>
                <Button onClick={markComplete} disabled={saving} aria-label="Mark lesson complete"><Check className="h-4 w-4 mr-1" />{saving?"Saving...":"Mark Complete"}</Button>
              </div>
            </div>

            <Card>
              <CardContent className="pt-6">
                {renderContent()}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommended next</CardTitle>
                <CardDescription>Based on this lesson, explore related resources</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Link to="/library" className="block p-3 rounded-md border hover:bg-muted/50">
                  <div className="font-medium">Deep dive: Prompt patterns</div>
                  <div className="text-xs text-muted-foreground">Reading • 10 min</div>
                </Link>
                <Link to="/community" className="block p-3 rounded-md border hover:bg-muted/50">
                  <div className="font-medium">Discuss: Structuring evaluation sets</div>
                  <div className="text-xs text-muted-foreground">Community</div>
                </Link>
                <Link to={lesson?.next ? `/learning/${lesson.next.trackId}/${lesson.next.moduleId}/${lesson.next.lessonId}` : "/learning"} className="block p-3 rounded-md border hover:bg-muted/50">
                  <div className="font-medium">Continue to next lesson</div>
                  <div className="text-xs text-muted-foreground">Stay in the flow</div>
                </Link>
              </CardContent>
            </Card>
          </main>

          <aside className="hidden xl:flex w-96 border-l border-border/40 h-full flex-col">
            <div className="p-4 border-b border-border/40 flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input ref={searchInputRef} value={transcriptQuery} onChange={(e)=> setTranscriptQuery(e.target.value)} placeholder="Search transcript (/)" aria-label="Search transcript" />
            </div>
            <ScrollArea className="p-4 flex-1">
              <div className="space-y-3" aria-label="Transcript">
                {transcriptText.split("\n").filter(Boolean).map((line, i) => (
                  <div key={i} className="text-sm leading-relaxed">{highlight(line, transcriptQuery)}</div>
                ))}
              </div>
              <Separator className="my-4" />
              <div className="space-y-2" aria-label="Notes">
                <div className="flex items-center justify-between">
                  <div className="font-medium">My notes</div>
                  <Badge variant="secondary" className="bg-brand-50 text-brand-700"><Award className="h-3 w-3 mr-1" />+5 XP</Badge>
                </div>
                <Textarea ref={noteInputRef} placeholder="Write a note (N)" className="min-h-[80px]" onKeyDown={(e)=>{ if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { addNote((e.target as HTMLTextAreaElement).value); } }} />
                <div className="flex justify-end">
                  <Button size="sm" onClick={()=> addNote(noteInputRef.current?.value || "")}><PlusCircle className="h-4 w-4 mr-1" />Add note</Button>
                </div>
                <div className="space-y-2">
                  {notes.length === 0 ? (
                    <div className="text-xs text-muted-foreground">No notes yet.</div>
                  ) : (
                    notes.map((n) => (
                      <div key={n.id} className="p-2 rounded-md border">
                        <div className="text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</div>
                        <div className="text-sm whitespace-pre-wrap mt-1">{n.text}</div>
                        <div className="flex justify-end mt-2">
                          <Button variant="outline" size="sm" onClick={()=> removeNote(n.id)} aria-label="Delete note"><Trash2 className="h-4 w-4 mr-1" />Delete</Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </ScrollArea>
          </aside>
        </div>
      </div>
    </div>
  );
}
