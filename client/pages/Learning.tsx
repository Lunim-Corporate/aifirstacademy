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
import { Link, useLocation } from "react-router-dom";
import LoggedInHeader from "@/components/LoggedInHeader";
import CertificateRequirements from "@/components/CertificateRequirements";
import { useEffect, useState, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { apiLearningTracks, apiGetProgress, apiSetLessonProgress, apiMe, apiMeCookie, apiGetSettingsProfile } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

// Updated course navigation for marketing-only version.
// Original navigation kept for future use:
// const sidebarItems = [
//   { icon: Home, label: "Dashboard", href: "/dashboard" },
//   { icon: BookOpen, label: "Learning Path", href: "/learning", active: true },
//   { icon: Code, label: "Sandbox", href: "/sandbox" },
//   { icon: Library, label: "Library", href: "/library" },
//   { icon: Users, label: "Community", href: "/community" },
//   { icon: Award, label: "Certificates", href: "/certificates" },
//   { icon: Settings, label: "Settings", href: "/settings" },
// ];
const sidebarItems = [
  { icon: BookOpen, label: "Courses", href: "/learning", active: true },
  { icon: Award, label: "Achievements", href: "/certificates" },
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
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [tracks, setTracks] = useState<any[]>([]);
  const [allTracks, setAllTracks] = useState<any[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<any>(null);
  const [userProgress, setUserProgress] = useState<any[]>([]);
  const [userRole, setUserRole] = useState('marketer');
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [userStats, setUserStats] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    console.log('Auth check:', { authLoading, user });
    if (!authLoading && !user) {
      const token = localStorage.getItem("auth_token");
      console.log('No user found, checking token:', token);
      if (!token) {
        console.log('No token found, redirecting to login');
        window.location.replace("/login");
      } else {
        console.log('Token found but no user, this might indicate an auth issue');
      }
    } else if (!authLoading && user) {
      console.log('User authenticated:', user);
    }
  }, [user, authLoading]);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  
  const roleOptions = [
    // { value: 'engineer', label: 'Engineer', icon: Code, description: 'Software development and technical skills' },
    // { value: 'manager', label: 'Manager', icon: Users, description: 'Leadership and strategic AI implementation' },
    // { value: 'designer', label: 'Designer', icon: Target, description: 'AI-powered design and creativity' },
    { value: 'marketer', label: 'Marketer', icon: Trophy, description: 'AI-driven marketing and growth strategies' },
    // { value: 'researcher', label: 'Researcher', icon: BookOpen, description: 'Advanced AI research and methodologies' },
  ];
  
  useEffect(() => {
    // Don't proceed if not authenticated
    if (authLoading || !user) {
      return;
    }
    
    const loadData = async () => {
      console.log('Loading learning data for user:', user);
      // Marketing-only version: force marketer role for courses.
      // Original dynamic role loading kept for reference:
      // let currentUserRole = 'marketer';
      // const [profileResult, tracksResult, progressResult] = await Promise.allSettled([
      //   currentUserRole === 'marketer' ? apiGetSettingsProfile() : Promise.resolve(null),
      //   apiLearningTracks(),
      //   apiGetProgress()
      // ]);
      // if (profileResult.status === 'fulfilled' && profileResult.value?.profile?.personaRole) {
      //   currentUserRole = profileResult.value.profile.personaRole;
      // }
      let currentUserRole = 'marketer';

      try {
        // Load tracks/progress in parallel
        const [tracksResult, progressResult] = await Promise.allSettled([
          apiLearningTracks(),
          apiGetProgress()
        ]);

        // Process tracks data
        if (tracksResult.status === 'fulfilled') {
          const allTracksData = tracksResult.value.tracks || [];
          setAllTracks(allTracksData);
          
          // Filter tracks by determined user role
          const roleTracks = allTracksData.filter((track: any) => track.role === currentUserRole);
          setTracks(roleTracks);
          
          if (roleTracks.length > 0) {
            setSelectedTrack(roleTracks[0]);
            // Expand first module if it exists
            if (roleTracks[0].modules && roleTracks[0].modules.length > 0) {
              setExpandedModules([roleTracks[0].modules[0].id]);
            }
          }
          
          // Process progress data
          const userProgress = progressResult.status === 'fulfilled' ? (progressResult.value.progress || []) : [];
          setUserProgress(userProgress);
          
          // Calculate user stats and recommendations
          try {
            const totalLessonsCount = roleTracks.reduce((total: number, track: any) => 
              total + (track.modules || []).reduce((moduleTotal: number, module: any) => 
                moduleTotal + (module.lessons?.length || 0), 0), 0);
              
            const completedLessonsCount = userProgress.filter((p: any) => p.status === 'completed').length;
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
        }
        
      } catch (error) {
        console.error('Failed to load learning data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [user, authLoading]); // Depend on user and authLoading instead of userRole to avoid loops
  
  const handleRoleChange = (newRole: string) => {
    setUserRole(newRole);
    setShowRoleSelector(false);
    setLoading(true);
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId)
        : [moduleId] // Only keep the newly expanded module, auto-collapse others
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
    
    console.log('Starting lesson with params:', { trackId, moduleId, lessonId, checkLocked });
    
    selectedTrack?.modules?.forEach((module: any, mIdx: number) => {
      const lIdx = module.lessons.findIndex((l: any) => l.id === lessonId && module.id === moduleId);
      if (lIdx !== -1) {
        lessonOrder = lIdx;
        moduleOrder = mIdx;
        lessonTitle = module.lessons[lIdx].title;
      }
    });
    
    console.log('Lesson details found:', { lessonOrder, moduleOrder, lessonTitle });
    
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
        console.log('Attempting token-based authentication...');
        userInfo = await apiMe();
        console.log('User authenticated via token:', userInfo.id);
      } catch (tokenError) {
        console.log('Token authentication failed, trying cookie authentication:', tokenError);
        try {
          console.log('Attempting cookie-based authentication...');
          userInfo = await apiMeCookie();
          console.log('User authenticated via cookie:', userInfo.id);
        } catch (cookieError) {
          console.error('Both token and cookie authentication failed:', { tokenError, cookieError });
          
          // Check if we actually have a token but it's invalid
          const token = localStorage.getItem('auth_token');
          console.log('Current auth token status:', { tokenExists: !!token, tokenLength: token ? token.length : 0 });
          
          if (token) {
            console.log('Token exists but authentication failed, clearing it');
            localStorage.removeItem('auth_token');
          }
          
          // Don't redirect to login if we're already on a protected page
          // This might be causing the infinite loop
          // Check if we're already on a login-required page
          console.log('Current pathname:', window.location.pathname);
          if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
            alert('Authentication failed. Please log in again.');
            window.location.href = '/login';
          } else {
            alert('Authentication failed. Please try logging in again.');
          }
          return;
        }
      }
      
      // Set lesson as in progress
      console.log('Setting lesson progress to in_progress...');
      try {
        await apiSetLessonProgress({ trackId, moduleId, lessonId, status: 'in_progress' });
        console.log('Progress updated successfully');
      } catch (progressError) {
        console.error('Failed to update progress:', progressError);
        // Continue anyway since this shouldn't block lesson access
      }
      
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
                      ? "text-[#bdeeff] border border-[#bdeeff]"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${item.active ? "text-[#bdeeff]" : ""}`} />
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
              <h1 className="text-3xl font-bold">Courses</h1>
              <p className="text-muted-foreground">
                Master AI skills tailored to your {(() => {
                  const currentRole = roleOptions.find(r => r.value === userRole);
                  return currentRole?.label.toLowerCase() || 'role';
                })()} role
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-sm py-1 px-3" style={{ backgroundColor: '#bdeeff', color: '#000' }}>
                {(() => {
                  const currentRole = roleOptions.find(r => r.value === userRole);
                  const Icon = currentRole?.icon || Code;
                  return (
                    <>
                      <Icon className="h-4 w-4 mr-2" style={{ color: '#000' }} />
                      {currentRole?.label || 'Engineer'}
                    </>
                  );
                })()}
              </Badge>
            </div>
          </div>
          
          {/* Learning Stats Dashboard */}
          {/* Overall progress - kept, now full width and simpler */}
          {userStats && (
            <div className="grid grid-cols-1 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold">{progressPercentage}%</div>
                      <p className="text-xs text-muted-foreground">
                        Overall progress across all marketing courses
                      </p>
                    </div>
                    <div className="w-48">
                      <Progress value={progressPercentage} className="h-2" />
                      <p className="mt-1 text-[11px] text-muted-foreground text-right">
                        {completedLessons} of {totalLessons} lessons completed • {availableLessons} unlocked
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Recommendations and other dashboard-style boxes are hidden in the
             simplified Courses view but preserved here for future use.

          {recommendations.length > 0 && (
            <div className="space-y-6">...Recommended for You cards...</div>
          )}
          */}
          
          {/* Track Content - Only show if selectedTrack exists */}
          {selectedTrack && (
            <>
              {/* Courses list */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Courses</h2>
                {selectedTrack.modules?.map((module: any, moduleIndex: number) => {
                  const totalLessonDurationMinutes = module.lessons.reduce(
                    (sum: number, l: any) => sum + (l.durationMin || 0),
                    0
                  );
                  const hours = Math.round((totalLessonDurationMinutes / 60) * 10) / 10;
                  const completedCount = module.lessons.filter(
                    (l: any) => getLessonStatus(selectedTrack.id, module.id, l.id) === "completed"
                  ).length;
                  const isCompleted = completedCount === module.lessons.length;
                  const isInProgress = !isCompleted && completedCount > 0;

                  // Determine if the course is locked based on previous modules
                  let isCourseLocked = false;
                  if (moduleIndex > 0) {
                    const previousModule = selectedTrack.modules[moduleIndex - 1];
                    const prevComplete = previousModule.lessons.every(
                      (l: any) => getLessonStatus(selectedTrack.id, previousModule.id, l.id) === "completed"
                    );
                    isCourseLocked = !prevComplete;
                  }

                  // Check if this module is expanded
                  const isExpanded = expandedModules.includes(module.id);

                  return (
                    <Collapsible key={module.id} open={isExpanded} onOpenChange={() => toggleModule(module.id)}>
                      <Card
                        className={`overflow-hidden border ${
                          isCourseLocked
                            ? "opacity-70 border-dashed"
                            : "transition-colors"
                        }`}
                      >
                        <CollapsibleTrigger asChild>
                          <CardHeader className={`flex flex-row items-center justify-between space-y-0 cursor-pointer ${isExpanded ? 'bg-muted/30' : ''}`}>
                            <div className="flex items-center space-x-4">
                              <div
                                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                                  isCompleted
                                    ? "bg-success border-success text-white"
                                    : isInProgress
                                    ? "bg-brand-100 border-brand-600 text-brand-600"
                                    : "bg-muted border-gray-200 dark:border-gray-700 text-muted-foreground"
                                }`}
                              >
                                {isCompleted ? (
                                  <CheckCircle className="h-4 w-4" />
                                ) : (
                                  <span className="text-sm font-semibold">{moduleIndex + 1}</span>
                                )}
                              </div>
                              <div className="text-left">
                                <CardTitle>{module.title}</CardTitle>
                                <CardDescription>
                                  {module.description}
                                </CardDescription>
                                {isCourseLocked && (
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    Complete the previous course to unlock this one.
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="flex flex-col items-end space-y-1">
                                <div className="text-sm font-medium">{hours}h</div>
                                <div className="text-xs text-muted-foreground">
                                  {completedCount} of {module.lessons.length} lessons
                                </div>
                                <Badge
                                  variant="outline"
                                  className={
                                    isCompleted
                                      ? "bg-success/10 text-success"
                                      : isInProgress
                                      ? "bg-brand-50 text-brand-700"
                                      : isCourseLocked
                                      ? "text-muted-foreground"
                                      : "bg-blue-50 text-blue-700"
                                  }
                                >
                                  {isCompleted
                                    ? "Completed"
                                    : isInProgress
                                    ? "In Progress"
                                    : isCourseLocked
                                    ? "Locked"
                                    : "Ready to start"}
                                </Badge>
                              </div>
                              <ChevronDown className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </div>
                          </CardHeader>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="px-6 pb-6 pt-2">
                          <div className="space-y-3 mt-2">
                            {module.lessons.map((lesson: any, lessonIndex: number) => {
                              // Check if lesson is locked based on progression rules
                              const lessonLocked = isLessonLocked(selectedTrack.id, module.id, lesson.id, lessonIndex, moduleIndex);
                              const lessonStatus = getLessonStatus(selectedTrack.id, module.id, lesson.id);
                              const isLessonCompleted = lessonStatus === 'completed';
                              
                              const LessonIcon = getLessonIcon(lesson.type);
                              
                              // Determine if this lesson is currently active based on URL
                              const isActiveLesson = location.pathname === `/learning/${selectedTrack.id}/${module.id}/${lesson.id}`;
                              
                              return (
                                <div 
                                  key={lesson.id}
                                  className={`flex items-center justify-between p-3 rounded-lg border ${
                                    lessonLocked 
                                      ? "opacity-60 cursor-not-allowed" 
                                      : "hover:bg-muted/50 cursor-pointer"
                                  } ${isLessonCompleted ? "bg-success/10 border-success/20" : ""}`}
                                  onClick={() => {
                                    if (!lessonLocked) {
                                      startLesson(selectedTrack.id, module.id, lesson.id, true);
                                    }
                                  }}
                                >
                                  <div className="flex items-center space-x-3">
                                    <div className={`p-2 rounded-full ${isLessonCompleted ? "bg-success text-white" : lessonLocked ? "bg-muted text-muted-foreground" : isActiveLesson ? "bg-[#bdeeff] text-black" : "bg-brand-100 text-brand-600"}`}>
                                      {isLessonCompleted ? (
                                        <CheckCircle className="h-4 w-4" />
                                      ) : (
                                        <LessonIcon className="h-4 w-4" />
                                      )}
                                    </div>
                                    <div>
                                      <div className="font-medium text-sm">{lesson.title}</div>
                                      <div className="text-xs text-muted-foreground flex items-center space-x-2">
                                        <span>{lesson.durationMin || 0} min</span>
                                        {lessonLocked && (
                                          <span className="flex items-center">
                                            <Lock className="h-3 w-3 mr-1" />
                                            Locked
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Badge 
                                      variant="outline" 
                                      className={`text-xs ${
                                        isLessonCompleted 
                                          ? "bg-success/10 text-success border-success/20" 
                                          : lessonLocked 
                                            ? "bg-muted text-muted-foreground" 
                                            : "bg-blue-50 text-blue-700 cursor-pointer hover:bg-blue-100"
                                      }`}
                                      onClick={() => {
                                        if (!lessonLocked) {
                                          startLesson(selectedTrack.id, module.id, lesson.id, false); // Don't check locked status when clicking badge
                                        }
                                      }}
                                    >
                                      {isLessonCompleted 
                                        ? "Completed" 
                                        : lessonLocked 
                                          ? "Locked" 
                                          : "Ready"}
                                    </Badge>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>
                  );
                })}
              </div>

              {/* Track completion section hidden for marketing MVP, kept for future use.
              <Card className="bg-gradient-to-r from-brand-50 to-primary-50 border-brand-200">
                <CardContent className="pt-6">...</CardContent>
              </Card>
              */}
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

