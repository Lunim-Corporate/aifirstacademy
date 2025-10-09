import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 

  Users,
  UserPlus,
  Upload,
  Download,
  Settings,
  BarChart3,
  FileText,
  Calendar,
  Mail,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  TrendingUp,
  BookOpen,
  Clock,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Copy,
  Trophy
} from "lucide-react";
import { useState, useEffect } from "react";
import AdminHeader from "@/components/AdminHeader";
import { apiCreateChallenge, apiListChallengesAdmin, apiUpdateChallenge, apiDeleteChallenge } from "@/lib/api";

const cohorts = [
  {
    id: "cohort-1",
    name: "Engineering Team Q1 2024",
    company: "TechCorp Inc.",
    startDate: "2024-01-15",
    endDate: "2024-03-15",
    status: "active",
    track: "Engineering",
    totalUsers: 25,
    activeUsers: 23,
    completionRate: 76,
    avgProgress: 68,
    instructor: "Sarah Chen",
    description: "Comprehensive AI workflow training for engineering teams"
  },
  {
    id: "cohort-2", 
    name: "Marketing Department Upskill",
    company: "GrowthCo",
    startDate: "2024-02-01",
    endDate: "2024-04-01",
    status: "active",
    track: "Marketing",
    totalUsers: 18,
    activeUsers: 17,
    completionRate: 45,
    avgProgress: 34,
    instructor: "Mike Rodriguez",
    description: "AI-powered marketing and content creation training"
  },
  {
    id: "cohort-3",
    name: "Design Team AI Workshop",
    company: "Creative Studio",
    startDate: "2024-01-01",
    endDate: "2024-02-28",
    status: "completed",
    track: "Design",
    totalUsers: 12,
    activeUsers: 12,
    completionRate: 92,
    avgProgress: 98,
    instructor: "Alex Kim",
    description: "AI integration for creative design workflows"
  },
];

const users = [
  {
    id: "user-1",
    name: "John Smith",
    email: "john.smith@techcorp.com",
    role: "Engineer",
    cohort: "Engineering Team Q1 2024",
    progress: 85,
    modulesCompleted: 4,
    totalModules: 6,
    lastActive: "2 hours ago",
    status: "active",
    joinDate: "2024-01-15"
  },
  {
    id: "user-2",
    name: "Emma Wilson",
    email: "emma.wilson@techcorp.com", 
    role: "Senior Engineer",
    cohort: "Engineering Team Q1 2024",
    progress: 92,
    modulesCompleted: 5,
    totalModules: 6,
    lastActive: "1 day ago",
    status: "active",
    joinDate: "2024-01-15"
  },
  {
    id: "user-3",
    name: "David Lee",
    email: "david.lee@growthco.com",
    role: "Marketing Manager",
    cohort: "Marketing Department Upskill",
    progress: 45,
    modulesCompleted: 2,
    totalModules: 5,
    lastActive: "3 days ago",
    status: "inactive",
    joinDate: "2024-02-01"
  },
];

const analytics = {
  totalCohorts: 15,
  totalUsers: 342,
  activeUsers: 298,
  avgCompletionRate: 73,
  totalModulesCompleted: 1456,
  engagementScore: 8.4,
  monthlyGrowth: 12.5,
  revenueThisMonth: 45600
};

