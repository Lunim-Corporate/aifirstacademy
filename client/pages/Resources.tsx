import { useEffect, useMemo, useState } from "react";
import SafeLink from "@/components/SafeLink";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { BrainCircuit, Search } from "lucide-react";
import { apiMarketingResources, apiNewsletter } from "@/lib/api";
import type { MarketingResourcesResponse, GuideResource, VideoResource } from "@shared/api";
import MarketingFooter from "@/components/MarketingFooter";

export default function Resources() {
  const [data, setData] = useState<MarketingResourcesResponse | null>(null);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [q, setQ] = useState("");
  const [openGuide, setOpenGuide] = useState<GuideResource | null>(null);
  const [openVideo, setOpenVideo] = useState<VideoResource | null>(null);
  useEffect(()=>{ apiMarketingResources().then(setData).catch(()=>setData({ guides: [], videos: [] })); },[]);

  const filteredGuides = useMemo(()=>{
    const items = data?.guides || [];
    if (!q.trim()) return items;
    const s = q.toLowerCase();
    return items.filter(g => [g.title, g.description, g.content||"", ...(g.tags||[]), g.category||"", g.author||""].join(" ").toLowerCase().includes(s));
  }, [data, q]);
  const filteredVideos = useMemo(()=>{
    const items = data?.videos || [];
    if (!q.trim()) return items;
    const s = q.toLowerCase();
    return items.filter(v => [v.title, v.duration, v.embedUrl||"", v.mp4Url||"", ...(v.tags||[]), v.category||"", v.author||""].join(" ").toLowerCase().includes(s));
  }, [data, q]);

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <SafeLink to="/" className="flex items-center">
                <BrainCircuit className="h-8 w-8 text-brand-600" />
                <span className="ml-2 text-xl font-bold gradient-text">AI-First Academy</span>
              </SafeLink>
              <div className="hidden md:ml-10 md:flex space-x-8">
                <SafeLink to="/product" className="text-muted-foreground hover:text-foreground">Product</SafeLink>
                <SafeLink to="/pricing" className="text-muted-foreground hover:text-foreground">Pricing</SafeLink>
                <SafeLink to="/teams" className="text-muted-foreground hover:text-foreground">For Teams</SafeLink>
                <SafeLink to="/resources" className="text-foreground">Resources</SafeLink>
                <SafeLink to="/faq" className="text-muted-foreground hover:text-foreground">FAQ</SafeLink>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" asChild><SafeLink to="/login">Login</SafeLink></Button>
              <Button asChild><SafeLink to="/signup">Start Free Trial</SafeLink></Button>
            </div>
          </div>
        </div>
      </nav>

      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-8">
            <h1 className="text-4xl font-bold">Resources</h1>
            <p className="text-lg text-muted-foreground">Guides and videos to accelerate your learning</p>
          </div>

          <div className="max-w-2xl mx-auto mb-10 flex gap-2 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search guides and videos" value={q} onChange={(e)=>setQ(e.target.value)} />
            </div>
            <Button asChild variant="outline"><SafeLink to="/library">Browse Templates</SafeLink></Button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Guides</CardTitle><CardDescription>Best practices and patterns</CardDescription></CardHeader>
              <CardContent className="space-y-3">
                {filteredGuides.map(g => (
                  <div key={g.id} className="flex items-center justify-between text-sm">
                    <div className="mr-3">
                      <div className="font-medium">{g.title}</div>
                      <div className="text-muted-foreground">{g.description}</div>
                      <div className="text-xs text-muted-foreground mt-1">{g.category || 'General'}{g.author ? ` • ${g.author}` : ''}</div>
                    </div>
                    <Button variant="outline" size="sm" onClick={()=> setOpenGuide(g)}>Read</Button>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Videos</CardTitle><CardDescription>Quick demos and walkthroughs</CardDescription></CardHeader>
              <CardContent className="space-y-3">
                {filteredVideos.map(v => (
                  <div key={v.id} className="flex items-center justify-between text-sm">
                    <div className="mr-3">
                      <div className="font-medium">{v.title}</div>
                      <div className="text-muted-foreground">{v.duration}</div>
                      <div className="text-xs text-muted-foreground mt-1">{v.category || 'General'}{v.author ? ` • ${v.author}` : ''}</div>
                    </div>
                    <Button variant="outline" size="sm" onClick={()=> setOpenVideo(v)}>Watch</Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card className="mt-10">
            <CardHeader><CardTitle>Subscribe to our newsletter</CardTitle><CardDescription>Get product updates and new resources</CardDescription></CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-3">
              <Input placeholder="Your email" value={email} onChange={(e)=>setEmail(e.target.value)} />
              <Button disabled={!email.trim() || submitting} onClick={async()=>{ setSubmitting(true); try { await apiNewsletter({ email: email.trim() }); setSubscribed(true); setEmail(""); } catch(e:any){ alert(e?.message||"Failed"); } finally { setSubmitting(false); } }}>{submitting?"Submitting...": subscribed?"Subscribed!":"Subscribe"}</Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <MarketingFooter />

      <Dialog open={!!openGuide} onOpenChange={(v)=> !v && setOpenGuide(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{openGuide?.title}</DialogTitle>
          </DialogHeader>
          <div className="prose prose-neutral dark:prose-invert max-w-none whitespace-pre-wrap">
            {openGuide?.content || "This guide is currently unavailable."}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!openVideo} onOpenChange={(v)=> !v && setOpenVideo(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{openVideo?.title}</DialogTitle>
          </DialogHeader>
          <AspectRatio ratio={16/9}>
            {openVideo?.embedUrl ? (
              <iframe
                className="w-full h-full rounded-md"
                src={openVideo.embedUrl}
                title={openVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : openVideo?.mp4Url ? (
              <video className="w-full h-full rounded-md" controls src={openVideo.mp4Url} />
            ) : null}
          </AspectRatio>
        </DialogContent>
      </Dialog>
    </div>
  );
}
