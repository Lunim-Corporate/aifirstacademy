import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Home,
  BookOpen,
  Code,
  Library as LibraryIcon,
  Users,
  Award,
  Settings,
  Search as SearchIcon,
  Filter,
  Star,
  Clock,
  Download,
  Bookmark,
  Plus,
  FileText,
  Video,
  Play,
  Check,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import LoggedInHeader from "@/components/LoggedInHeader";
import { useEffect, useMemo, useState } from "react";
import { copyText } from "@/lib/utils";
import type { CommunityPrompt } from "@shared/api";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";


type LibraryProps = {
  onAddTemplate?: (template: {
    id: string;
    title: string;
    description: string;
    prompt: string;
    variables: string[];
    category: string;
  }) => void;
};

  const categories = ["All", "Text Processing", "Social Media", "Marketing", "Education"];

const sidebarItems = [
  { icon: Home, label: "Dashboard", href: "/dashboard" },
  { icon: BookOpen, label: "Learning Path", href: "/learning" },
  { icon: Code, label: "Sandbox", href: "/sandbox" },
  { icon: LibraryIcon, label: "Library", href: "/library", active: true },
  { icon: Users, label: "Community", href: "/community" },
  { icon: Award, label: "Certificates", href: "/certificates" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

import type { LibraryResource as Resource, ResourceType, GuideResource, VideoResource } from "@shared/api";
import { apiLibraryCreate, apiLibraryDelete, apiLibraryList, apiListSavedPrompts, apiShareTemplate } from "@/lib/api";

type SourcedResource = Resource & { __source: "academy" | "user"; category?: string; tags?: string[] };


export default function Library({ onAddTemplate }: LibraryProps) {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<SourcedResource[]>([]);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<ResourceType | "all">("all");
  const [sort, setSort] = useState("newest");
  const [activeVideo, setActiveVideo] = useState<VideoResource | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [viewItem, setViewItem] = useState<SourcedResource | null>(null);
  const [newType, setNewType] = useState<ResourceType>("prompt");
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [copied, setCopied] = useState<Record<string, boolean>>({});
  const [savedPrompts, setSavedPrompts] = useState<CommunityPrompt[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
 // const [newCategory, setNewCategory] = useState("");
  const [newVariables, setNewVariables] = useState<string>("");
  const navigate = useNavigate();
   const [newDescription, setNewDescription] = useState(""); 
   const [newPrompt, setNewPrompt] = useState("");
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        window.location.replace("/login");
      }
    }
  }, [user, authLoading]); 
   const [newCategory, setNewCategory] = useState(categories[0])



  useEffect(() => {
    (async () => {
      try {
        const resp = await apiLibraryList();
        const academy = Array.isArray(resp?.academy) ? resp.academy : [];
        const user = Array.isArray(resp?.user) ? resp.user : [];
        const merged: SourcedResource[] = [
          ...academy.map((r) => ({ ...r, __source: "academy" as const })),
          ...user.map((r) => ({ ...r, __source: "user" as const })),
        ];
        setItems(merged);
      } catch {
        setItems([]);
      } finally {
        setLoadingList(false);
      }
      try {
        setLoadingSaved(true);
        const token = localStorage.getItem("auth_token");
        if (token) {
          const saved = await apiListSavedPrompts();
          setSavedPrompts(saved.prompts || []);
        } else {
          setSavedPrompts([]);
        }
      } catch {
        setSavedPrompts([]);
      } finally {
        setLoadingSaved(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    let list = items.filter((i) => (typeFilter === "all" ? true : i.type === typeFilter));

    // Filter by category
  if (categoryFilter !== "all") {
    list = list.filter((i: any) => i.category === categoryFilter);
  }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((i) => i.title.toLowerCase().includes(q));
    }
    list.sort((a, b) => (sort === "newest" ? b.createdAt.localeCompare(a.createdAt) : a.title.localeCompare(b.title)));
    return list;
  }, [items, query, typeFilter, sort]);

  const addItem = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    const token = localStorage.getItem("auth_token");
    if (!token) {
      alert("Please sign in to save resources to your library.");
      return;
    }
    let resource: any;
    if (newType === "prompt" || newType === "template") {
      resource = { type: newType, title: newTitle, tags: [], content: newContent, category: newCategory || "General", variables: newVariables.split(",").map(v => v.trim()).filter(Boolean),};
    } else if (newType === "guide") {
      resource = { type: "guide", title: newTitle, tags: [], content: newContent, description: "User guide" };
    } else {
      resource = { type: "video", title: newTitle, tags: [], url: newContent, duration: "" };
    }
    try {
      const { resource: created } = await apiLibraryCreate(resource);
      setItems((prev) => [{ ...created, __source: "user" }, ...prev]);
      setAddOpen(false);
      setNewTitle("");
      setNewContent("");
      setNewCategory("");
      setNewVariables("");

      if (newType === "template" && onAddTemplate) {
  const template = created as {
    id: string;
    title: string;
    description?: string;
    content: string;
    variables?: string[];
    category?: string;
  };

  onAddTemplate({
    id: template.id,
    title: template.title,
    description: template.description || "",
    prompt: template.content,
    variables: template.variables || [],
    category: template.category || "General",
  });
   <Button
      size="sm"
      variant="outline"
      onClick={() => shareTemplateToCommunity(template)}
    >
      Share
    </Button>
}

    } catch (e: any) {
      const msg = (e?.message || "Failed to add resource").toLowerCase();
      if (msg.includes("unauthorized") || msg.includes("401")) {
        alert("Please sign in to save resources to your library.");
      } else {
        alert(e?.message || "Failed to add resource");
      }
    }
  };

  const shareTemplateToCommunity = async (template: any) => {
  const token = localStorage.getItem("auth_token");
  if (!token) {
    alert("Sign in to share templates.");
    return;
  }

  try {
    await apiShareTemplate(template); // call your backend API for sharing
    alert("Template shared successfully!");
  } catch (e: any) {
    alert(e?.message || "Failed to share template");
  }
};


  const useInSandbox = (content: string) => {
    sessionStorage.setItem("sandboxPrompt", content);
    navigate("/sandbox");
  };

  const removeItem = async (id: string) => {
    const target = items.find((i) => i.id === id);
    if (!target || target.__source !== "user") return;
    try {
      await apiLibraryDelete(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (e: any) {
      const msg = (e?.message || "Failed to remove resource").toLowerCase();
      if (msg.includes("unauthorized") || msg.includes("401")) {
        alert("Please sign in to remove items from your library.");
      } else {
        alert(e?.message || "Failed to remove resource");
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <LoggedInHeader />

      <div className="h-[calc(100vh-4rem)] flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-muted/30 border-r border-gray-200 dark:border-gray-700/40 h-full overflow-y-auto">
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
        </aside>

        {/* Main */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Resource Library</h1>
                <p className="text-muted-foreground">Saved prompts, templates, guides, and videos</p>
              </div>
              <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-primary-600 to-brand-600 hover:from-primary-700 hover:to-brand-700">
                    <Plus className="h-4 w-4 mr-2" /> Add to Library
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Resource</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Type</Label>
                        <Select value={newType} onValueChange={(v: ResourceType) => setNewType(v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="prompt">Prompt</SelectItem>
                            <SelectItem value="template">Template</SelectItem>
                            <SelectItem value="guide">Guide</SelectItem>
                            <SelectItem value="video">Video URL</SelectItem>
                          </SelectContent>
                        </Select>
                        <div>
                          <Label>Category</Label>
                          <Input
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            placeholder="E.g., Coding, Debugging, Testing"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Title</Label>
                        <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Resource title" />
                      </div>
                    </div>
                    <div>
                      <Label>{newType === "video" ? "Video URL" : "Content"}</Label>
                      {newType === "video" ? (
                        <Input value={newContent} onChange={(e) => setNewContent(e.target.value)} placeholder="https://..." />
                      ) : (
                        <Textarea value={newContent} onChange={(e) => setNewContent(e.target.value)} placeholder={newType === "guide" ? "Write your guide..." : "Write content or template..."} className="min-h-[160px]" />
                      )}
                    </div>
                    {(newType === "template" || newType === "prompt") && (
                      <div>
                        <Label>Variables (comma-separated)</Label>
                        <Input
                          value={newVariables}
                          onChange={(e) => setNewVariables(e.target.value)}
                          placeholder="E.g., code, language, testing_framework"
                        />
                      </div>
                    )}
                    <div className="flex justify-end">
                      <Button onClick={addItem}>Save</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search library..." className="pl-9" />
              </div>
              <Select value={typeFilter} onValueChange={(v: any) => setTypeFilter(v)}>
                <SelectTrigger
                  className="w-full bg-black text-white border-white hover:bg-black hover:text-white"
                >
                  <SelectValue placeholder="Filter type" />
                </SelectTrigger>
                <SelectContent className="bg-black text-white border-white">
                  <SelectItem value="all" className="hover:bg-primary hover:text-black">
                    All
                  </SelectItem>
                  <SelectItem value="prompt" className="hover:bg-primary hover:text-black">
                    Prompts
                  </SelectItem>
                  <SelectItem value="template" className="hover:bg-primary hover:text-black">
                    Templates
                  </SelectItem>
                  <SelectItem value="guide" className="hover:bg-primary hover:text-black">
                    Guides
                  </SelectItem>
                  <SelectItem value="video" className="hover:bg-primary hover:text-black">
                    Videos
                  </SelectItem>
                </SelectContent>
              </Select>
             <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full bg-black text-white border-white hover:bg-black hover:text-white">
                <SelectValue placeholder="Filter category" />
              </SelectTrigger>
              <SelectContent className="bg-black text-white border-white">
                <SelectItem value="all" className="hover:bg-primary hover:text-black">
                  All
                </SelectItem>
                <SelectItem value="Coding" className="hover:bg-primary hover:text-black">
                  Coding
                </SelectItem>
                <SelectItem value="Debugging" className="hover:bg-primary hover:text-black">
                  Debugging
                </SelectItem>
                <SelectItem value="Testing" className="hover:bg-primary hover:text-black">
                  Testing
                </SelectItem>
                {/* Add more categories as needed */}
              </SelectContent>
            </Select>

              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-full bg-black text-white border-white hover:bg-black hover:text-white">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent className="bg-black text-white border-white">
                  <SelectItem value="newest" className="hover:bg-primary hover:text-black">
                    Newest
                  </SelectItem>
                  <SelectItem value="title" className="hover:bg-primary hover:text-black">
                    Title
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Tabs defaultValue="all" className="space-y-4">
              <TabsList className="flex space-x-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="prompt">Prompts</TabsTrigger>
                <TabsTrigger value="template">Templates</TabsTrigger>
                <TabsTrigger value="guide">Guides</TabsTrigger>
                <TabsTrigger value="video">Videos</TabsTrigger>
                <TabsTrigger value="saved">Saved</TabsTrigger>
              </TabsList>

              {(["all", "prompt", "template", "guide", "video"] as const).map((tab) => (
                <TabsContent key={tab} value={tab}>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(() => {
                      const list = filtered.filter((i) => (tab === "all" ? true : i.type === tab));
                      if (loadingList) {
                        return (
                          Array.from({ length: 6 }).map((_, idx) => (
                            <Card key={idx} className="border-gray-200 dark:border-gray-700/50">
                              <CardHeader className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Skeleton className="h-5 w-40" />
                                  <Skeleton className="h-5 w-16" />
                                </div>
                                <Skeleton className="h-3 w-32" />
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
                          ))
                        );
                      }
                      if (list.length === 0) {
                        return (
                          <div className="col-span-full text-center py-10 text-muted-foreground">
                            No results found.
                          </div>
                        );
                      }
                      return list.map((i) => (
                        <Card key={(i as any).id} className="group border-gray-200 dark:border-gray-700/50 hover:shadow-lg transition-all">
                          <CardHeader className="space-y-1">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base truncate">{i.title}</CardTitle>
                              <Badge variant="secondary" className="capitalize">{i.type}</Badge>
                            </div>
                            {(i as any).__source === "user" ? (
                              <CardDescription className="text-xs flex items-center space-x-2">
                                <Clock className="h-3 w-3" />
                                <span>{new Date(i.createdAt).toLocaleDateString()}</span>
                              </CardDescription>
                            ) : null}
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {i.type === "prompt" || i.type === "template" ? (
                              <div className="text-xs text-muted-foreground line-clamp-3">
                                {(i as any).content}
                              </div>
                            ) : i.type === "guide" ? (
                              <div className="text-xs text-muted-foreground line-clamp-3 whitespace-pre-wrap">
                                {(i as GuideResource).content || (i as GuideResource).description || (i as GuideResource).url || ""}
                              </div>
                            ) : (
                              <div className="text-xs text-muted-foreground">
                                {(i as VideoResource).url}
                              </div>
                            )}
                            <div className="flex items-center justify-between">
                              <div className="flex flex-wrap gap-2 justify-start">
                                {i.type === "prompt" || i.type === "template" ? (
                                  <>
                                    <Button size="sm" onClick={() => setViewItem(i)}>View</Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={async () => {
                                        const ok = await copyText((i as any).content);
                                        if (ok) {
                                          setCopied(prev => ({ ...prev, [(i as any).id]: true }));
                                          window.setTimeout(() => setCopied(prev => ({ ...prev, [(i as any).id]: false })), 2000);
                                        } else {
                                          alert("Failed to copy");
                                        }
                                      }}
                                    >
                                      {copied[(i as any).id] ? (<Check className="h-4 w-4 text-emerald-600" />) : (<>Copy</>)}
                                    </Button>
                                    <Button size="sm" onClick={() => useInSandbox((i as any).content)}>Use in Sandbox</Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => shareTemplateToCommunity(i)}
                                      className="bg-black text-white border-white hover:bg-black hover:text-white"
                                    >
                                      Share
                                    </Button>
                                  </>
                                ) : i.type === "guide" ? (
                                  <>
                                    {(i as GuideResource).content ? (
                                      <Button size="sm" onClick={() => setViewItem(i)}>Read</Button>
                                    ) : (
                                      <Button size="sm" asChild>
                                        <a href={(i as GuideResource).url} target="_blank" rel="noreferrer">Open</a>
                                      </Button>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <Button size="sm" onClick={() => setActiveVideo(i as VideoResource)}>
                                      <Play className="h-4 w-4 mr-1" /> Watch
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={async () => {
                                        const ok = await copyText((i as VideoResource).url);
                                        if (ok) {
                                          setCopied(prev => ({ ...prev, [(i as any).id]: true }));
                                          window.setTimeout(() => setCopied(prev => ({ ...prev, [(i as any).id]: false })), 2000);
                                        } else {
                                          alert("Failed to copy");
                                        }
                                      }}
                                    >
                                      {copied[(i as any).id] ? (<Check className="h-4 w-4 text-emerald-600" />) : (<>Copy URL</>)}
                                    </Button>
                                  </>
                                )}
                              </div>
                              {"__source" in (i as any) && (i as any).__source === "user" ? (
                                <Button size="sm" variant="ghost" onClick={() => removeItem((i as any).id)}>
                                  Remove
                                </Button>
                              ) : (
                                <div />
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ));
                    })()}
                  </div>
                </TabsContent>
              ))}

              <TabsContent value="saved">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {loadingSaved ? (
                    <div className="col-span-full text-center py-10 text-muted-foreground">Loading saved...</div>
                  ) : savedPrompts.length === 0 ? (
                    <div className="col-span-full text-center py-10 text-muted-foreground">
                      {localStorage.getItem("auth_token") ? "No saved prompts yet." : "Sign in to view your saved prompts."}
                    </div>
                  ) : (
                    savedPrompts.map((p) => (
                      <Card key={p.id} className="group border-gray-200 dark:border-gray-700/50 hover:shadow-lg transition-all">
                        <CardHeader className="space-y-1">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base truncate">{p.title}</CardTitle>
                            <Badge variant="secondary" className="capitalize">{p.difficulty}</Badge>
                          </div>
                          <CardDescription className="text-xs flex items-center space-x-2">
                            <Clock className="h-3 w-3" />
                            <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="text-xs text-muted-foreground line-clamp-3">{p.content}</div>
                          <div className="flex items-center justify-between">
                            <div className="space-x-2" />
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline" onClick={async()=>{
                                const ok = await copyText(p.content);
                                if (ok) { setCopied(prev=>({ ...prev, [p.id]: true })); setTimeout(()=> setCopied(prev=>({ ...prev, [p.id]: false })), 2000); }
                                else alert("Failed to copy");
                              }}>
                                {copied[p.id] ? (<Check className="h-4 w-4 text-emerald-600" />) : (<>Copy</>)}
                              </Button>
                              <Button size="sm" onClick={()=>useInSandbox(p.content)}>Use in Sandbox</Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      <Dialog open={!!activeVideo} onOpenChange={(o) => !o && setActiveVideo(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{activeVideo?.title}</DialogTitle>
          </DialogHeader>
          {activeVideo && (
            <div className="aspect-video">
              <iframe
                className="w-full h-full rounded-md"
                src={activeVideo.url}
                title={activeVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewItem} onOpenChange={(o) => !o && setViewItem(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{viewItem?.title}</span>
              {viewItem && (
                <Badge variant="secondary" className="capitalize">{viewItem.type}</Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {viewItem && (
            <div className="space-y-4">
              {(viewItem as any).__source === "user" ? (
                <div className="text-xs text-muted-foreground">{new Date(viewItem.createdAt).toLocaleString()}</div>
              ) : null}
              {viewItem.type === "guide" ? (
                <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                  {(viewItem as any).content || (viewItem as any).description}
                </div>
              ) : (
                <pre className="bg-muted rounded-md p-3 text-xs overflow-auto whitespace-pre-wrap">
{(viewItem as any).content}
                </pre>
              )}
              {viewItem.type === "guide" && (
                <div className="flex gap-2 justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async()=>{
                      const body = (viewItem as any).content || (viewItem as any).description || "";
                      const src = `${(viewItem as any).title}\n\n${body}`;
                      const ok = await copyText(src);
                      if (ok) { setCopied(prev=>({ ...prev, [(viewItem as any).id]: true })); setTimeout(()=> setCopied(prev=>({ ...prev, [(viewItem as any).id]: false })), 2000); }
                      else alert("Failed to copy");
                    }}
                  >
                    {copied[(viewItem as any).id] ? (<Check className="h-4 w-4 text-emerald-600" />) : (<>Copy</>)}
                  </Button>
                </div>
              )}
              {(viewItem.type === "prompt" || viewItem.type === "template") && (
                <div className="flex gap-2 justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async()=>{
                      const ok = await copyText((viewItem as any).content);
                      if (ok) { setCopied(prev=>({ ...prev, [(viewItem as any).id]: true })); setTimeout(()=> setCopied(prev=>({ ...prev, [(viewItem as any).id]: false })), 2000); }
                      else alert("Failed to copy");
                    }}
                  >
                    {copied[(viewItem as any).id] ? (<Check className="h-4 w-4 text-emerald-600" />) : (<>Copy</>)}
                  </Button>
                  <Button size="sm" onClick={()=>useInSandbox((viewItem as any).content)}>Use in Sandbox</Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