export default function Admin() {
  const [selectedCohort, setSelectedCohort] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  const [isCreateCohortOpen, setIsCreateCohortOpen] = useState(false);
  const [isUploadUsersOpen, setIsUploadUsersOpen] = useState(false);
  const [isCreateChallengeOpen, setIsCreateChallengeOpen] = useState(false);
  
  // Challenge creation form states
  const [challengeTitle, setChallengeTitle] = useState("");
  const [challengeDescription, setChallengeDescription] = useState("");
  const [challengeStartDate, setChallengeStartDate] = useState("");
  const [challengeEndDate, setChallengeEndDate] = useState("");
  const [challengeSubmitting, setChallengeSubmitting] = useState(false);
  
  // Challenge management states
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loadingChallenges, setLoadingChallenges] = useState(true);
  const [isEditChallengeOpen, setIsEditChallengeOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<any>(null);
  const [deletingChallengeId, setDeletingChallengeId] = useState<string | null>(null);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = userFilter === "all" || user.status === userFilter;
    const matchesCohort = selectedCohort === "all" || user.cohort === selectedCohort;
    
    return matchesSearch && matchesFilter && matchesCohort;
  });

  // Load challenges on mount
  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    try {
      setLoadingChallenges(true);
      const { challenges: challengeData } = await apiListChallengesAdmin();
      setChallenges(challengeData);
    } catch (e: any) {
      console.error("Failed to load challenges:", e);
      // Only show alert if it's not an auth error
      if (!e?.message?.toLowerCase().includes('unauthorized')) {
        alert("Failed to load challenges: " + (e?.message || "Unknown error"));
      }
    } finally {
      setLoadingChallenges(false);
    }
  };

  const handleEditChallenge = (challenge: any) => {
    setEditingChallenge(challenge);
    setChallengeTitle(challenge.title || "");
    setChallengeDescription(challenge.description || "");
    setChallengeStartDate(challenge.startAt ? new Date(challenge.startAt).toISOString().slice(0, 16) : "");
    setChallengeEndDate(challenge.endAt ? new Date(challenge.endAt).toISOString().slice(0, 16) : "");
    setIsEditChallengeOpen(true);
  };

  const handleDeleteChallenge = async (challengeId: string) => {
    if (!confirm("Are you sure you want to delete this challenge? This action cannot be undone.")) {
      return;
    }
    
    try {
      setDeletingChallengeId(challengeId);
      await apiDeleteChallenge(challengeId);
      alert("Challenge deleted successfully!");
      loadChallenges(); // Reload the challenges list
    } catch (e: any) {
      alert("Failed to delete challenge: " + (e?.message || "Unknown error"));
    } finally {
      setDeletingChallengeId(null);
    }
  };

  const resetChallengeForm = () => {
    setChallengeTitle("");
    setChallengeDescription("");
    setChallengeStartDate("");
    setChallengeEndDate("");
    setEditingChallenge(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <AdminHeader />

      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Admin Console</h1>
            <p className="text-muted-foreground">Manage cohorts, users, and track progress</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            <Dialog open={isCreateCohortOpen} onOpenChange={setIsCreateCohortOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-primary-600 to-brand-600 hover:from-primary-700 hover:to-brand-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Cohort
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Cohort</DialogTitle>
                  <DialogDescription>
                    Set up a new learning cohort for your organization
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="cohort-name">Cohort Name</Label>
                    <Input id="cohort-name" placeholder="e.g. Engineering Team Q2 2024" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input id="company" placeholder="Company name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="track">Learning Track</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select track" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="engineering">Engineering</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="design">Design</SelectItem>
                        <SelectItem value="research">Research</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instructor">Instructor</Label>
                    <Input id="instructor" placeholder="Instructor name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="start-date">Start Date</Label>
                    <Input id="start-date" type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-date">End Date</Label>
                    <Input id="end-date" type="date" />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" placeholder="Cohort description and objectives" />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateCohortOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setIsCreateCohortOpen(false)}>
                    Create Cohort
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 max-w-3xl">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="cohorts">Cohorts</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="challenges">Challenges</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Cohorts</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalCohorts}</div>
                  <p className="text-xs text-muted-foreground">
                    +2 from last month
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.activeUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    of {analytics.totalUsers} total users
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Completion</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.avgCompletionRate}%</div>
                  <p className="text-xs text-muted-foreground">
                    +5% from last month
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${analytics.revenueThisMonth.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    +{analytics.monthlyGrowth}% growth
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Cohorts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cohorts.slice(0, 3).map((cohort) => (
                    <div key={cohort.id} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{cohort.name}</div>
                        <div className="text-sm text-muted-foreground">{cohort.company}</div>
                      </div>
                      <Badge variant={cohort.status === "active" ? "default" : "secondary"}>
                        {cohort.status}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Users to Cohort
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Mail className="mr-2 h-4 w-4" />
                    Send Reminder Emails
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Progress Report
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="mr-2 h-4 w-4" />
                    Schedule Workshop
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Cohorts Tab */}
          <TabsContent value="cohorts" className="space-y-6">
            <div className="space-y-4">
              {cohorts.map((cohort) => (
                <Card key={cohort.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center space-x-2">
                          <span>{cohort.name}</span>
                          <Badge variant={cohort.status === "active" ? "default" : cohort.status === "completed" ? "secondary" : "outline"}>
                            {cohort.status}
                          </Badge>
                        </CardTitle>
                        <CardDescription>{cohort.description}</CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Company</div>
                        <div className="font-medium">{cohort.company}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Track</div>
                        <Badge variant="outline">{cohort.track}</Badge>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Duration</div>
                        <div className="font-medium">
                          {new Date(cohort.startDate).toLocaleDateString()} - {new Date(cohort.endDate).toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Instructor</div>
                        <div className="font-medium">{cohort.instructor}</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Total Users</div>
                        <div className="text-2xl font-bold">{cohort.totalUsers}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Active Users</div>
                        <div className="text-2xl font-bold">{cohort.activeUsers}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Avg Progress</div>
                        <div className="text-2xl font-bold">{cohort.avgProgress}%</div>
                        <Progress value={cohort.avgProgress} className="mt-2" />
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Completion Rate</div>
                        <div className="text-2xl font-bold">{cohort.completionRate}%</div>
                        <Progress value={cohort.completionRate} className="mt-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCohort} onValueChange={setSelectedCohort}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="All Cohorts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cohorts</SelectItem>
                  {cohorts.map((cohort) => (
                    <SelectItem key={cohort.id} value={cohort.name}>
                      {cohort.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="active">Active Users</SelectItem>
                  <SelectItem value="inactive">Inactive Users</SelectItem>
                </SelectContent>
              </Select>
              <Dialog open={isUploadUsersOpen} onOpenChange={setIsUploadUsersOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Upload className="h-4 w-4 mr-2" />
                    Import Users
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Import Users</DialogTitle>
                    <DialogDescription>
                      Upload a CSV file to bulk import users to a cohort
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Select Cohort</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose cohort" />
                        </SelectTrigger>
                        <SelectContent>
                          {cohorts.map((cohort) => (
                            <SelectItem key={cohort.id} value={cohort.id}>
                              {cohort.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>CSV File</Label>
                      <Input type="file" accept=".csv" />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      CSV should include: name, email, role columns
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsUploadUsersOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => setIsUploadUsersOpen(false)}>
                      Import
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Users Table */}
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Cohort</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {user.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.cohort}</div>
                          <div className="text-sm text-muted-foreground">{user.role}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>{user.progress}%</span>
                            <span className="text-muted-foreground">
                              {user.modulesCompleted}/{user.totalModules}
                            </span>
                          </div>
                          <Progress value={user.progress} className="h-2" />
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.lastActive}
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.status === "active" ? "default" : "secondary"}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Mail className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Challenges Tab */}
          <TabsContent value="challenges" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Challenge Management</h2>
                <p className="text-muted-foreground">Create and manage community challenges</p>
              </div>
              <Dialog open={isCreateChallengeOpen} onOpenChange={setIsCreateChallengeOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-primary-600 to-brand-600 hover:from-primary-700 hover:to-brand-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Challenge
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Challenge</DialogTitle>
                    <DialogDescription>
                      Create a new challenge for the community to participate in
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="challenge-title">Challenge Title</Label>
                      <Input 
                        id="challenge-title" 
                        placeholder="e.g. Creative Writing Challenge" 
                        value={challengeTitle}
                        onChange={(e) => setChallengeTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="challenge-description">Description</Label>
                      <Textarea 
                        id="challenge-description" 
                        placeholder="Describe the challenge, rules, and what participants should create..."
                        value={challengeDescription}
                        onChange={(e) => setChallengeDescription(e.target.value)}
                        className="min-h-[100px]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="challenge-start-date">Start Date</Label>
                        <Input 
                          id="challenge-start-date" 
                          type="datetime-local" 
                          value={challengeStartDate}
                          onChange={(e) => setChallengeStartDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="challenge-end-date">End Date</Label>
                        <Input 
                          id="challenge-end-date" 
                          type="datetime-local" 
                          value={challengeEndDate}
                          onChange={(e) => setChallengeEndDate(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => {
                      setIsCreateChallengeOpen(false);
                      resetChallengeForm();
                    }} disabled={challengeSubmitting}>
                      Cancel
                    </Button>
                    <Button onClick={async () => {
                      if (!challengeTitle.trim() || !challengeDescription.trim() || !challengeStartDate || !challengeEndDate) {
                        alert("Please fill in all required fields.");
                        return;
                      }
                      
                      if (new Date(challengeStartDate) >= new Date(challengeEndDate)) {
                        alert("End date must be after start date.");
                        return;
                      }
                      
                      setChallengeSubmitting(true);
                      try {
                        const { challenge } = await apiCreateChallenge({
                          title: challengeTitle,
                          description: challengeDescription,
                          startAt: new Date(challengeStartDate).toISOString(),
                          endAt: new Date(challengeEndDate).toISOString(),
                          criteria: {
                            likesWeight: 3,
                            savesWeight: 2,
                            runsWeight: 1,
                            viewsWeight: 0.1
                          }
                        });
                        
                        resetChallengeForm();
                        setIsCreateChallengeOpen(false);
                        loadChallenges(); // Refresh the challenges list
                        
                        alert("Challenge created successfully!");
                      } catch (e: any) {
                        const msg = e?.message || "Failed to create challenge";
                        if (msg.toLowerCase().includes("unauthorized")) {
                          alert("You don't have permission to create challenges.");
                        } else {
                          alert(msg);
                        }
                      } finally {
                        setChallengeSubmitting(false);
                      }
                    }} disabled={challengeSubmitting}>
                      {challengeSubmitting ? "Creating..." : "Create Challenge"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Edit Challenge Dialog */}
            <Dialog open={isEditChallengeOpen} onOpenChange={(open) => {
              setIsEditChallengeOpen(open);
              if (!open) resetChallengeForm();
            }}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Edit Challenge</DialogTitle>
                  <DialogDescription>
                    Update challenge details
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-challenge-title">Challenge Title</Label>
                    <Input 
                      id="edit-challenge-title" 
                      placeholder="e.g. Creative Writing Challenge" 
                      value={challengeTitle}
                      onChange={(e) => setChallengeTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-challenge-description">Description</Label>
                    <Textarea 
                      id="edit-challenge-description" 
                      placeholder="Describe the challenge, rules, and what participants should create..."
                      value={challengeDescription}
                      onChange={(e) => setChallengeDescription(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-challenge-start-date">Start Date</Label>
                      <Input 
                        id="edit-challenge-start-date" 
                        type="datetime-local" 
                        value={challengeStartDate}
                        onChange={(e) => setChallengeStartDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-challenge-end-date">End Date</Label>
                      <Input 
                        id="edit-challenge-end-date" 
                        type="datetime-local" 
                        value={challengeEndDate}
                        onChange={(e) => setChallengeEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => {
                    setIsEditChallengeOpen(false);
                    resetChallengeForm();
                  }} disabled={challengeSubmitting}>
                    Cancel
                  </Button>
                  <Button onClick={async () => {
                    if (!editingChallenge?.id) return;
                    
                    if (!challengeTitle.trim() || !challengeDescription.trim() || !challengeStartDate || !challengeEndDate) {
                      alert("Please fill in all required fields.");
                      return;
                    }
                    
                    if (new Date(challengeStartDate) >= new Date(challengeEndDate)) {
                      alert("End date must be after start date.");
                      return;
                    }
                    
                    setChallengeSubmitting(true);
                    try {
                      await apiUpdateChallenge(editingChallenge.id, {
                        title: challengeTitle,
                        description: challengeDescription,
                        startAt: new Date(challengeStartDate).toISOString(),
                        endAt: new Date(challengeEndDate).toISOString(),
                        criteria: {
                          likesWeight: 3,
                          savesWeight: 2,
                          runsWeight: 1,
                          viewsWeight: 0.1
                        }
                      });
                      
                      resetChallengeForm();
                      setIsEditChallengeOpen(false);
                      loadChallenges(); // Refresh the challenges list
                      
                      alert("Challenge updated successfully!");
                    } catch (e: any) {
                      const msg = e?.message || "Failed to update challenge";
                      if (msg.toLowerCase().includes("unauthorized")) {
                        alert("You don't have permission to edit challenges.");
                      } else {
                        alert(msg);
                      }
                    } finally {
                      setChallengeSubmitting(false);
                    }
                  }} disabled={challengeSubmitting}>
                    {challengeSubmitting ? "Updating..." : "Update Challenge"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Challenges List */}
            <div className="space-y-4">
              {loadingChallenges ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <p>Loading challenges...</p>
                  </CardContent>
                </Card>
              ) : challenges.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8 text-muted-foreground">
                    <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No challenges created yet.</p>
                    <p className="text-sm mt-1">Create your first challenge to get started!</p>
                  </CardContent>
                </Card>
              ) : (
                challenges.map((challenge) => (
                  <Card key={challenge.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center space-x-2">
                            <span>{challenge.title}</span>
                            <Badge variant={challenge.stats?.isActive ? "default" : challenge.stats?.isUpcoming ? "secondary" : "outline"}>
                              {challenge.stats?.isActive ? "Active" : challenge.stats?.isUpcoming ? "Upcoming" : "Ended"}
                            </Badge>
                          </CardTitle>
                          <CardDescription className="mt-2">{challenge.description}</CardDescription>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditChallenge(challenge)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteChallenge(challenge.id)}
                            disabled={deletingChallengeId === challenge.id}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {deletingChallengeId === challenge.id ? "Deleting..." : "Delete"}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <div className="text-sm text-muted-foreground">Start Date</div>
                          <div className="font-medium">
                            {new Date(challenge.startAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">End Date</div>
                          <div className="font-medium">
                            {new Date(challenge.endAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Total Entries</div>
                          <div className="text-2xl font-bold">{challenge.stats?.totalEntries || 0}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Participants</div>
                          <div className="text-2xl font-bold">{challenge.stats?.totalParticipants || 0}</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground">Total Likes</div>
                          <div className="text-lg font-bold">{challenge.stats?.totalLikes || 0}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Total Views</div>
                          <div className="text-lg font-bold">{challenge.stats?.totalViews || 0}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Created</div>
                          <div className="text-sm">{challenge.id ? `ID: ${challenge.id}` : 'N/A'}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Generate Reports</CardTitle>
                  <CardDescription>Create custom reports for analysis</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full justify-start">
                    <FileText className="mr-2 h-4 w-4" />
                    Cohort Progress Report
                  </Button>
                  <Button className="w-full justify-start">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Engagement Analytics
                  </Button>
                  <Button className="w-full justify-start">
                    <Users className="mr-2 h-4 w-4" />
                    User Activity Report
                  </Button>
                  <Button className="w-full justify-start">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Completion Analytics
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Export Data</CardTitle>
                  <CardDescription>Download data in various formats</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="mr-2 h-4 w-4" />
                    Export User Data (CSV)
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="mr-2 h-4 w-4" />
                    Export Progress Data (Excel)
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="mr-2 h-4 w-4" />
                    Export Analytics (PDF)
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Platform Settings</CardTitle>
                  <CardDescription>Configure platform-wide settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Default Learning Track</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select default track" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="engineering">Engineering</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="design">Design</SelectItem>
                        <SelectItem value="research">Research</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Session Timeout (minutes)</Label>
                    <Input type="number" defaultValue="60" />
                  </div>
                  <div className="space-y-2">
                    <Label>Maximum Cohort Size</Label>
                    <Input type="number" defaultValue="50" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Notification Settings</CardTitle>
                  <CardDescription>Configure email and system notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Welcome emails</Label>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Progress reminders</Label>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Completion certificates</Label>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Weekly digests</Label>
                    <input type="checkbox" className="rounded" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

