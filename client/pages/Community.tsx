import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import LoggedInHeader from "@/components/LoggedInHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BrainCircuit,
  Home,
  BookOpen,
  Code,
  Library,
  Users,
  Award,
  Settings,
  Search,
  MessageCircle,
  Share,
  Bookmark,
  Star,
  Crown,
  ThumbsUp,
  Eye,
  Pin,
  Plus,
  Copy,
  Trophy,
  Check,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { copyText } from "@/lib/utils";
import type { CommunityPrompt, Discussion, Challenge, ChallengeWithEntries } from "@shared/api";
import {
  apiCreateDiscussion,
  apiCreateDiscussionReply,
  apiCreatePromptComment,
  apiGetChallenge,
  apiLikeEntry,
  apiLikePrompt,
  apiListDiscussionReplies,
  apiListDiscussions,
  apiListPrompts,
  apiListPromptComments,
  apiListChallenges,
  apiSaveEntry,
  apiSavePrompt,
  apiSubmitChallengeEntry,
  apiViewDiscussion,
  apiViewEntry,
  apiViewPrompt,
  apiCreatePrompt,
  apiUpdatePrompt,
  apiDeletePrompt,
  apiUpdateDiscussion,
  apiDeleteDiscussion,
} from "@/lib/api";

function SharePromptForm({ onCreated }: { onCreated: (p: CommunityPrompt) => void }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [tags, setTags] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  return (
    <div className="space-y-3">
      <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <Textarea placeholder="Content" value={content} onChange={(e) => setContent(e.target.value)} className="min-h-[160px]" />
      <Select value={difficulty} onValueChange={(v: any) => setDifficulty(v)}>
        <SelectTrigger>
          <SelectValue placeholder="Difficulty" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="beginner">Beginner</SelectItem>
          <SelectItem value="intermediate">Intermediate</SelectItem>
          <SelectItem value="advanced">Advanced</SelectItem>
        </SelectContent>
      </Select>
      <Input placeholder="Tags (comma separated)" value={tags} onChange={(e) => setTags(e.target.value)} />
      <DialogClose asChild>
        <button ref={closeRef} className="hidden" aria-hidden="true" />
      </DialogClose>
      <div className="flex justify-end">
        <Button disabled={submitting} onClick={async () => {
          if (!title.trim() || !content.trim()) {
            alert("Please fill in title and content.");
            return;
          }
          const token = localStorage.getItem("auth_token");
          if (!token) {
            alert("Please sign in to share a prompt.");
            return;
          }
          setSubmitting(true);
          try {
            const body = { title, content, difficulty, tags: tags.split(",").map((t) => t.trim()).filter(Boolean) } as any;
            const { prompt } = await apiCreatePrompt(body);
            onCreated(prompt);
            setTitle("");
            setContent("");
            setTags("");
            if (closeRef.current) closeRef.current.click();
          } catch (e: any) {
            const msg = (e?.message || "Failed to create prompt").toLowerCase();
            if (msg.includes("unauthorized") || msg.includes("401")) alert("Please sign in to share a prompt.");
            else alert(e?.message || "Failed to create prompt");
          } finally {
            setSubmitting(false);
          }
        }}>{submitting ? "Creating..." : "Create"}</Button>
      </div>
    </div>
  );
}

