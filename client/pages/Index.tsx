import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  BrainCircuit,
  Code,
  Users,
  BookOpen,
  Zap,
  Target,
  Check,
  Star,
  ArrowRight,
  Play,
  Sparkles,
  Layers,
  BarChart3,
  Award,
  Settings,
  Megaphone,
  Menu,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import SafeLink from "@/components/SafeLink";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";
import MarketingFooter from "@/components/MarketingFooter";
import TrustedByMarquee from "@/components/TrustedByMarquee";
import { apiMarketingProduct, apiDashboard, apiLearningTracks, apiGetProgress, apiLogout } from "@/lib/api";
import type { MarketingProductResponse, DashboardResponse } from "@shared/api";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";

export default function Index() {
  const { user, loading: authLoading } = useAuth();
  const [showDemo, setShowDemo] = useState(false);
  const [data, setData] = useState<MarketingProductResponse | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [learningData, setLearningData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => { apiMarketingProduct().then(setData).catch(()=>setData(null)); }, []);
  
  // Load dashboard data if signed in
  useEffect(() => {
    if (!authLoading && user) {
      (async () => {
        try {
          const [dashboardRes, tracksRes, progressRes] = await Promise.allSettled([
            apiDashboard(),
            apiLearningTracks(),
            apiGetProgress()
          ]);
          
          if (dashboardRes.status === 'fulfilled') {
            setDashboardData(dashboardRes.value);
          }
          
          if (tracksRes.status === 'fulfilled' || progressRes.status === 'fulfilled') {
            const tracks = tracksRes.status === 'fulfilled' ? tracksRes.value.tracks || [] : [];
            const userProgress = progressRes.status === 'fulfilled' ? progressRes.value.progress || [] : [];
            const userTracks = tracks.filter((track: any) => track.role === 'marketer');
            const finalTracks = userTracks.length > 0 ? userTracks : tracks;
            
            const totalLessons = finalTracks.reduce((total: number, track: any) => 
              total + (track.modules || []).reduce((moduleTotal: number, module: any) => 
                moduleTotal + (module.lessons?.length || 0), 0), 0);
            
            const completedLessons = userProgress.filter((p: any) => p.status === 'completed').length;
            const overallProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
            
            let currentModule = null;
            let nextLesson = null;
            
            for (const track of finalTracks) {
              for (const module of track.modules || []) {
                const moduleProgress = userProgress.filter((p: any) => 
                  p.track_id === track.id && p.module_id === module.id
                );
                
                const moduleCompleted = (module.lessons || []).every((lesson: any) => 
                  moduleProgress.some((p: any) => p.lesson_id === lesson.id && p.status === 'completed')
                );
                
                if (!moduleCompleted) {
                  for (const [lessonIndex, lesson] of (module.lessons || []).entries()) {
                    const lessonProgress = moduleProgress.find((p: any) => p.lesson_id === lesson.id);
                    if (!lessonProgress || lessonProgress.status !== 'completed') {
                      currentModule = {
                        track: track.title,
                        title: module.title,
                        description: module.description,
                        progress: Math.round((moduleProgress.filter(p => p.status === 'completed').length / (module.lessons?.length || 1)) * 100),
                        lessonIndex: lessonIndex + 1,
                        lessonsTotal: module.lessons?.length || 0,
                        remainingMin: (module.lessons || []).slice(lessonIndex).reduce((sum: number, l: any) => sum + (l.durationMin || 0), 0)
                      };
                      nextLesson = {
                        trackId: track.id,
                        moduleId: module.id,
                        lessonId: lesson.id
                      };
                      break;
                    }
                  }
                  break;
                }
              }
              if (currentModule) break;
            }
            
            setLearningData({
              overallProgress,
              completedLessons,
              totalLessons,
              currentModule,
              nextLesson
            });
          }
        } catch (error) {
          console.error('Failed to load dashboard data:', error);
        } finally {
          setLoading(false);
        }
      })();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading]);
  
  const displayName = user?.name?.split(" ")[0] || user?.email?.split("@")[0] || "there";
  const hasProgress = learningData?.completedLessons > 0 || dashboardData?.progress?.overall > 0;
  
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-gray-200 dark:border-gray-700/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <SafeLink to="/" className="flex-shrink-0 flex items-center">
                <BrainCircuit className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600" />
                <span className="ml-2 text-base sm:text-xl font-bold" style={{color: 'white'}}>AI-First Marketing Academy</span>
              </SafeLink>
              <div className="hidden md:ml-10 md:flex space-x-8">
                {/* Navigation links removed */}
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2">
                      <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                        <AvatarFallback className="flex items-center justify-center bg-gray-300 text-gray-700 text-lg font-semibold">
                          {user?.name
                            ? user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
                            : "U"}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="space-y-1">
                      <div className="text-sm font-medium">{user?.name || user?.email || "Account"}</div>
                      {user?.email && <div className="text-xs text-muted-foreground">{user.email}</div>}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/settings")}>
                      <Settings className="mr-2 h-4 w-4" /> Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={async()=>{ 
                      try { 
                        await apiLogout(); 
                      } catch {} 
                      try { 
                        localStorage.removeItem("auth_token"); 
                        window.dispatchEvent(new Event('auth-changed')); 
                      } catch {} 
                      window.location.replace("/login");
                    }}>
                      <span className="mr-2">Sign out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Button variant="ghost" size="sm" className="text-xs sm:text-sm" asChild>
                    <SafeLink to="/login">Login</SafeLink>
                  </Button>
                  <Button size="sm" className="text-xs sm:text-sm bg-[#bdeeff] hover:bg-[#bdeeff]/90 text-black" asChild>
                    <SafeLink to="/signup">Create Free Account</SafeLink>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Layout: Sidebar + Main Content when signed in */}
      {user ? (
        <div className="h-[calc(100vh-4rem)] flex flex-col sm:flex-row overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-br from-background via-primary-50/30 to-brand-50/30">
              <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-5" />
              <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <h1 className="text-4xl lg:text-6xl font-bold tracking-tight text-foreground">
                        Master <span className="gradient-text">Marketing AI Workflows</span> that ship
                      </h1>
                      <p className="text-xl text-muted-foreground max-w-2xl">
                        Learn, practice, and certify practical AI skills through interactive challenges and real-time LLM feedback. Built for marketers.
                      </p>
                    </div>
                    {/* Create Free Account button removed when signed in */}
                    <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                      <div className="flex items-center"><Check className="h-4 w-4 text-success mr-2" />Free</div>
                      <div className="flex items-center"><Check className="h-4 w-4 text-success mr-2" />2-hour onboarding</div>
                      <div className="flex items-center"><Check className="h-4 w-4 text-success mr-2" />Live LLM scoring</div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    {/* Why AI-First Academy box - moved from Product page */}
                    <Card className="border-gray-200 dark:border-gray-700/50 bg-background/80 backdrop-blur">
                      <CardHeader>
                        <CardTitle>Why AI-First Marketing Academy</CardTitle>
                        <CardDescription>Built for practical outcomes</CardDescription>
                      </CardHeader>
                      <CardContent className="grid sm:grid-cols-2 gap-4">
                        {(data?.features || []).map(f => (
                          <div key={f.id} className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-success mt-1" />
                            <div>
                              <div className="font-medium">{f.title}</div>
                              <div className="text-sm text-muted-foreground">{f.description}</div>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                    {/* Prompt Playground */}
                    <div className="relative transform rotate-4 translate-y-2 translate-x-2 scale-105">
                      <div className="absolute inset-0 bg-gradient-to-r from-brand-400/20 to-primary-400/20 rounded-2xl blur-3xl" />
                      <Card className="relative bg-background/80 backdrop-blur border-gray-200 dark:border-gray-700/50 shadow-2xl">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary" className="bg-gradient-to-r from-primary-600 to-brand-600 text-white">Prompt Playground</Badge>
                            <div className="flex space-x-1">
                              <div className="w-3 h-3 bg-destructive rounded-full" />
                              <div className="w-3 h-3 bg-warning rounded-full" />
                              <div className="w-3 h-3 bg-success rounded-full" />
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm">
                            <div className="text-brand-600 mb-2">// Your prompt:</div>
                            <div className="text-foreground">Generate a React component for a user profile card with avatar, name, and badges.</div>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <div className="text-success flex items-center"><Check className="h-4 w-4 mr-1" />Score: 87/100</div>
                            <div className="text-muted-foreground">GPT-4 • 245 tokens</div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Welcome back and Current Module sections */}
            <section className="py-6 sm:py-8 bg-muted/20">
              <div className="max-w-7xl mx-auto">
                <div className="mb-4 sm:mb-6">
                  <h1 className="text-2xl sm:text-3xl font-bold">{hasProgress ? `Welcome back, ${displayName}!` : `Hello ${displayName}!`}</h1>
                  <p className="text-sm sm:text-base text-muted-foreground">{hasProgress ? "Continue your AI mastery journey" : "Begin your AI mastery journey"}</p>
                </div>
                
                {learningData?.currentModule && (
                  <Card className="mb-4 sm:mb-6">
                    <CardHeader>
                      <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <span className="text-lg sm:text-xl">Current Module</span>
                        <Badge variant="outline" className="text-xs">{learningData.currentModule.track}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-brand-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Megaphone className="h-6 w-6 sm:h-8 sm:w-8" style={{color: '#bdeeff'}} />
                        </div>
                        <div className="flex-1 w-full">
                          <h3 className="font-semibold text-base sm:text-lg">{learningData.currentModule.title}</h3>
                          <p className="text-xs sm:text-sm text-muted-foreground">{learningData.currentModule.description || "Continue your learning journey"}</p>
                          <Progress value={learningData.currentModule.progress} className="mt-2" />
                          <p className="text-xs text-muted-foreground mt-1">Lesson {learningData.currentModule.lessonIndex} of {learningData.currentModule.lessonsTotal} • {learningData.currentModule.remainingMin} min remaining</p>
                        </div>
                      </div>
                      <Button 
                        className="w-full text-sm sm:text-base" 
                        onClick={() => {
                          if (learningData?.nextLesson) {
                            window.location.href = `/learning/${learningData.nextLesson.trackId}/${learningData.nextLesson.moduleId}/${learningData.nextLesson.lessonId}`;
                          } else {
                            window.location.href = '/learning';
                          }
                        }}
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Continue Learning
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-12 sm:py-24 bg-muted/20">
              <div className="max-w-7xl mx-auto">
                <div className="text-center space-y-4 mb-8 sm:mb-16">
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Everything You Need to Master AI</h2>
                  <p className="text-base sm:text-xl text-muted-foreground max-w-3xl mx-auto px-4">
                    Hands-on learning with real AI feedback, rich content, and enterprise controls.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
                  {/* Swapped order: Structured Tracks first, then Interactive Playground */}
                  <Card className="group hover:shadow-lg transition-all duration-200 border-gray-200 dark:border-gray-700/50">
                    <CardHeader>
                      <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary-200 transition-colors">
                        <BookOpen className="h-6 w-6 text-primary-600" />
                      </div>
                      <CardTitle>Structured Tracks</CardTitle>
                      <CardDescription>Tailored learning paths for marketing professionals.</CardDescription>
                    </CardHeader>
                  </Card>
                  <Card className="group hover:shadow-lg transition-all duration-200 border-gray-200 dark:border-gray-700/50">
                    <CardHeader>
                      <div className="w-12 h-12 bg-brand-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand-200 transition-colors">
                        <Code className="h-6 w-6 text-brand-600" />
                      </div>
                      <CardTitle>Interactive Playground</CardTitle>
                      <CardDescription>Practice with live LLMs and get instant scoring.</CardDescription>
                    </CardHeader>
                  </Card>
                </div>
                
                {/* Three boxes moved from Product page */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                  {[{icon:Sparkles,title:'Learn by Doing',desc:'Short, focused modules with live LLM feedback. Practice real-world workflows and see your score improve.'},{icon:Layers,title:'Battle‑tested Patterns',desc:'Prompt structures and templates used by high‑performing teams. Copy, adapt, and standardize.'},{icon:BarChart3,title:'Measure Outcomes',desc:'Admin analytics, cohort progress, and certificates that prove skill improvement.'}].map(({icon:Icon,title,desc},i)=> (
                    <Card key={i} className="border-gray-200 dark:border-gray-700/50">
                      <CardHeader>
                        <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center mb-3"><Icon className="h-5 w-5"/></div>
                        <CardTitle>{title}</CardTitle>
                        <CardDescription>{desc}</CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>
            </section>

            {/* Pricing CTA */}
       {/*} <section className="py-24 bg-muted/30">
              <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
                <h2 className="text-3xl lg:text-4xl font-bold mb-4">Ready to transform your AI workflows?</h2>
                <p className="text-xl text-muted-foreground mb-8">Start free today and master marketing AI workflows.</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    size="lg"
                    onClick={() => navigate('/signup')}
                    className="bg-[#bdeeff] hover:bg-[#bdeeff]/90 text-black"
                  >
                    Create Free Account
                  </Button>
                </div>
              </div>
            </section> */}

            <MarketingFooter />
          </main>
        </div>
      ) : (
        <>
          {/* Hero Section - Not signed in */}
          <section className="relative overflow-hidden bg-gradient-to-br from-background via-primary-50/30 to-brand-50/30">
            <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-5" />
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h1 className="text-4xl lg:text-6xl font-bold tracking-tight text-foreground">
                      Master <span className="gradient-text">Marketing AI Workflows</span> that ship
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl">
                      Learn, practice, and certify practical AI skills through interactive challenges and real-time LLM feedback. Built for marketers.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button size="lg" className="bg-[#bdeeff] hover:bg-[#bdeeff]/90 text-black" onClick={() => navigate('/signup')}>
                      Create Free Account <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    {/* Commented out Watch Demo button */}
                    {/* <Button
                      size="lg"
                      variant="outline"
                      onClick={() => setShowDemo(true)}
                      className="group bg-black text-white border-white hover:bg-black hover:text-white"
                    >
                      <Play className="mr-2 h-4 w-4 text-white group-hover:scale-110 transition-transform" />
                      Watch Demo
                    </Button> */}
                  </div>
                  <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                    <div className="flex items-center"><Check className="h-4 w-4 text-success mr-2" />Free</div>
                    <div className="flex items-center"><Check className="h-4 w-4 text-success mr-2" />2-hour onboarding</div>
                    <div className="flex items-center"><Check className="h-4 w-4 text-success mr-2" />Live LLM scoring</div>
                  </div>
                </div>
                <div className="space-y-6">
                  {/* Why AI-First Academy box - moved from Product page */}
                  <Card className="border-gray-200 dark:border-gray-700/50 bg-background/80 backdrop-blur">
                    <CardHeader>
                      <CardTitle>Why AI-First Marketing Academy</CardTitle>
                      <CardDescription>Built for practical outcomes</CardDescription>
                    </CardHeader>
                    <CardContent className="grid sm:grid-cols-2 gap-4">
                      {(data?.features || []).map(f => (
                        <div key={f.id} className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-success mt-1" />
                          <div>
                            <div className="font-medium">{f.title}</div>
                            <div className="text-sm text-muted-foreground">{f.description}</div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                  {/* Prompt Playground */}
                  <div className="relative transform rotate-4 translate-y-2 translate-x-2 scale-105">
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-400/20 to-primary-400/20 rounded-2xl blur-3xl" />
                    <Card className="relative bg-background/80 backdrop-blur border-gray-200 dark:border-gray-700/50 shadow-2xl">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="bg-gradient-to-r from-primary-600 to-brand-600 text-white">Prompt Playground</Badge>
                          <div className="flex space-x-1">
                            <div className="w-3 h-3 bg-destructive rounded-full" />
                            <div className="w-3 h-3 bg-warning rounded-full" />
                            <div className="w-3 h-3 bg-success rounded-full" />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm">
                          <div className="text-brand-600 mb-2">// Your prompt:</div>
                          <div className="text-foreground">Generate a React component for a user profile card with avatar, name, and badges.</div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="text-success flex items-center"><Check className="h-4 w-4 mr-1" />Score: 87/100</div>
                          <div className="text-muted-foreground">GPT-4 • 245 tokens</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Logos / Social Proof - Commented out */}
          {/* <TrustedByMarquee logos={["TechCorp","ScaleUp","GrowthCo","DevWorks","PixelLabs","DataForge"]} duration={0.8} delay={0} ease="power3.out" slideFrom="bottom" /> */}

          {/* Features Section */}
          <section id="features" className="py-24 bg-muted/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center space-y-4 mb-16">
                <h2 className="text-3xl lg:text-4xl font-bold">Everything You Need to Master AI</h2>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                  Hands-on learning with real AI feedback, rich content, and enterprise controls.
                </p>
              </div>
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                {/* Swapped order: Structured Tracks first, then Interactive Playground */}
                <Card className="group hover:shadow-lg transition-all duration-200 border-gray-200 dark:border-gray-700/50">
                  <CardHeader>
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary-200 transition-colors">
                      <BookOpen className="h-6 w-6 text-primary-600" />
                    </div>
                    <CardTitle>Structured Tracks</CardTitle>
                    <CardDescription>Tailored learning paths for marketing professionals.</CardDescription>
                  </CardHeader>
                </Card>
                <Card className="group hover:shadow-lg transition-all duration-200 border-gray-200 dark:border-gray-700/50">
                  <CardHeader>
                    <div className="w-12 h-12 bg-brand-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand-200 transition-colors">
                      <Code className="h-6 w-6 text-brand-600" />
                    </div>
                    <CardTitle>Interactive Playground</CardTitle>
                    <CardDescription>Practice with live LLMs and get instant scoring.</CardDescription>
                  </CardHeader>
                </Card>
              </div>
              
              {/* Three boxes moved from Product page */}
              <div className="grid md:grid-cols-3 gap-6">
                {[{icon:Sparkles,title:'Learn by Doing',desc:'Short, focused modules with live LLM feedback. Practice real-world workflows and see your score improve.'},{icon:Layers,title:'Battle‑tested Patterns',desc:'Prompt structures and templates used by high‑performing teams. Copy, adapt, and standardize.'},{icon:BarChart3,title:'Measure Outcomes',desc:'Admin analytics, cohort progress, and certificates that prove skill improvement.'}].map(({icon:Icon,title,desc},i)=> (
                  <Card key={i} className="border-gray-200 dark:border-gray-700/50">
                    <CardHeader>
                      <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center mb-3"><Icon className="h-5 w-5"/></div>
                      <CardTitle>{title}</CardTitle>
                      <CardDescription>{desc}</CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* Testimonials - Commented out */}
          {/* <section className="py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center space-y-4 mb-16">
                <h2 className="text-3xl lg:text-4xl font-bold">Trusted by Marketers Worldwide</h2>
                <p className="text-xl text-muted-foreground">Real outcomes, fast adoption</p>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                {[{
                  name: 'Sarah Martinez', role: 'Senior Developer, TechCorp', quote: 'The sandbox changed how we write prompts. Consistent quality in 2 weeks.'
                },{
                  name: 'Michael Johnson', role: 'VP Engineering, ScaleUp', quote: 'Cohorts and analytics made rollout seamless across 200+ engineers.'
                },{
                  name: 'Emily Parker', role: 'Marketing Director, GrowthCo', quote: 'I ship campaign briefs in hours, not days.'
                }].map((t, i)=> (
                  <Card key={i} className="border-gray-200 dark:border-gray-700/50">
                    <CardContent className="pt-6">
                      <div className="flex items-center mb-4">
                        {[...Array(5)].map((_, j) => (
                          <Star key={j} className="h-4 w-4 fill-warning text-warning" />
                        ))}
                      </div>
                      <p className="text-muted-foreground mb-6">"{t.quote}"</p>
                      <div className="flex items-center">
                        <Avatar className="h-10 w-10 mr-3">
                          <AvatarFallback>{t.name.split(' ').map(s=>s[0]).slice(0,2).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold">{t.name}</div>
                          <div className="text-sm text-muted-foreground">{t.role}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section> */}

          {/* Pricing CTA */}
          <section className="py-24 bg-muted/30">
            <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">Ready to transform your AI workflows?</h2>
              <p className="text-xl text-muted-foreground mb-8">Start free today and master marketing AI workflows.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  onClick={() => navigate('/signup')}
                  className="bg-[#bdeeff] hover:bg-[#bdeeff]/90 text-black"
                >
                  Create Free Account
                </Button>
                {/* Commented out Watch Demo button */}
                {/* <Button size="lg" variant="outline" className="border-foreground text-foreground hover:bg-foreground/5" onClick={() => setShowDemo(true)}>
                  Watch Demo
                </Button> */}
              </div>
            </div>
          </section>

          <MarketingFooter />
        </>
      )}

      <Dialog open={showDemo} onOpenChange={setShowDemo}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Product Demo</DialogTitle>
          </DialogHeader>
          <div className="aspect-video">
            <iframe
              className="w-full h-full rounded-md"
              src="https://www.youtube.com/embed/dQw4w9WgXcQ"
              title="AI-First Marketing Academy Demo"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

