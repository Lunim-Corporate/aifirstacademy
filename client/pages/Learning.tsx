import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { 
  Home,
  BookOpen, 
  Code, 
  Library,
  Users,
  Award,
  Settings,
  ChevronDown,
  ChevronRight,
  Play,
  CheckCircle,
  Clock,
  Target,
  Lock,
  Video,
  FileText,
  HelpCircle,
  Trophy,
  Star,
  Zap,
  Calendar,
  TrendingUp,
  Medal,
  Shield,
  Download,
  ExternalLink,
  Sparkles,
  GraduationCap,
  MapPin,
  Timer,
  Brain,
  Rocket
} from "lucide-react";
import { Link } from "react-router-dom";
import LoggedInHeader from "@/components/LoggedInHeader";
import CertificateRequirements from "@/components/CertificateRequirements";
import { useEffect, useState, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { apiLearningTracks, apiGetProgress, apiSetLessonProgress, apiMe, apiMeCookie, apiGetSettingsProfile } from "@/lib/api";

const sidebarItems = [
  { icon: Home, label: "Dashboard", href: "/dashboard" },
  { icon: BookOpen, label: "Learning Path", href: "/learning", active: true },
  { icon: Code, label: "Sandbox", href: "/sandbox" },
  { icon: Library, label: "Library", href: "/library" },
  { icon: Users, label: "Community", href: "/community" },
  { icon: Award, label: "Certificates", href: "/certificates" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

// This will be replaced with real data from the API

const getLessonIcon = (type: string) => {
  switch (type) {
    case "video": return Video;
    case "text": return FileText;
    case "sandbox": return Code;
    case "interactive": return Target;
    case "quiz": return HelpCircle;
    default: return FileText;
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "completed": return CheckCircle;
    case "in-progress": return Play;
    case "locked": return Lock;
    default: return Clock;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed": return "text-success";
    case "in-progress": return "text-brand-600";
    case "locked": return "text-muted-foreground";
    default: return "text-muted-foreground";
  }
};

export default function Learning() {
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [tracks, setTracks] = useState<any[]>([]);
  const [allTracks, setAllTracks] = useState<any[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<any>(null);
  const [userProgress, setUserProgress] = useState<any[]>([]);
  const [userRole, setUserRole] = useState('engineer');
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [userStats, setUserStats] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  
  const roleOptions = [
    { value: 'engineer', label: 'Engineer', icon: Code, description: 'Software development and technical skills' },
    { value: 'manager', label: 'Manager', icon: Users, description: 'Leadership and strategic AI implementation' },
    { value: 'designer', label: 'Designer', icon: Target, description: 'AI-powered design and creativity' },
    { value: 'marketer', label: 'Marketer', icon: Trophy, description: 'AI-driven marketing and growth strategies' },
    { value: 'researcher', label: 'Researcher', icon: BookOpen, description: 'Advanced AI research and methodologies' },
  ];
  
  useEffect(() => {
    const loadData = async () => {
      let currentUserRole = 'engineer'; // Default fallback
      
      try {
        // Get user info and profile to determine role
        try {
          // Try token-based auth first, then fallback to cookie
          let userInfo;
          try {
            userInfo = await apiMe();
          } catch {
            userInfo = await apiMeCookie();
          }
          console.log('User info:', userInfo);
          
          // Try to get user profile to get the role
          try {
            const profileInfo = await apiGetSettingsProfile();
            if (profileInfo?.profile?.personaRole) {
              currentUserRole = profileInfo.profile.personaRole;
            }
          } catch (profileError) {
            console.warn('Could not load user profile:', profileError);
            // Keep default role
          }
        } catch (authError) {
          console.warn('User not authenticated:', authError);
          // Continue with default role for demo purposes
        }
        
        setUserRole(currentUserRole);
        
        // Load all tracks
        const tracksResponse = await apiLearningTracks();
        const allTracksData = tracksResponse.tracks || [];
        setAllTracks(allTracksData);
        
        // Filter tracks by determined user role
        const roleTracks = allTracksData.filter((track: any) => track.role === currentUserRole);
        console.log('Role tracks found:', roleTracks.length, 'for role:', currentUserRole);
        setTracks(roleTracks);
        
        if (roleTracks.length > 0) {
          setSelectedTrack(roleTracks[0]);
          // Expand first module if it exists
          if (roleTracks[0].modules && roleTracks[0].modules.length > 0) {
            setExpandedModules([roleTracks[0].modules[0].id]);
          }
        }
        
        // Load user progress
        try {
          const progressResponse = await apiGetProgress();
          setUserProgress(progressResponse.progress || []);
        } catch (error) {
          console.warn('Could not load progress:', error);
        }
        
        // Load user stats and recommendations
        try {
          // Calculate real stats based on progress
          const totalLessonsCount = roleTracks.reduce((total: number, track: any) => 
            total + track.modules.reduce((moduleTotal: number, module: any) => 
              moduleTotal + (module.lessons?.length || 0), 0), 0);
            
          const completedLessonsCount = (userProgress || []).filter((p: any) => p.status === 'completed').length;
          const completionRateCalc = totalLessonsCount > 0 ? Math.round((completedLessonsCount / totalLessonsCount) * 100) : 0;
          
          setUserStats({
            totalLessons: totalLessonsCount,
            completedLessons: completedLessonsCount,
            completionRate: completionRateCalc,
            totalTime: roleTracks.reduce((total: number, track: any) => 
              total + (track.estimatedHours || 0), 0),
            streakDays: 7 // TODO: Calculate from actual usage data
          });
          
          // Generate recommendations based on role
          const recs = [];
          for (const track of roleTracks) {
            if (track.modules && track.modules.length > 0) {
              for (const module of track.modules.slice(0, 2)) {
                if (module.lessons && module.lessons.length > 0) {
                  recs.push({
                    trackId: track.id,
                    trackTitle: track.title,
                    moduleId: module.id,
                    moduleTitle: module.title,
                    lessonId: module.lessons[0].id,
                    lessonTitle: module.lessons[0].title,
                    type: module.lessons[0].type || 'text',
                    duration: `${module.lessons[0].durationMin} min`,
                    level: (module.lessons[0] as any).level || 'beginner'
                  });
                }
              }
            }
          }
          setRecommendations(recs.slice(0, 6));
          
        } catch (error) {
          console.warn('Could not load stats:', error);
        }
        
      } catch (error) {
        console.error('Failed to load learning data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [userRole]);
  
  const handleRoleChange = (newRole: string) => {
    setUserRole(newRole);
    setShowRoleSelector(false);
    setLoading(true);
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };
  
  const getLessonStatus = (trackId: string, moduleId: string, lessonId: string) => {
    const progress = userProgress.find((p: any) => 
      p.track_id === trackId && p.module_id === moduleId && p.lesson_id === lessonId
    );
    return progress?.status || 'not_started';
  };
  
  // New function to determine if a lesson should be locked based on strict progression rules
  const isLessonLocked = (trackId: string, moduleId: string, lessonId: string, lessonOrder: number, moduleOrder: number) => {
    // First lesson is never locked
    if (moduleOrder === 0 && lessonOrder === 0) {
      return false;
    }
    
    // For subsequent lessons in the same module, check if previous lesson is completed
    if (lessonOrder > 0) {
      const module = selectedTrack?.modules?.find(m => m.id === moduleId);
      const previousLesson = module?.lessons[lessonOrder - 1];
      if (previousLesson) {
        const prevStatus = getLessonStatus(trackId, moduleId, previousLesson.id);
        return prevStatus !== 'completed';
      }
    }
    
    // For first lesson in a module, check if previous module is completed
    if (lessonOrder === 0 && moduleOrder > 0) {
      const previousModule = selectedTrack?.modules?.[moduleOrder - 1];
      if (previousModule && previousModule.lessons) {
        // Check if all lessons in previous module are completed
        const allPreviousCompleted = previousModule.lessons.every(lesson => 
          getLessonStatus(trackId, previousModule.id, lesson.id) === 'completed'
        );
        return !allPreviousCompleted;
      }
    }
    
    return false;
  };
  
  // Enhanced progress calculations with proper status checking
  // These must be called before any early returns to follow React hooks rules
  const completedLessons = useMemo(() => {
    if (!selectedTrack?.modules || userProgress.length === 0) return 0;
    return selectedTrack.modules.reduce((total: number, module: any) => 
      total + module.lessons.filter((lesson: any) => 
        getLessonStatus(selectedTrack.id, module.id, lesson.id) === "completed"
      ).length, 0
    );
  }, [selectedTrack, userProgress]);
  
  const totalLessons = useMemo(() => {
    return selectedTrack?.modules?.reduce((total: number, module: any) => total + (module.lessons?.length || 0), 0) || 0;
  }, [selectedTrack]);
  
  const progressPercentage = useMemo(() => {
    return totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  }, [completedLessons, totalLessons]);
  
  // Calculate which lessons are available vs locked
  const availableLessons = useMemo(() => {
    if (!selectedTrack?.modules) return 0;
    return selectedTrack.modules.reduce((total: number, module: any, moduleIndex: number) => {
      return total + module.lessons.filter((_: any, lessonIndex: number) => 
        !isLessonLocked(selectedTrack.id, module.id, _.id, lessonIndex, moduleIndex)
      ).length;
    }, 0);
  }, [selectedTrack, userProgress]);
  
  const startLesson = async (trackId: string, moduleId: string, lessonId: string, checkLocked = true) => {
    // Find lesson details for better error handling
    let lessonOrder = -1;
    let moduleOrder = -1;
    let lessonTitle = 'Unknown Lesson';
    
    selectedTrack?.modules?.forEach((module: any, mIdx: number) => {
      const lIdx = module.lessons.findIndex((l: any) => l.id === lessonId && module.id === moduleId);
      if (lIdx !== -1) {
        lessonOrder = lIdx;
        moduleOrder = mIdx;
        lessonTitle = module.lessons[lIdx].title;
      }
    });
    
    // Check if lesson is locked and prevent access
    if (checkLocked && lessonOrder !== -1 && moduleOrder !== -1) {
      const locked = isLessonLocked(trackId, moduleId, lessonId, lessonOrder, moduleOrder);
      if (locked) {
        // Show user-friendly message about why lesson is locked
        if (lessonOrder > 0) {
          const module = selectedTrack?.modules?.find(m => m.id === moduleId);
          const previousLesson = module?.lessons[lessonOrder - 1];
          alert(`Please complete "${previousLesson?.title || 'the previous lesson'}" before accessing "${lessonTitle}".`);
        } else {
          alert(`Please complete the previous module before accessing "${lessonTitle}".`);
        }
        return;
      }
    }
    
    try {
      console.log('Starting lesson:', { trackId, moduleId, lessonId, lessonTitle });
      
      // Check if user is authenticated by trying to get current user
      let userInfo;
      try {
        userInfo = await apiMe();
        console.log('User authenticated:', userInfo.id);
      } catch {
        try {
          userInfo = await apiMeCookie();
          console.log('User authenticated via cookie:', userInfo.id);
        } catch (authError) {
          console.error('Authentication failed:', authError);
          alert('Please log in to access lessons.');
          window.location.href = '/login';
          return;
        }
      }
      
      // Set lesson as in progress
      console.log('Setting lesson progress to in_progress...');
      await apiSetLessonProgress({ trackId, moduleId, lessonId, status: 'in_progress' });
      console.log('Progress updated successfully');
      
      // Navigate to lesson
      window.location.href = `/learning/${trackId}/${moduleId}/${lessonId}`;
    } catch (error: any) {
      console.error('Failed to start lesson:', error);
      console.error('Error details:', { message: error?.message, status: error?.status, stack: error?.stack });
      
      // More specific error handling
      if (error?.message?.includes('Unauthorized')) {
        alert('Your session has expired. Please log in again.');
        localStorage.removeItem('auth_token'); // Clear any stale tokens
        window.location.href = '/login';
        return;
      }
      
      if (error?.message?.includes('not found')) {
        alert(`Lesson "${lessonTitle}" could not be found. Please refresh the page and try again.`);
        return;
      }
      
      if (error?.message?.includes('Failed to fetch') || error?.message?.includes('Network')) {
        alert('Network connection error. Please check your internet connection and try again.');
        return;
      }
      
      // Show generic error but still allow navigation for better UX
      const allowNavigation = confirm(
        `There was an issue starting "${lessonTitle}" (${error?.message || 'Unknown error'}). Your progress may not be saved. Continue anyway?`
      );
      
      if (allowNavigation) {
        window.location.href = `/learning/${trackId}/${moduleId}/${lessonId}`;
      }
    }
  };
  
  // Early return for no selected track and not loading
  if (!selectedTrack && !loading) {
    const currentRole = roleOptions.find(r => r.value === userRole);
    const Icon = currentRole?.icon || Code;
    
    return (
      <div className="min-h-screen bg-background">
        <LoggedInHeader />
        <div className="container mx-auto py-8 px-4">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>No Learning Tracks Available</CardTitle>
              <CardDescription>
                We don't have learning tracks for the <strong>{currentRole?.label || 'current'}</strong> role yet. Please check back later or contact support.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center py-8">
                <div className="text-center space-y-4">
                  <Icon className="h-16 w-16 mx-auto text-muted-foreground" />
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Your Role: {currentRole?.label || 'Engineer'}</h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      Learning content for your role is being prepared. You can change your role in settings if needed.
                    </p>
                  </div>
                  <Button onClick={() => window.location.href = '/settings'}>
                    Change Role in Settings
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <LoggedInHeader />
        <div className="h-[calc(100vh-4rem)] flex overflow-hidden">
          <aside className="w-64 bg-muted/30 border-r border-gray-200 dark:border-gray-700/40 h-full overflow-y-auto">
            <nav className="p-4 space-y-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-3 px-3 py-2 rounded-lg">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-28" />
                </div>
              ))}
            </nav>
          </aside>
          <main className="flex-1 p-6 space-y-6 overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-80" />
              </div>
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="pt-6 space-y-3">
                    <Skeleton className="h-7 w-20" />
                    <Skeleton className="h-3 w-40" />
                    <Skeleton className="h-2 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardHeader>
                    <Skeleton className="h-5 w-64" />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {Array.from({ length: 3 }).map((_, j) => (
                      <div key={j} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-3 w-48" />
                            <Skeleton className="h-2 w-32" />
                          </div>
                        </div>
                        <Skeleton className="h-4 w-20" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
                    item.active
                      ? "bg-brand-100 text-brand-700 border border-brand-200"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Learning Path</h1>
              <p className="text-muted-foreground">
                Master AI skills tailored to your {(() => {
                  const currentRole = roleOptions.find(r => r.value === userRole);
                  return currentRole?.label.toLowerCase() || 'role';
                })()} role
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-brand-50 text-brand-700 text-sm py-1 px-3">
                {(() => {
                  const currentRole = roleOptions.find(r => r.value === userRole);
                  const Icon = currentRole?.icon || Code;
                  return (
                    <>
                      <Icon className="h-4 w-4 mr-2" />
                      {currentRole?.label || 'Engineer'}
                    </>
                  );
                })()}
              </Badge>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => window.location.href = '/settings'}
              >
                Change in Settings
              </Button>
            </div>
          </div>
          
          {/* Learning Stats Dashboard */}
          {userStats && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold">{userStats.streakDays}</div>
                      <p className="text-xs text-muted-foreground">Day Streak</p>
                    </div>
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-orange-600 text-sm">🔥</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{progressPercentage}%</div>
                  <p className="text-xs text-muted-foreground">Track Progress</p>
                  <Progress value={progressPercentage} className="mt-2" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{completedLessons}</div>
                  <p className="text-xs text-muted-foreground">of {totalLessons} completed</p>
                  <div className="text-xs text-muted-foreground mt-1">
                    {availableLessons} lessons unlocked
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{userStats.totalTime}h</div>
                  <p className="text-xs text-muted-foreground">Total content</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{tracks.length}</div>
                  <p className="text-xs text-muted-foreground">Available tracks</p>
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* Enhanced Quick Recommendations */}
          {recommendations.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-brand-400 to-purple-500 rounded-xl blur opacity-60" />
                    <div className="relative bg-gradient-to-r from-brand-500 to-purple-600 p-2 rounded-lg">
                      <Sparkles className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Recommended for You</h2>
                    <p className="text-slate-600 dark:text-slate-400">Continue your AI learning journey</p>
                  </div>
                </div>
                <Button variant="outline" size="lg" className="group hover:bg-brand-50 hover:border-brand-200">
                  View All
                  <ExternalLink className="h-4 w-4 ml-2 group-hover:scale-110 transition-transform" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {recommendations.slice(0, 3).map((rec, index) => {
                  const Icon = getLessonIcon(rec.type);
                  const gradients = [
                    'from-blue-500/10 to-cyan-500/10 border-blue-200/60 dark:border-blue-500/20',
                    'from-purple-500/10 to-pink-500/10 border-purple-200/60 dark:border-purple-500/20',
                    'from-green-500/10 to-emerald-500/10 border-green-200/60 dark:border-green-500/20'
                  ];
                  
                  return (
                    <Card 
                      key={index} 
                      className={`group cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-500 relative overflow-hidden bg-gradient-to-br ${gradients[index % 3]}`}
                      onClick={() => startLesson(rec.trackId, rec.moduleId, rec.lessonId)}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <CardContent className="pt-6 relative z-10">
                        <div className="flex items-start gap-4">
                          <div className="relative">
                            <div className="absolute -inset-1 bg-gradient-to-r from-brand-400 to-purple-500 rounded-xl blur opacity-0 group-hover:opacity-60 transition-opacity duration-500" />
                            <div className="relative bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm group-hover:shadow-lg transition-shadow duration-300">
                              <Icon className="h-6 w-6 text-brand-600 group-hover:scale-110 transition-transform duration-300" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg truncate group-hover:text-brand-700 transition-colors">
                              {rec.lessonTitle}
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 truncate mb-3">
                              {rec.trackTitle}
                            </p>
                            <div className="flex items-center gap-2 mb-3">
                              <Badge 
                                variant="secondary" 
                                className="text-xs bg-white/60 dark:bg-slate-800/60 group-hover:bg-brand-100 group-hover:text-brand-800 transition-colors"
                              >
                                {rec.level}
                              </Badge>
                              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <Timer className="h-3 w-3" />
                                {rec.duration}
                              </span>
                            </div>
                            <Button 
                              size="sm" 
                              className="w-full bg-gradient-to-r from-brand-500 to-purple-600 hover:from-brand-600 hover:to-purple-700 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300"
                              onClick={(e) => {
                                e.stopPropagation();
                                startLesson(rec.trackId, rec.moduleId, rec.lessonId);
                              }}
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Start Lesson
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Track Content - Only show if selectedTrack exists */}
          {selectedTrack && (
            <>
              {/* Track Header */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">{selectedTrack.title}</h2>
                    <p className="text-muted-foreground">{selectedTrack.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-brand-50 text-brand-700">
                      {selectedTrack.level || 'Beginner'}
                    </Badge>
                    {selectedTrack.certificateAvailable && (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        <Award className="h-3 w-3 mr-1" />
                        Certificate Available
                      </Badge>
                    )}
                    <Button onClick={() => {
                      const firstLesson = selectedTrack.modules?.[0]?.lessons?.[0];
                      if (firstLesson && selectedTrack.modules?.[0]) {
                        startLesson(selectedTrack.id, selectedTrack.modules[0].id, firstLesson.id);
                      }
                    }}>
                      Start Track
                    </Button>
                  </div>
                </div>

                {/* Progress Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">{Math.round(progressPercentage)}%</div>
                      <p className="text-xs text-muted-foreground">Overall Progress</p>
                      <Progress value={progressPercentage} className="mt-2" />
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">{selectedTrack.modules?.filter((m: any) => {
                        const moduleCompleted = m.lessons.every((l: any) => 
                          getLessonStatus(selectedTrack.id, m.id, l.id) === 'completed'
                        );
                        return moduleCompleted;
                      }).length || 0}</div>
                      <p className="text-xs text-muted-foreground">of {selectedTrack.modules?.length || 0} modules</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">{completedLessons}</div>
                      <p className="text-xs text-muted-foreground">of {totalLessons} lessons</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">{Math.round((selectedTrack.modules?.reduce((total: number, module: any) => 
                        total + module.lessons.reduce((sum: number, lesson: any) => sum + (lesson.durationMin || 0), 0), 0
                      ) || 0) / 60)} hrs</div>
                      <p className="text-xs text-muted-foreground">Total duration</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Modules List */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Course Modules</h2>
                {selectedTrack.modules?.map((module: any, moduleIndex: number) => (
                  <Card key={module.id} className="overflow-hidden">
                    <Collapsible 
                      open={expandedModules.includes(module.id)}
                      onOpenChange={() => toggleModule(module.id)}
                    >
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                                  module.lessons.every((l: any) => getLessonStatus(selectedTrack.id, module.id, l.id) === 'completed') ? "bg-success border-success text-white" :
                                  module.lessons.some((l: any) => getLessonStatus(selectedTrack.id, module.id, l.id) === 'in_progress') ? "bg-brand-100 border-brand-600 text-brand-600" :
                                  "bg-muted border-gray-200 dark:border-gray-700 text-muted-foreground"
                                }`}>
                                  {module.lessons.every((l: any) => getLessonStatus(selectedTrack.id, module.id, l.id) === 'completed') ? (
                                    <CheckCircle className="h-4 w-4" />
                                  ) : (
                                    <span className="text-sm font-semibold">{moduleIndex + 1}</span>
                                  )}
                                </div>
                                <div>
                                  <CardTitle className="text-left">{module.title}</CardTitle>
                                  <CardDescription className="text-left">{module.description}</CardDescription>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="text-right">
                                <div className="text-sm font-medium">{Math.round(module.lessons.reduce((sum: number, l: any) => sum + (l.durationMin || 0), 0) / 60 * 10) / 10}h</div>
                                <div className="text-xs text-muted-foreground">
                                  {module.lessons.filter((l: any) => getLessonStatus(selectedTrack.id, module.id, l.id) === "completed").length} of {module.lessons.length} lessons
                                </div>
                              </div>
                              <Badge variant="outline" className={
                                module.lessons.every((l: any) => getLessonStatus(selectedTrack.id, module.id, l.id) === 'completed') ? "bg-success/10 text-success" :
                                module.lessons.some((l: any) => getLessonStatus(selectedTrack.id, module.id, l.id) === 'in_progress') ? "bg-brand-50 text-brand-700" :
                                "text-muted-foreground"
                              }>
                                {module.lessons.every((l: any) => getLessonStatus(selectedTrack.id, module.id, l.id) === 'completed') ? "Completed" :
                                 module.lessons.some((l: any) => getLessonStatus(selectedTrack.id, module.id, l.id) === 'in_progress') ? "In Progress" :
                                 "Locked"}
                              </Badge>
                              {expandedModules.includes(module.id) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </div>
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent>
                        <CardContent className="pt-0 space-y-2">
                          {module.lessons.map((lesson: any, lessonIndex: number) => {
                            const LessonIcon = getLessonIcon(lesson.type);
                            const lessonStatus = getLessonStatus(selectedTrack.id, module.id, lesson.id);
                            const StatusIcon = getStatusIcon(lessonStatus);
                            const statusColor = getStatusColor(lessonStatus);
                            const isLocked = isLessonLocked(selectedTrack.id, module.id, lesson.id, lessonIndex, moduleIndex);
                            
                            return (
                              <div 
                                key={lesson.id}
                                className={`flex items-center justify-between p-3 rounded-lg border ${
                                  isLocked 
                                    ? "border-gray-200 dark:border-gray-700/50 bg-muted/30" 
                                    : "border-gray-200 dark:border-gray-700 hover:bg-muted/50 cursor-pointer"
                                } transition-colors`}
                                onClick={() => {
                                  if (!isLocked) {
                                    startLesson(selectedTrack.id, module.id, lesson.id);
                                  }
                                }}
                              >
                                <div className="flex items-center space-x-3">
                                  <LessonIcon className={`h-4 w-4 ${statusColor}`} />
                                  <div>
                                    <div className={`font-medium ${isLocked ? "text-muted-foreground" : ""}`}>
                                      {lesson.title}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {lesson.durationMin} min • {lesson.type}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {lessonStatus === "completed" && (
                                    <Badge variant="secondary" className="bg-success/10 text-success text-xs">
                                      <Trophy className="h-3 w-3 mr-1" />
                                      +50 XP
                                    </Badge>
                                  )}
                                  <StatusIcon className={`h-4 w-4 ${statusColor}`} />
                                  {lessonStatus === "in-progress" && (
                                    <Button size="sm" onClick={(e) => {
                                      e.stopPropagation();
                                      startLesson(selectedTrack.id, module.id, lesson.id);
                                    }}>
                                      Continue
                                    </Button>
                                  )}
                                  {lessonStatus === "completed" && (
                                    <Button size="sm" variant="outline" onClick={(e) => {
                                      e.stopPropagation();
                                      startLesson(selectedTrack.id, module.id, lesson.id);
                                    }}>
                                      Review
                                    </Button>
                                  )}
                                  {lessonStatus === "not_started" && !isLocked && (
                                    <Button size="sm" onClick={(e) => {
                                      e.stopPropagation();
                                      startLesson(selectedTrack.id, module.id, lesson.id);
                                    }}>
                                      Start
                                    </Button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                          
                          <div className="pt-4 border-t border-gray-200 dark:border-gray-700/50">
                            <div className="flex items-center justify-between">
                              <div className="text-sm text-muted-foreground">
                                Module progress: {module.lessons.filter((l: any) => getLessonStatus(selectedTrack.id, module.id, l.id) === "completed").length} of {module.lessons.length} lessons
                              </div>
                              {module.lessons.every((l: any) => getLessonStatus(selectedTrack.id, module.id, l.id) === 'completed') ? (
                                <Badge className="bg-success text-white">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Completed
                                </Badge>
                              ) : (
                                <Button size="sm" onClick={() => {
                                  const nextLesson = module.lessons.find((l: any) => 
                                    getLessonStatus(selectedTrack.id, module.id, l.id) !== 'completed'
                                  );
                                  if (nextLesson) {
                                    startLesson(selectedTrack.id, module.id, nextLesson.id);
                                  }
                                }}>
                                  {module.lessons.some((l: any) => getLessonStatus(selectedTrack.id, module.id, l.id) === 'in_progress') ? "Continue Module" : "Start Module"}
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                ))}
              </div>

              {/* Track Completion */}
              <Card className="bg-gradient-to-r from-brand-50 to-primary-50 border-brand-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-brand-900">Complete the {(() => {
                        const currentRole = roleOptions.find(r => r.value === userRole);
                        return currentRole?.label || 'Learning';
                      })()} Track</h3>
                      <p className="text-brand-700 text-sm">
                        Finish all modules to earn your {(() => {
                          const currentRole = roleOptions.find(r => r.value === userRole);
                          return currentRole?.label || 'Learning';
                        })()} Track Certificate
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Progress value={progressPercentage} className="w-32" />
                      <Button 
                        className="bg-brand-600 hover:bg-brand-700"
                        onClick={() => setShowCertificateModal(true)}
                      >
                        <Award className="mr-2 h-4 w-4" />
                        View Certificate Requirements
                      </Button>
                      <Button 
                        onClick={() => {
                          // Find the next lesson to start
                          if (selectedTrack?.modules) {
                            for (const [moduleIndex, module] of selectedTrack.modules.entries()) {
                              for (const [lessonIndex, lesson] of module.lessons.entries()) {
                                const lessonStatus = getLessonStatus(selectedTrack.id, module.id, lesson.id);
                                const isLocked = isLessonLocked(selectedTrack.id, module.id, lesson.id, lessonIndex, moduleIndex);
                                
                                if (lessonStatus === 'in_progress' || (lessonStatus === 'not_started' && !isLocked)) {
                                  startLesson(selectedTrack.id, module.id, lesson.id);
                                  return;
                                }
                              }
                            }
                            // If no lesson found, start with the first lesson
                            if (selectedTrack.modules[0]?.lessons[0]) {
                              startLesson(selectedTrack.id, selectedTrack.modules[0].id, selectedTrack.modules[0].lessons[0].id);
                            }
                          }
                        }}
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Continue Learning
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
          
          {/* Certificate Requirements Modal */}
          <CertificateRequirements 
            isOpen={showCertificateModal}
            onClose={() => setShowCertificateModal(false)}
            trackTitle={selectedTrack?.title || 'AI Learning Track'}
            userRole={userRole}
            completedLessons={completedLessons}
            totalLessons={totalLessons}
            userProgress={userProgress}
            selectedTrack={selectedTrack}
          />
        </main>
      </div>
    </div>
  );
}