const sidebarItems = [
  { icon: Home, label: "Dashboard", href: "/dashboard" },
  { icon: BookOpen, label: "Learning Path", href: "/learning" },
  { icon: Code, label: "Sandbox", href: "/sandbox" },
  { icon: Library, label: "Library", href: "/library" },
  { icon: Users, label: "Community", href: "/community", active: true },
  { icon: Award, label: "Certificates", href: "/certificates" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export default function Community() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [sortBy, setSortBy] = useState("popular");
  const [tab, setTab] = useState<"gallery"|"discussions"|"challenges">("gallery");

  const [prompts, setPrompts] = useState<CommunityPrompt[] | null>(null);
  const [discussions, setDiscussions] = useState<Discussion[] | null>(null);
  const [challenges, setChallenges] = useState<Challenge[] | null>(null);
  const [activeChallenge, setActiveChallenge] = useState<ChallengeWithEntries | null>(null);

  const [loading, setLoading] = useState({ prompts: true, discussions: true, challenges: true });
  const [error, setError] = useState<string | null>(null);

  const [commentOpenFor, setCommentOpenFor] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [commentsMap, setCommentsMap] = useState<Record<string, { id: string; content: string; createdAt: string }[]>>({});

  const [startDiscOpen, setStartDiscOpen] = useState(false);
  const [discTitle, setDiscTitle] = useState("");
  const [discCategory, setDiscCategory] = useState("General");
  const [discContent, setDiscContent] = useState("");
  const [discSubmitting, setDiscSubmitting] = useState(false);

  const [entryOpen, setEntryOpen] = useState(false);
  const [editPrompt, setEditPrompt] = useState<CommunityPrompt | null>(null);
  const [editPromptTitle, setEditPromptTitle] = useState("");
  const [editPromptContent, setEditPromptContent] = useState("");
  const [editDiscussion, setEditDiscussion] = useState<Discussion | null>(null);
  const [editDiscussionTitle, setEditDiscussionTitle] = useState("");
  const [editDiscussionCategory, setEditDiscussionCategory] = useState("");
  const [entryTitle, setEntryTitle] = useState("");
  const [entryContent, setEntryContent] = useState("");

  const [selectedDiscussion, setSelectedDiscussion] = useState<Discussion | null>(null);
  const [discussionReplies, setDiscussionReplies] = useState<{ id: string; content: string; authorId: string; createdAt: string }[]>([]);
  const [replyContent, setReplyContent] = useState("");
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [discussionDialogOpen, setDiscussionDialogOpen] = useState(false);

  const [challengeDialogOpen, setChallengeDialogOpen] = useState(false);
  const [selectedChallengeForView, setSelectedChallengeForView] = useState<ChallengeWithEntries | null>(null);

  const authorNames = useMemo(() => {
    const map = new Map<string, string>();
    (Array.isArray(prompts) ? prompts : []).forEach(p => { if (p.authorId) map.set(p.authorId, (p as any).authorName || map.get(p.authorId) || `User ${p.authorId.slice(-4)}`); });
    (Array.isArray(discussions) ? discussions : []).forEach(d => { if (d.authorId) map.set(d.authorId, (d as any).authorName || map.get(d.authorId) || `User ${d.authorId.slice(-4)}`); });
    return map;
  }, [prompts, discussions]);

  const getAuthorInitials = (authorId: string, authorName?: string) => {
    const name = authorName || authorNames.get(authorId) || `User ${authorId.slice(-4)}`;
    const nameParts = name.split(' ').filter(Boolean);
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const topContributors = useMemo(() => {
    type Stat = { id: string; score: number; prompts: number; discussions: number; entries: number; likes: number; saves: number; views: number; runs: number };
    const add = (m: Map<string, Stat>, id: string): Stat => {
      if (!m.has(id)) m.set(id, { id, score: 0, prompts: 0, discussions: 0, entries: 0, likes: 0, saves: 0, views: 0, runs: 0 });
      return m.get(id)!;
    };
    const m = new Map<string, Stat>();
    (Array.isArray(prompts) ? prompts : []).forEach(p => {
      const s = add(m, p.authorId);
      s.prompts += 1;
      s.likes += p.likes || 0;
      s.saves += p.saves || 0;
      s.views += p.views || 0;
      s.runs += p.runs || 0;
      s.score += (p.likes || 0) * 3 + (p.saves || 0) * 2 + (p.runs || 0) * 1 + (p.views || 0) * 0.1;
    });
    (Array.isArray(discussions) ? discussions : []).forEach(d => {
      const s = add(m, d.authorId);
      s.discussions += 1;
      s.views += d.views || 0;
      // Weight replies higher to encourage engagement
      s.score += (d.replies || 0) * 2 + (d.views || 0) * 0.05;
    });
    (activeChallenge?.entries || []).forEach(e => {
      const s = add(m, e.authorId);
      s.entries += 1;
      s.likes += e.metrics.likes || 0;
      s.saves += e.metrics.saves || 0;
      s.views += e.metrics.views || 0;
      s.runs += e.metrics.runs || 0;
      s.score += (e.metrics.likes || 0) * 3 + (e.metrics.saves || 0) * 2 + (e.metrics.runs || 0) * 1 + (e.metrics.views || 0) * 0.1;
    });
    const arr = Array.from(m.values()).sort((a, b) => b.score - a.score);
    return arr.slice(0, 5);
  }, [prompts, discussions, activeChallenge]);

  const initialsFromId = (id: string) => (id || "U").split("-").pop()?.slice(0, 2)?.toUpperCase() || "U";
  const isContribLoading = loading.prompts || loading.discussions || loading.challenges;

  useEffect(() => {
    (async () => {
      try {
        setLoading((l) => ({ ...l, prompts: true }));
        const p = await apiListPrompts();
        setPrompts(p.prompts || []);
      } catch (e: any) {
        setError(e.message || "Failed to load prompts");
        setPrompts([]);
      } finally {
        setLoading((l) => ({ ...l, prompts: false }));
      }
      try {
        setLoading((l) => ({ ...l, discussions: true }));
        const d = await apiListDiscussions();
        setDiscussions(d.discussions || []);
      } catch (e: any) {
        setError(e.message || "Failed to load discussions");
        setDiscussions([]);
      } finally {
        setLoading((l) => ({ ...l, discussions: false }));
      }
      try {
        setLoading((l) => ({ ...l, challenges: true }));
        const c = await apiListChallenges();
        setChallenges(c.challenges || []);
        if (c.challenges && c.challenges[0]) {
          const detail = await apiGetChallenge(c.challenges[0].id);
          setActiveChallenge({ ...detail.challenge, entries: detail.challenge.entries || [] });
        }
      } catch (e: any) {
        setError(e.message || "Failed to load challenges");
        setChallenges([]);
      } finally {
        setLoading((l) => ({ ...l, challenges: false }));
      }
    })();
  }, []);

  const filteredPrompts = useMemo(() => {
    const base = Array.isArray(prompts) ? prompts : [];
    let list = base.filter((p) => {
      const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.tags || []).some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesDifficulty = selectedDifficulty === "all" || p.difficulty === selectedDifficulty;
      return matchesSearch && matchesDifficulty;
    });
    list = list.sort((a, b) => {
      switch (sortBy) {
        case "recent":
          return b.createdAt.localeCompare(a.createdAt);
        case "trending":
          return (b.likes || 0) + (b.views || 0) * 0.1 - ((a.likes || 0) + (a.views || 0) * 0.1);
        case "saves":
          return (b.saves || 0) - (a.saves || 0);
        case "popular":
        default:
          return (b.likes || 0) - (a.likes || 0);
      }
    });
    return list;
  }, [prompts, searchQuery, selectedDifficulty, sortBy]);

  const [viewed, setViewed] = useState<Record<string, boolean>>({});
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);
  const copyPrompt = async (id: string, content: string) => {
    const ok = await copyText(content);
    if (ok) {
      setCopiedPromptId(id);
      window.setTimeout(() => setCopiedPromptId((curr) => (curr === id ? null : curr)), 2000);
    } else {
      alert("Failed to copy");
    }
  };
  const tryPrompt = (content: string) => {
    sessionStorage.setItem("sandboxPrompt", content);
    window.location.href = "/sandbox";
  };
  const markViewed = async (id: string) => {
    if (viewed[id]) return;
    await apiViewPrompt(id);
    setViewed((prev) => ({ ...prev, [id]: true }));
    setPrompts((prev) => prev.map((x) => (x.id === id ? { ...x, views: x.views + 1 } : x)));
  };

  const onShare = async () => {
    const url = `${window.location.origin}/community`;
    const ok = await copyText(url);
    if (!ok) alert("Failed to copy link");
  };

  return (
    <div className="min-h-screen bg-background">
      <LoggedInHeader />

      <div className="h-[calc(100vh-4rem)] flex overflow-hidden">
        <aside className="w-64 bg-muted/30 border-r border-border/40 h-full overflow-y-auto">
          <nav className="p-4 space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    item.active ? "bg-brand-100 text-brand-700 border border-brand-200" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-border/40">
            <h3 className="font-semibold mb-3 flex items-center">
              <Trophy className="h-4 w-4 mr-2 text-amber-500" />
              Top Contributors
            </h3>
            <div className="space-y-2">
              {isContribLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between rounded-md p-2">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-2 w-32" />
                      </div>
                    </div>
                    <div className="w-24">
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                ))
              ) : topContributors.length === 0 ? (
                <div className="text-sm text-muted-foreground">No contributors yet.</div>
              ) : (
                topContributors.map((c, idx) => {
                  const pctBase = topContributors[0]?.score || 1;
                  const pct = Math.max(8, Math.min(100, Math.round((c.score / pctBase) * 100)));
                  const rankColor = idx === 0 ? "bg-amber-500" : idx === 1 ? "bg-zinc-300" : idx === 2 ? "bg-orange-400" : "bg-muted";
                  return (
                    <div key={c.id} className="group flex items-center justify-between rounded-md p-2 hover:bg-muted/40 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="h-8 w-8 ring-2 ring-brand-100">
                            <AvatarImage src={`/api/placeholder/32/32?text=${getAuthorInitials(c.id)}`} />
                            <AvatarFallback className="bg-gradient-to-br from-brand-500 to-primary-600 text-white font-semibold text-xs">
                              {getAuthorInitials(c.id, authorNames.get(c.id))}
                            </AvatarFallback>
                          </Avatar>
                          {idx < 3 && (
                            <span className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full ${rankColor} text-[10px] grid place-items-center text-white font-bold`}>{idx + 1}</span>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium leading-tight">{authorNames.get(c.id) || `User ${c.id.slice(-4)}`}</div>
                          <div className="text-xs text-muted-foreground">{c.prompts} prompts · {c.discussions} discussions · {c.entries} entries</div>
                        </div>
                      </div>
                      <div className="w-24">
                        <div className="flex items-center justify-end text-xs font-medium tabular-nums">
                          {Math.round(c.score)}
                        </div>
                        <div className="mt-1 h-1.5 w-full rounded bg-muted overflow-hidden">
                          <div className="h-full rounded bg-brand-600" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto">
          <Tabs value={tab} onValueChange={(v:any)=>setTab(v)} className="h-full">
            <div className="border-b border-border/40 p-6 pb-0">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold">Community</h1>
                  <p className="text-muted-foreground">Share prompts, learn from peers, and collaborate</p>
                  {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
                </div>
                {tab === "gallery" && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="bg-gradient-to-r from-primary-600 to-brand-600 hover:from-primary-700 hover:to-brand-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Share Prompt
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Share a Prompt</DialogTitle>
                      </DialogHeader>
                      <SharePromptForm onCreated={(p) => setPrompts((prev) => [p, ...((prev) || [])])} />
                    </DialogContent>
                  </Dialog>
                )}
                {tab === "discussions" && (
                  <Dialog open={startDiscOpen} onOpenChange={setStartDiscOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-gradient-to-r from-primary-600 to-brand-600 hover:from-primary-700 hover:to-brand-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Start Discussion
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Start Discussion</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3">
                        <Input placeholder="Title" value={discTitle} onChange={(e) => setDiscTitle(e.target.value)} />
                        <Input placeholder="Category" value={discCategory} onChange={(e) => setDiscCategory(e.target.value)} />
                        <Textarea placeholder="Initial content (optional)" value={discContent} onChange={(e) => setDiscContent(e.target.value)} className="min-h-[120px]" />
                        <div className="flex justify-end">
                          <Button disabled={discSubmitting} onClick={async () => {
                            const title = discTitle.trim();
                            const category = discCategory.trim() || "General";
                            const content = discContent.trim();
                            if (!title) { alert("Please enter a title."); return; }
                            const token = localStorage.getItem("auth_token");
                            if (!token) { alert("Please sign in to start a discussion."); return; }
                            setDiscSubmitting(true);
                            try {
                              const { discussion } = await apiCreateDiscussion({ title, category, content });
                              setDiscussions((prev) => [discussion, ...((prev) || [])]);
                              setDiscTitle(""); setDiscCategory("General"); setDiscContent(""); setStartDiscOpen(false);
                            } catch (e: any) {
                              const msg = (e?.message || "Failed to create discussion").toLowerCase();
                              if (msg.includes("unauthorized") || msg.includes("401")) alert("Please sign in to start a discussion.");
                              else alert(e?.message || "Failed to create discussion");
                            } finally { setDiscSubmitting(false); }
                          }}>{discSubmitting ? "Creating..." : "Create"}</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              <TabsList className="grid w-full grid-cols-3 max-w-md">
                <TabsTrigger value="gallery">Prompt Gallery</TabsTrigger>
                <TabsTrigger value="discussions">Discussions</TabsTrigger>
                <TabsTrigger value="challenges">Challenges</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="gallery" className="p-6 space-y-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search prompts..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
                </div>
                <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="All Levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popular">Most Popular</SelectItem>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="trending">Trending</SelectItem>
                    <SelectItem value="saves">Most Saved</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {loading.prompts && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="border-border/50">
                      <CardHeader className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-5 w-16" />
                        </div>
                        <Skeleton className="h-3 w-24" />
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Skeleton className="h-4 w-full" />
                        <div className="flex items-center justify-between">
                          <div className="flex gap-2">
                            <Skeleton className="h-9 w-20" />
                            <Skeleton className="h-9 w-20" />
                          </div>
                          <Skeleton className="h-9 w-16" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(filteredPrompts || []).map((p) => (
                  <Card key={p.id} className="group border-border/50 hover:shadow-lg transition-all" onMouseEnter={() => markViewed(p.id)}>
                    <CardHeader className="space-y-1">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base truncate">{p.title}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="capitalize">{p.difficulty}</Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="text-muted-foreground">⋯</button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setEditPrompt(p);
                                setEditPromptTitle(p.title);
                                setEditPromptContent(p.content);
                              }}>Edit</DropdownMenuItem>
                              <DropdownMenuItem onClick={async () => {
                                if (!confirm("Delete this prompt?")) return;
                                try { await apiDeletePrompt(p.id); setPrompts(prev => prev.filter(x => x.id!==p.id)); } catch(e:any){ alert(e.message||"Delete failed"); }
                              }}>Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={`/api/placeholder/20/20?text=${getAuthorInitials(p.authorId, (p as any).authorName)}`} />
                          <AvatarFallback className="bg-gradient-to-br from-brand-500 to-primary-600 text-white font-semibold text-[10px]">
                            {getAuthorInitials(p.authorId, (p as any).authorName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate max-w-[120px]">{(p as any).authorName || `User ${p.authorId.slice(-4)}`}</span>
                        <span>•</span>
                        <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-xs text-muted-foreground line-clamp-3">{p.content}</p>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-brand-600" onClick={async () => {
                            const { likes } = await apiLikePrompt(p.id);
                            setPrompts((prev) => prev.map((x) => (x.id === p.id ? { ...x, likes: likes ?? x.likes } : x)));
                          }}>
                            <ThumbsUp className="h-4 w-4 mr-1" /> {p.likes ?? 0}
                          </Button>
                          <Dialog
                            open={commentOpenFor === p.id}
                            onOpenChange={async (o) => {
                              if (!o) setCommentOpenFor(null);
                              if (o) {
                                const { comments } = await apiListPromptComments(p.id);
                                setCommentsMap((prev) => ({ ...prev, [p.id]: comments.map((c) => ({ id: c.id, content: c.content, createdAt: c.createdAt })) }));
                              }
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-brand-600" onClick={() => setCommentOpenFor(p.id)}>
                                <MessageCircle className="h-4 w-4 mr-1" /> Comments
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Comments</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-2 max-h-60 overflow-y-auto">
                                {(commentsMap[p.id] || []).map((c) => (
                                  <div key={c.id} className="text-sm">
                                    <div>{c.content}</div>
                                    <div className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleString()}</div>
                                  </div>
                                ))}
                                {(!commentsMap[p.id] || commentsMap[p.id].length === 0) && (
                                  <div className="text-sm text-muted-foreground">No comments yet.</div>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Input placeholder="Write a comment" value={newComment} onChange={(e) => setNewComment(e.target.value)} />
                                <Button onClick={async () => {
                                  if (!newComment.trim()) return;
                                  await apiCreatePromptComment(p.id, newComment.trim());
                                  const { comments } = await apiListPromptComments(p.id);
                                  setCommentsMap((prev) => ({ ...prev, [p.id]: comments.map((c) => ({ id: c.id, content: c.content, createdAt: c.createdAt })) }));
                                  setNewComment("");
                                }}>Post</Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-brand-600" onClick={async () => {
                            const { saves } = await apiSavePrompt(p.id);
                            setPrompts((prev) => prev.map((x) => (x.id === p.id ? { ...x, saves: saves ?? x.saves } : x)));
                          }}>
                            <Bookmark className="h-4 w-4 mr-1" /> {p.saves ?? 0}
                          </Button>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="outline" onClick={() => copyPrompt(p.id, p.content)}>
                            {copiedPromptId === p.id ? (
                              <Check className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          <Button size="sm" onClick={() => tryPrompt(p.content)}>
                            Try It
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="discussions" className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Discussions</h2>
                </div>

                {loading.discussions && (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Card key={i} className="border-border/50">
                        <CardHeader className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-5 w-16" />
                          </div>
                          <Skeleton className="h-3 w-24" />
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <Skeleton className="h-4 w-full" />
                          <div className="flex items-center justify-between">
                            <div className="flex gap-2">
                              <Skeleton className="h-9 w-20" />
                              <Skeleton className="h-9 w-20" />
                            </div>
                            <Skeleton className="h-9 w-16" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {((discussions as Discussion[]) || []).map((d) => (
                    <Card key={d.id} className="group border-border/50 hover:shadow-lg transition-all cursor-pointer" onClick={async () => {
                      try {
                        setLoadingReplies(true);
                        await apiViewDiscussion(d.id);
                        const { replies } = await apiListDiscussionReplies(d.id);
                        setDiscussionReplies(replies);
                        setSelectedDiscussion(d);
                        setDiscussionDialogOpen(true);
                        setDiscussions((prev) => prev.map((x) => (x.id === d.id ? { ...x, views: x.views + 1 } : x)));
                      } catch (e: any) {
                        alert(e.message || "Failed to load discussion");
                      } finally {
                        setLoadingReplies(false);
                      }
                    }}>
                      <CardHeader className="space-y-1">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base truncate flex items-center gap-2">
                            {d.isPinned && <Pin className="h-4 w-4 text-brand-600 flex-shrink-0" />}
                            <span className="truncate">{d.title}</span>
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="capitalize text-xs">{d.category}</Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <button className="text-muted-foreground hover:text-foreground">⋯</button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  setEditDiscussion(d);
                                  setEditDiscussionTitle(d.title);
                                  setEditDiscussionCategory(d.category);
                                }}>Edit</DropdownMenuItem>
                                <DropdownMenuItem onClick={async (e) => {
                                  e.stopPropagation();
                                  if (!confirm("Delete this discussion?")) return;
                                  try { await apiDeleteDiscussion(d.id); setDiscussions(prev => prev.filter(x => x.id!==d.id)); } catch(e:any){ alert(e.message||"Delete failed"); }
                                }}>Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={`/api/placeholder/20/20?text=${getAuthorInitials(d.authorId, (d as any).authorName)}`} />
                            <AvatarFallback className="bg-gradient-to-br from-brand-500 to-primary-600 text-white font-semibold text-[10px]">
                              {getAuthorInitials(d.authorId, (d as any).authorName)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate max-w-[120px]">{(d as any).authorName || `User ${d.authorId.slice(-4)}`}</span>
                          <span>•</span>
                          <span>{new Date(d.lastActivityAt).toLocaleDateString()}</span>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-4 text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <MessageCircle className="h-4 w-4" />
                              <span>{d.replies} replies</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Eye className="h-4 w-4" />
                              <span>{d.views} views</span>
                            </div>
                          </div>
                          <Button size="sm" variant="outline" onClick={(e) => {
                            e.stopPropagation();
                            // This will be handled by the card click
                          }}>
                            View
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="challenges" className="p-6 space-y-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Challenges</h2>
                </div>
                
                {loading.challenges && (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Card key={i} className="border-border/50">
                        <CardHeader className="space-y-2">
                          <Skeleton className="h-5 w-40" />
                          <Skeleton className="h-3 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                          <div className="flex justify-between">
                            <Skeleton className="h-8 w-20" />
                            <Skeleton className="h-8 w-16" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
                
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(Array.isArray(challenges) ? challenges : []).map((c) => {
                    const isActive = new Date() >= new Date(c.startAt) && new Date() <= new Date(c.endAt);
                    const isUpcoming = new Date() < new Date(c.startAt);
                    const isEnded = new Date() > new Date(c.endAt);
                    
                    return (
                      <Card key={c.id} className="group border-border/50 hover:shadow-lg transition-all cursor-pointer" onClick={async () => {
                        try {
                          const resp = await apiGetChallenge(c.id);
                          setSelectedChallengeForView({ ...resp.challenge, entries: resp.challenge.entries || [] });
                          setChallengeDialogOpen(true);
                        } catch (e: any) {
                          alert(e.message || "Failed to load challenge");
                        }
                      }}>
                        <CardHeader className="space-y-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base truncate">{c.title}</CardTitle>
                            <Badge variant={isActive ? "default" : isUpcoming ? "secondary" : "outline"} className="text-xs">
                              {isActive ? "Active" : isUpcoming ? "Upcoming" : "Ended"}
                            </Badge>
                          </div>
                          <CardDescription className="text-xs">
                            {new Date(c.startAt).toLocaleDateString()} - {new Date(c.endAt).toLocaleDateString()}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="text-sm text-muted-foreground line-clamp-2">{c.description}</p>
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-muted-foreground">
                              {isActive && <span className="text-green-600 font-medium">• Active Now</span>}
                              {isUpcoming && <span className="text-blue-600 font-medium">• Coming Soon</span>}
                              {isEnded && <span className="text-gray-600 font-medium">• Completed</span>}
                            </div>
                            <Button size="sm" variant="outline">
                              View Details
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Edit Prompt Dialog */}
      <Dialog open={!!editPrompt} onOpenChange={(o)=>!o && setEditPrompt(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Prompt</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Title" value={editPromptTitle} onChange={(e)=>setEditPromptTitle(e.target.value)} />
            <Textarea placeholder="Content" value={editPromptContent} onChange={(e)=>setEditPromptContent(e.target.value)} className="min-h-[160px]" />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={()=>setEditPrompt(null)}>Cancel</Button>
              <Button onClick={async()=>{
                if (!editPrompt) return;
                try {
                  const { prompt } = await apiUpdatePrompt(editPrompt.id, { title: editPromptTitle, content: editPromptContent });
                  setPrompts(prev => prev?.map(x => x.id === prompt.id ? prompt : x) || []);
                  setEditPrompt(null);
                } catch(e:any){ alert(e?.message || "Update failed"); }
              }}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Discussion Dialog */}
      <Dialog open={!!editDiscussion} onOpenChange={(o)=>!o && setEditDiscussion(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Discussion</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Title" value={editDiscussionTitle} onChange={(e)=>setEditDiscussionTitle(e.target.value)} />
            <Input placeholder="Category" value={editDiscussionCategory} onChange={(e)=>setEditDiscussionCategory(e.target.value)} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={()=>setEditDiscussion(null)}>Cancel</Button>
              <Button onClick={async()=>{
                if (!editDiscussion) return;
                try {
                  const { discussion } = await apiUpdateDiscussion(editDiscussion.id, { title: editDiscussionTitle, category: editDiscussionCategory });
                  setDiscussions(prev => prev?.map(x => x.id === discussion.id ? discussion : x) || []);
                  setEditDiscussion(null);
                } catch(e:any){ alert(e?.message || "Update failed"); }
              }}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Discussion View Dialog */}
      <Dialog open={discussionDialogOpen} onOpenChange={setDiscussionDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedDiscussion?.isPinned && <Pin className="h-4 w-4 text-brand-600" />}
              {selectedDiscussion?.title}
            </DialogTitle>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={`/api/placeholder/24/24?text=${selectedDiscussion ? getAuthorInitials(selectedDiscussion.authorId, (selectedDiscussion as any).authorName) : 'U'}`} />
                  <AvatarFallback className="bg-gradient-to-br from-brand-500 to-primary-600 text-white font-semibold text-xs">
                    {selectedDiscussion ? getAuthorInitials(selectedDiscussion.authorId, (selectedDiscussion as any).authorName) : 'U'}
                  </AvatarFallback>
                </Avatar>
                <span>{selectedDiscussion ? ((selectedDiscussion as any).authorName || `User ${selectedDiscussion.authorId.slice(-4)}`) : 'Unknown'}</span>
              </div>
              <span>•</span>
              <Badge variant="secondary">{selectedDiscussion?.category}</Badge>
              <span>•</span>
              <span>{selectedDiscussion ? new Date(selectedDiscussion.lastActivityAt).toLocaleString() : ''}</span>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-4 py-4">
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Replies ({discussionReplies.length})
              </h4>
              
              {loadingReplies ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-start space-x-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-12 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : discussionReplies.length > 0 ? (
                <div className="space-y-4 max-h-60 overflow-y-auto">
                  {discussionReplies.map((reply) => (
                    <div key={reply.id} className="flex items-start space-x-3 p-3 bg-muted/30 rounded-lg">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={`/api/placeholder/32/32?text=${getAuthorInitials(reply.authorId)}`} />
                        <AvatarFallback className="bg-gradient-to-br from-brand-500 to-primary-600 text-white font-semibold text-xs">
                          {getAuthorInitials(reply.authorId)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium">{authorNames.get(reply.authorId) || `User ${reply.authorId.slice(-4)}`}</span>
                          <span className="text-xs text-muted-foreground">{new Date(reply.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{reply.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No replies yet. Be the first to start the conversation!</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="border-t pt-4 space-y-3">
            <h4 className="font-medium">Add a Reply</h4>
            <Textarea 
              placeholder="Write your reply..." 
              value={replyContent} 
              onChange={(e) => setReplyContent(e.target.value)} 
              className="min-h-[80px] resize-none"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDiscussionDialogOpen(false)}>
                Close
              </Button>
              <Button 
                onClick={async () => {
                  if (!replyContent.trim() || !selectedDiscussion) return;
                  try {
                    const { reply } = await apiCreateDiscussionReply(selectedDiscussion.id, replyContent.trim());
                    setDiscussionReplies(prev => [...prev, reply]);
                    setDiscussions(prev => prev.map(x => x.id === selectedDiscussion.id ? { ...x, replies: x.replies + 1, lastActivityAt: new Date().toISOString() } : x));
                    setReplyContent("");
                  } catch (e: any) {
                    alert(e.message || "Failed to post reply");
                  }
                }}
                disabled={!replyContent.trim()}
              >
                Post Reply
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Challenge View Dialog */}
      <Dialog open={challengeDialogOpen} onOpenChange={setChallengeDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedChallengeForView?.title}</span>
              {selectedChallengeForView && (() => {
                const isActive = new Date() >= new Date(selectedChallengeForView.startAt) && new Date() <= new Date(selectedChallengeForView.endAt);
                const isUpcoming = new Date() < new Date(selectedChallengeForView.startAt);
                return (
                  <Dialog open={entryOpen} onOpenChange={setEntryOpen}>
                    <DialogTrigger asChild>
                      <Button disabled={!isActive} size="sm">
                        {isUpcoming ? "Coming Soon" : isActive ? "Submit Entry" : "Challenge Ended"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Submit Entry</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3">
                        <Input placeholder="Title" value={entryTitle} onChange={(e) => setEntryTitle(e.target.value)} />
                        <Textarea placeholder="Content" value={entryContent} onChange={(e) => setEntryContent(e.target.value)} className="min-h-[140px]" />
                        <div className="flex justify-end">
                          <Button onClick={async () => {
                            if (!selectedChallengeForView) return;
                            try {
                              const { entry } = await apiSubmitChallengeEntry(selectedChallengeForView.id, { title: entryTitle, content: entryContent });
                              setSelectedChallengeForView(prev => prev ? { ...prev, entries: [entry, ...(prev.entries || [])] } : prev);
                              setEntryOpen(false);
                              setEntryTitle("");
                              setEntryContent("");
                            } catch (e: any) {
                              alert(e.message || "Failed to submit entry");
                            }
                          }}>Submit</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                );
              })()}
            </DialogTitle>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{selectedChallengeForView?.description}</p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Start: {selectedChallengeForView ? new Date(selectedChallengeForView.startAt).toLocaleString() : ''}</span>
                <span>•</span>
                <span>End: {selectedChallengeForView ? new Date(selectedChallengeForView.endAt).toLocaleString() : ''}</span>
              </div>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto py-4">
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Entries ({selectedChallengeForView?.entries?.length || 0})
              </h4>
              
              {selectedChallengeForView?.entries && selectedChallengeForView.entries.length > 0 ? (
                <div className="grid gap-4">
                  {selectedChallengeForView.entries.map((e) => (
                    <Card key={e.id} className="border-border/50">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{e.title}</CardTitle>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={`/api/placeholder/24/24?text=${getAuthorInitials(e.authorId)}`} />
                              <AvatarFallback className="bg-gradient-to-br from-brand-500 to-primary-600 text-white font-semibold text-xs">
                                {getAuthorInitials(e.authorId)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground">{new Date(e.createdAt).toLocaleString()}</span>
                          </div>
                        </div>
                        <CardDescription className="whitespace-pre-wrap">{e.content}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2 text-sm">
                          <Button size="sm" variant="outline" onClick={async () => {
                            if (!selectedChallengeForView) return;
                            try {
                              const { metrics } = await apiLikeEntry(selectedChallengeForView.id, e.id);
                              setSelectedChallengeForView(prev => prev ? {
                                ...prev,
                                entries: prev.entries.map(x => x.id === e.id ? { ...x, metrics: metrics! } : x)
                              } : prev);
                            } catch (err: any) {
                              console.error('Failed to like entry:', err);
                            }
                          }}>
                            <ThumbsUp className="h-4 w-4 mr-1" /> {e.metrics.likes}
                          </Button>
                          <Button size="sm" variant="outline" onClick={async () => {
                            if (!selectedChallengeForView) return;
                            try {
                              const { metrics } = await apiSaveEntry(selectedChallengeForView.id, e.id);
                              setSelectedChallengeForView(prev => prev ? {
                                ...prev,
                                entries: prev.entries.map(x => x.id === e.id ? { ...x, metrics: metrics! } : x)
                              } : prev);
                            } catch (err: any) {
                              console.error('Failed to save entry:', err);
                            }
                          }}>
                            <Bookmark className="h-4 w-4 mr-1" /> {e.metrics.saves}
                          </Button>
                          <Button size="sm" variant="outline" onClick={async () => {
                            if (!selectedChallengeForView) return;
                            try {
                              const { metrics } = await apiViewEntry(selectedChallengeForView.id, e.id);
                              setSelectedChallengeForView(prev => prev ? {
                                ...prev,
                                entries: prev.entries.map(x => x.id === e.id ? { ...x, metrics: metrics! } : x)
                              } : prev);
                            } catch (err: any) {
                              console.error('Failed to track view:', err);
                            }
                          }}>
                            <Eye className="h-4 w-4 mr-1" /> {e.metrics.views}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No entries yet. Be the first to participate!</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="border-t pt-4 flex justify-end">
            <Button variant="outline" onClick={() => setChallengeDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
