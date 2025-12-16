import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Home,
  BookOpen,
  Code,
  Library,
  Users,
  Award,
  Settings,
  ChevronRight,
  Play,
  Star,
  Target,
  TrendingUp,
  Calendar,
  Clock,
  Zap,
  Megaphone
} from "lucide-react";
import { Link } from "react-router-dom";
import LoggedInHeader from "@/components/LoggedInHeader";
import { useEffect, useState } from "react";
import { apiMe, apiMeCookie, apiDashboard, apiLearningTracks, apiGetProgress, apiGetSettingsProfile } from "@/lib/api";
import type { DashboardResponse } from "@shared/api";
import { useAuth } from "@/context/AuthContext";

// Updated course navigation for marketing-only version.
// Original navigation kept for future use:
// const sidebarItems = [
//   { icon: Home, label: "Dashboard", href: "/dashboard", active: true },
//   { icon: BookOpen, label: "Learning Path", href: "/learning" },
//   { icon: Code, label: "Sandbox", href: "/sandbox" },
//   { icon: Library, label: "Library", href: "/library" },
//   { icon: Users, label: "Community", href: "/community" },
//   { icon: Award, label: "Certificates", href: "/certificates" },
//   { icon: Settings, label: "Settings", href: "/settings" },
// ];
const sidebarItems = [
  { icon: BookOpen, label: "Courses", href: "/learning" },
  { icon: Award, label: "Achievements", href: "/certificates" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

const skillsData = [
  { name: "Prompt Engineering", progress: 87, level: "Advanced" },
  { name: "Context Design", progress: 65, level: "Intermediate" },
  { name: "Output Evaluation", progress: 72, level: "Intermediate" },
  { name: "Chain-of-Thought", progress: 43, level: "Beginner" },
];

const recentActivity = [
  {
    type: "completed",
    title: "Completed Module: Advanced Prompting Patterns",
    time: "2 hours ago",
    points: 120,
  },
  {
    type: "shared",
    title: "Shared prompt in Community Gallery",
    time: "5 hours ago",
    upvotes: 12,
  },
  {
    type: "certificate",
    title: "Earned Marketing Track Certificate",
    time: "1 day ago",
    badge: "Marketing",
  },
  {
    type: "challenge",
    title: "Won Weekly Challenge: Code Refactoring",
    time: "2 days ago",
    rank: "#1",
  },
];

const upcomingEvents = [
  {
    title: "Live Workshop: Advanced RAG Patterns",
    date: "Tomorrow, 2:00 PM",
    instructor: "Dr. Sarah Chen",
    attendees: 47,
  },
  {
    title: "Community Challenge: Marketing Copy",
    date: "Friday, 10:00 AM",
    duration: "1 week",
    participants: 234,
  },
];

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [displayName, setDisplayName] = useState<string>("there");
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [learningData, setLearningData] = useState<any>(null);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      // Check for token as fallback
      const token = localStorage.getItem("auth_token");
      if (!token) {
        window.location.replace("/login");
      }
    }
  }, [user, authLoading]);
  
  useEffect(() => {
    // Don't proceed if not authenticated
    if (authLoading || !user) {
      return;
    }
    
    (async () => {
      setLoading(true);
      
      // Use user from AuthContext instead of making another API call
      if (user) {
        setDisplayName(user.name?.split(" ")[0] || user.email.split("@")[0]);
      }
      
      // Load all data in parallel instead of sequentially for better performance
      try {
        // Marketing-only version: force marketer role for dashboard stats.
        // Original dynamic role loading retained for reference:
        // let userRole = 'marketer';
        // try {
        //   const profileInfo = await apiGetSettingsProfile();
        //   if (profileInfo?.profile?.personaRole) {
        //     userRole = profileInfo.profile.personaRole;
        //   }
        // } catch (err) {
        //   console.warn("Failed to load profile role:", err);
        // }
        let userRole = 'marketer';

        // Load all data in parallel
        const [dashboardData, tracksData, progressData] = await Promise.allSettled([
          apiDashboard(),
          apiLearningTracks(),
          apiGetProgress()
        ]);
        
        // Process dashboard data
        if (dashboardData.status === 'fulfilled') {
          setData(dashboardData.value);
        }
        
        // Process tracks and progress data
        if (tracksData.status === 'fulfilled' || progressData.status === 'fulfilled') {
          const tracks = tracksData.status === 'fulfilled' ? tracksData.value.tracks || [] : [];
          const userProgress = progressData.status === 'fulfilled' ? progressData.value.progress || [] : [];
          
          // Filter tracks by user role
          const userTracks = tracks.filter((track: any) => track.role === userRole);
          const finalTracks = userTracks.length > 0 ? userTracks : tracks;
          
          // Calculate progress statistics
          const totalLessons = finalTracks.reduce((total: number, track: any) => 
            total + (track.modules || []).reduce((moduleTotal: number, module: any) => 
              moduleTotal + (module.lessons?.length || 0), 0), 0);
          
          const completedLessons = userProgress.filter((p: any) => p.status === 'completed').length;
          const overallProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
          
          // Find current module and next lesson
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
                // Find next lesson in this module
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
          
          // Set learning data
          setLearningData({
            overallProgress,
            completedLessons,
            totalLessons,
            currentModule,
            nextLesson,
            userTracks: finalTracks,
            userProgress
          });
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, authLoading]); // Depend on user and authLoading

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <LoggedInHeader />
        <div className="h-[calc(100vh-4rem)] flex overflow-hidden">
          <aside className="w-64 bg-muted/30 border-r border-gray-200 dark:border-gray-700/40 h-full overflow-y-auto">
            <nav className="p-4 space-y-2">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.href} className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium ${item.active ? "bg-brand-100 border border-brand-200" : "bg-transparent"}`}>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                );
              })}
            </nav>
          </aside>
          <main className="flex-1 p-6 space-y-6 overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-80" />
              </div>
              <Skeleton className="h-6 w-28 rounded-full" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-32" />
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Skeleton className="h-7 w-20" />
                    <Skeleton className="h-3 w-40" />
                    <Skeleton className="h-2 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <Skeleton className="h-5 w-40" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <Skeleton className="h-16 w-16 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-64" />
                        <Skeleton className="h-3 w-72" />
                        <Skeleton className="h-2 w-full" />
                        <Skeleton className="h-3 w-40" />
                      </div>
                    </div>
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-3 w-80" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-3 w-48" />
                          <Skeleton className="h-5 w-16" />
                        </div>
                        <Skeleton className="h-2 w-full" />
                        <Skeleton className="h-3 w-10 ml-auto" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <Skeleton className="h-5 w-40" />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex items-start space-x-3">
                        <Skeleton className="h-2 w-2 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-3 w-64" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <Skeleton className="h-5 w-40" />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="space-y-2 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <Skeleton className="h-4 w-64" />
                        <Skeleton className="h-3 w-40" />
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-3 w-28" />
                          <Skeleton className="h-8 w-16" />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

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
          {/* Welcome Section */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Welcome back, {displayName}!</h1>
              <p className="text-muted-foreground">Continue your AI mastery journey</p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-brand-50 text-brand-700">
                <Zap className="h-3 w-3 mr-1" />
                {data?.streakDays ?? 7}-day streak
              </Badge>
            </div>
          </div>

          {/* Progress Overview */}
          {/* Simplified progress overview for marketing courses */}
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overall Course Progress</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {learningData?.overallProgress ?? data?.progress?.overall ?? 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {learningData?.completedLessons ?? 0} of {learningData?.totalLessons ?? 0} lessons completed
                </p>
                <Progress
                  value={learningData?.overallProgress ?? data?.progress?.overall ?? 0}
                  className="mt-2"
                />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current Learning */}
            <div className="space-y-6">
              {/* Current Module */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Current Module
                    <Badge variant="outline">{learningData?.currentModule?.track ?? data?.currentModule?.track ?? "Marketing Track"}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-brand-100 rounded-lg flex items-center justify-center">
                      <Megaphone className="h-8 w-8 text-brand-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{learningData?.currentModule?.title ?? data?.currentModule?.title ?? "High-Impact Campaign Strategy"}</h3>
                      <p className="text-sm text-muted-foreground">{learningData?.currentModule?.description ?? "Craft targeted AI-assisted marketing campaigns"}</p>
                      <Progress value={learningData?.currentModule?.progress ?? data?.currentModule?.progress ?? 65} className="mt-2" />
                      <p className="text-xs text-muted-foreground mt-1">Lesson {learningData?.currentModule?.lessonIndex ?? data?.currentModule?.lessonIndex ?? 3} of {learningData?.currentModule?.lessonsTotal ?? data?.currentModule?.lessonsTotal ?? 6} • {learningData?.currentModule?.remainingMin ?? data?.currentModule?.remainingMin ?? 25} min remaining</p>
                    </div>
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={() => {
                      if (learningData?.nextLesson) {
                        // Navigate directly to the next lesson
                        window.location.href = `/learning/${learningData.nextLesson.trackId}/${learningData.nextLesson.moduleId}/${learningData.nextLesson.lessonId}`;
                      } else {
                        // Fallback to learning page
                        window.location.href = '/learning';
                      }
                    }}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Continue Learning
                  </Button>
                </CardContent>
              </Card>

              {/* Skills Assessment has moved to Achievements page in marketing version.
                  Original dashboard card kept here for reference:
              <Card>
                <CardHeader>
                  <CardTitle>Skills Assessment</CardTitle>
                  <CardDescription>Your AI workflow expertise across key areas</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(data?.skills ?? skillsData).map((skill) => (
                    <div key={skill.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{skill.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {skill.level}
                        </Badge>
                      </div>
                      <Progress value={skill.progress} className="h-2" />
                      <div className="text-xs text-muted-foreground text-right">
                        {skill.progress}%
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recommended for You</CardTitle>
                  <CardDescription>Based on your progress and goals</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(data?.recommendations ?? []).map((lesson, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      ...
                    </div>
                  ))}
                </CardContent>
              </Card>
              */}
            </div>

            {/* Right-hand dashboard column (activity, events, quick actions) is hidden
                in the marketing courses experience but retained here for future use.
            <div className="space-y-6">
              <Card>...Recent Activity...</Card>
              <Card>...Upcoming Events...</Card>
              <Card>...Quick Actions...</Card>
            </div>
            */}
          </div>
        </main>
      </div>
    </div>
  );
}

