import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  Trophy
} from "lucide-react";
import { Link } from "react-router-dom";
import LoggedInHeader from "@/components/LoggedInHeader";
import { useEffect, useState } from "react";
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
        setTracks(roleTracks);
        
        if (roleTracks.length > 0) {
          setSelectedTrack(roleTracks[0]);
          setExpandedModules([roleTracks[0].modules[0]?.id]);
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
          // Mock user stats for now
          setUserStats({
            totalLessons: roleTracks.reduce((total: number, track: any) => 
              total + track.modules.reduce((moduleTotal: number, module: any) => 
                moduleTotal + (module.lessons?.length || 0), 0), 0),
            completedLessons: 0,
            completionRate: 0,
            totalTime: roleTracks.reduce((total: number, track: any) => 
              total + (track.estimatedHours || 0), 0),
            streakDays: 7
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
      p.trackId === trackId && p.moduleId === moduleId && p.lessonId === lessonId
    );
    return progress?.status || 'not_started';
  };
  
  const startLesson = async (trackId: string, moduleId: string, lessonId: string) => {
    try {
      await apiSetLessonProgress({ trackId, moduleId, lessonId, status: 'in_progress' });
      window.location.href = `/learning/${trackId}/${moduleId}/${lessonId}`;
    } catch (error) {
      console.error('Failed to start lesson:', error);
      // Fallback to direct navigation
      window.location.href = `/learning/${trackId}/${moduleId}/${lessonId}`;
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

  // Safe calculations with null checks
  const completedLessons = selectedTrack?.modules?.reduce((total: number, module: any) => 
    total + module.lessons.filter((lesson: any) => getLessonStatus(selectedTrack.id, module.id, lesson.id) === "completed").length, 0
  ) || 0;
  
  const totalLessons = selectedTrack?.modules?.reduce((total: number, module: any) => total + module.lessons.length, 0) || 0;
  const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

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
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold">Learning Path</h1>
                <p className="text-muted-foreground">
                  Master AI skills tailored to your {(() => {
                    const currentRole = roleOptions.find(r => r.value === userRole);
                    return currentRole?.label.toLowerCase() || 'role';
                  })()} role
                </p>
              </div>
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
                  <div className="text-2xl font-bold">{userStats.completionRate}%</div>
                  <p className="text-xs text-muted-foreground">Progress</p>
                  <Progress value={userStats.completionRate} className="mt-2" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{userStats.completedLessons}</div>
                  <p className="text-xs text-muted-foreground">of {userStats.totalLessons} lessons</p>
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
          
          {/* Quick Recommendations */}
          {recommendations.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Recommended for You</h2>
                <Button variant="ghost" size="sm">View All</Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recommendations.slice(0, 3).map((rec, index) => (
                  <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => {
                    startLesson(rec.trackId, rec.moduleId, rec.lessonId);
                  }}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        {(() => {
                          const Icon = getLessonIcon(rec.type);
                          return <Icon className="h-5 w-5 text-brand-600 mt-1" />;
                        })()}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{rec.lessonTitle}</h3>
                          <p className="text-sm text-muted-foreground truncate">{rec.trackTitle}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">{rec.level}</Badge>
                            <span className="text-xs text-muted-foreground">{rec.duration}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
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
                            const isLocked = lessonStatus === 'not_started' && lessonIndex > 0 && 
                              module.lessons.slice(0, lessonIndex).some((prevLesson: any) => 
                                getLessonStatus(selectedTrack.id, module.id, prevLesson.id) !== 'completed'
                              );
                            
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
                      <Button className="bg-brand-600 hover:bg-brand-700">
                        <Award className="mr-2 h-4 w-4" />
                        View Certificate Requirements
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

