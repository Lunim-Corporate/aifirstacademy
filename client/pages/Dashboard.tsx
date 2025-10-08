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
  Zap
} from "lucide-react";
import { Link } from "react-router-dom";
import LoggedInHeader from "@/components/LoggedInHeader";
import { useEffect, useState } from "react";
import { apiMe, apiMeCookie, apiDashboard } from "@/lib/api";
import type { DashboardResponse } from "@shared/api";

const sidebarItems = [
  { icon: Home, label: "Dashboard", href: "/dashboard", active: true },
  { icon: BookOpen, label: "Learning Path", href: "/learning" },
  { icon: Code, label: "Sandbox", href: "/sandbox" },
  { icon: Library, label: "Library", href: "/library" },
  { icon: Users, label: "Community", href: "/community" },
  { icon: Award, label: "Certificates", href: "/certificates" },
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
    title: "Earned Engineering Track Certificate",
    time: "1 day ago",
    badge: "Engineering",
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
  const [displayName, setDisplayName] = useState<string>("there");
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  useEffect(() => {
    (async () => {
      try {
        const me = await apiMeCookie();
        setDisplayName(me.user.name?.split(" ")[0] || me.user.email.split("@")[0]);
      } catch {
        const token = localStorage.getItem("auth_token");
        if (token) try { const me = await apiMe(token); setDisplayName(me.user.name?.split(" ")[0] || me.user.email.split("@")[0]); } catch {}
      }
      try {
        const d = await apiDashboard();
        setData(d);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data?.progress?.overall ?? 73}%</div>
                <p className="text-xs text-muted-foreground">+{data?.progress?.deltaWeek ?? 12}% from last week</p>
                <Progress value={data?.progress?.overall ?? 73} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Modules Completed</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data?.modules?.completed ?? 18}</div>
                <p className="text-xs text-muted-foreground">of {data?.modules?.total ?? 24} total</p>
                <Progress value={data?.modules?.percent ?? 75} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sandbox Score</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data?.sandboxScore?.average ?? 87}</div>
                <p className="text-xs text-muted-foreground">Average effectiveness</p>
                <div className="flex space-x-1 mt-2">
                  {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${i < Math.round(((data?.sandboxScore?.average ?? 87) / 100) * 5) ? "fill-warning text-warning" : "text-muted-foreground"}`}
                  />
                ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Current Learning & Skills */}
            <div className="lg:col-span-2 space-y-6">
              {/* Current Module */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Current Module
                    <Badge variant="outline">{data?.currentModule?.track ?? "Engineering Track"}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-brand-100 rounded-lg flex items-center justify-center">
                      <Code className="h-8 w-8 text-brand-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{data?.currentModule?.title ?? "Advanced Prompt Engineering"}</h3>
                      <p className="text-sm text-muted-foreground">Learn complex prompting patterns and techniques</p>
                      <Progress value={data?.currentModule?.progress ?? 65} className="mt-2" />
                      <p className="text-xs text-muted-foreground mt-1">Lesson {data?.currentModule?.lessonIndex ?? 3} of {data?.currentModule?.lessonsTotal ?? 6} • {data?.currentModule?.remainingMin ?? 25} min remaining</p>
                    </div>
                  </div>
                  <Button asChild className="w-full">
                    <Link to="/learning">
                      <Play className="mr-2 h-4 w-4" />
                      Continue Learning
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Skills Map */}
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

              {/* Recommended Lessons */}
              <Card>
                <CardHeader>
                  <CardTitle>Recommended for You</CardTitle>
                  <CardDescription>Based on your progress and goals</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(data?.recommendations ?? [
                    { title: "Chain-of-Thought Prompting", track: "Engineering", duration: "15 min", difficulty: "Intermediate" },
                    { title: "API Integration Patterns", track: "Engineering", duration: "20 min", difficulty: "Advanced" },
                    { title: "Error Handling & Validation", track: "Engineering", duration: "12 min", difficulty: "Beginner" },
                  ]).map((lesson, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="space-y-1">
                        <h4 className="font-medium">{lesson.title}</h4>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <Badge variant="secondary" className="px-2 py-0">
                            {lesson.track}
                          </Badge>
                          <span>•</span>
                          <span>{lesson.duration}</span>
                          <span>•</span>
                          <span>{lesson.difficulty}</span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Activity & Events Sidebar */}
            <div className="space-y-6">
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(data?.activity ?? recentActivity).map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        activity.type === "completed" ? "bg-success" :
                        activity.type === "shared" ? "bg-brand-600" :
                        activity.type === "certificate" ? "bg-warning" :
                        "bg-primary-600"
                      }`} />
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                        {activity.points && (
                          <Badge variant="secondary" className="text-xs">
                            +{activity.points} XP
                          </Badge>
                        )}
                        {activity.upvotes && (
                          <Badge variant="secondary" className="text-xs">
                            {activity.upvotes} upvotes
                          </Badge>
                        )}
                        {activity.badge && (
                          <Badge className="text-xs bg-warning/10 text-warning-foreground">
                            {activity.badge}
                          </Badge>
                        )}
                        {activity.rank && (
                          <Badge className="text-xs bg-success/10 text-success-foreground">
                            {activity.rank}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Upcoming Events */}
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Events</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(data?.events ?? upcomingEvents).map((event, index) => (
                    <div key={index} className="space-y-2 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <h4 className="font-medium text-sm">{event.title}</h4>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{event.date}</span>
                      </div>
                      {event.instructor && (
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <Avatar className="h-4 w-4">
                            <AvatarFallback className="text-xs">SC</AvatarFallback>
                          </Avatar>
                          <span>{event.instructor}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {event.attendees ? `${event.attendees} attending` :
                           event.participants ? `${event.participants} participants` : ""}
                        </span>
                        <Button asChild size="sm" variant="outline" className="text-xs">
                          <Link to="/community">Join</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button asChild variant="outline" className="w-full justify-start">
                    <Link to="/sandbox">
                      <Code className="mr-2 h-4 w-4" />
                      Open Sandbox
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-start">
                    <Link to="/community">
                      <Users className="mr-2 h-4 w-4" />
                      Browse Community
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-start">
                    <Link to="/certificates">
                      <Award className="mr-2 h-4 w-4" />
                      View Certificates
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

