import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import LoggedInHeader from "@/components/LoggedInHeader";
import { useAuth } from "@/context/AuthContext";
import { apiMe, apiMeCookie, apiUpdateMe, apiGetSettingsProfile, apiSaveSettingsProfile, apiExportData, apiDeleteAccount } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Award, Settings as SettingsIcon, User, Shield, Trash2, Download, Upload, Check, AlertTriangle, Loader2 } from "lucide-react";
import Sidebar from "@/components/Sidebar";

const sidebarItems = [
  { icon: BookOpen, label: "Courses", href: "/learning" },
  { icon: Award, label: "Achievements", href: "/certificates" },
  { icon: SettingsIcon, label: "Settings", href: "/settings", active: true },
];

export default function Settings() {
  const { user: authUser, loading: authLoading, refresh } = useAuth();
  const [bootLoading, setBootLoading] = useState(true);
  const [alert, setAlert] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    personaRole: "marketer",
    displayName: "",
    location: "",
    website: "",
    company: "",
    jobTitle: "",
    skills: [] as string[],
    interests: [] as string[],
    avatar: ""
  });

  useEffect(() => {
    if (!authLoading && !authUser) {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        window.location.replace("/login");
      }
    }
  }, [authUser, authLoading]);

  const showAlert = (type: "success" | "error" | "info", message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const loadSettingsData = async () => {
    try {
      let userRes, profileRes;
      try {
        [userRes, profileRes] = await Promise.allSettled([apiMe(), apiGetSettingsProfile()]);
      } catch {
        [userRes, profileRes] = await Promise.allSettled([apiMeCookie(), apiGetSettingsProfile()]);
      }

      if (userRes.status === "fulfilled") {
        const { user } = userRes.value;
        const parts = (user.name || "").split(" ");
        setProfile((prev) => ({
          ...prev,
          firstName: parts[0] || "",
          lastName: parts.slice(1).join(" ") || "",
          email: user.email
        }));
      } else if (authUser) {
        const parts = (authUser.name || "").split(" ");
        setProfile((prev) => ({
          ...prev,
          firstName: parts[0] || "",
          lastName: parts.slice(1).join(" ") || "",
          email: authUser.email
        }));
      }

      if (profileRes.status === "fulfilled") {
        const { profile: profileData } = profileRes.value;
        setProfile((prev) => ({
          ...prev,
          ...profileData,
          email: prev.email || profileData.email || "",
          personaRole: "marketer"
        }));
      }
    } catch (error: any) {
      console.error("Failed to load settings:", error);
      showAlert("error", "Failed to load settings data");
    }
  };

  useEffect(() => {
    const init = async () => {
      if (authLoading) return;
      await loadSettingsData();
      setBootLoading(false);
    };
    init();
  }, [authLoading]);

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const name = `${profile.firstName} ${profile.lastName}`.trim();
      if (!name) {
        showAlert("error", "Please enter your full name");
        return;
      }

      await Promise.all([
        apiUpdateMe(name),
        apiSaveSettingsProfile({
          personaRole: "marketer",
          displayName: profile.displayName,
          bio: profile.bio,
          location: profile.location,
          website: profile.website,
          company: profile.company,
          jobTitle: profile.jobTitle,
          skills: profile.skills,
          interests: profile.interests
        })
      ]);

      await refresh().catch(() => {});
      showAlert("success", "✨ Profile updated successfully!");
    } catch (error: any) {
      showAlert("error", error?.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const exportData = async () => {
    try {
      const response = await apiExportData();
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ai-first-academy-data.json";
      a.click();
      URL.revokeObjectURL(url);
      showAlert("success", "Data export downloaded");
    } catch (error: any) {
      showAlert("error", error?.message || "Failed to export data");
    }
  };

  const deleteAccount = async () => {
    const confirmed = confirm("Are you absolutely sure? This action cannot be undone.");
    if (!confirmed) return;
    try {
      await apiDeleteAccount("");
      localStorage.removeItem("auth_token");
      window.location.href = "/";
    } catch (error: any) {
      showAlert("error", error?.message || "Failed to delete account");
    }
  };

  if (bootLoading) {
    return (
      <div className="min-h-screen bg-background">
        <LoggedInHeader />
        <div className="h-[calc(100vh-4rem)] flex overflow-hidden">
        <Sidebar />
          <main className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-3xl mx-auto space-y-6">
              <div>
                <Skeleton className="h-8 w-40" />
                <Skeleton className="h-4 w-64 mt-2" />
              </div>
              <Card>
                <CardHeader>
                  <Skeleton className="h-5 w-56" />
                  <Skeleton className="h-3 w-64" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {Array.from({ length: 2 }).map((_, j) => (
                    <div key={j} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ))}
                  <Skeleton className="h-9 w-32" />
                </CardContent>
              </Card>
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
        <Sidebar />

        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="text-muted-foreground">Update your basic details and manage your data.</p>
            </div>

            {alert && (
              <Alert
                className={`mb-6 animate-in slide-in-from-top-2 duration-300 ${
                  alert.type === "success"
                    ? "border-green-200 bg-green-50/80 backdrop-blur-sm"
                    : alert.type === "error"
                    ? "border-red-200 bg-red-50/80 backdrop-blur-sm"
                    : "border-blue-200 bg-blue-50/80 backdrop-blur-sm"
                }`}
              >
                {alert.type === "success" ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : alert.type === "error" ? (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-blue-600" />
                )}
                <AlertDescription
                  className={`font-medium ${
                    alert.type === "success"
                      ? "text-green-800"
                      : alert.type === "error"
                      ? "text-red-800"
                      : "text-blue-800"
                  }`}
                >
                  {alert.message}
                </AlertDescription>
              </Alert>
            )}

            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Profile Information
                </CardTitle>
                <CardDescription>Update your basic contact information.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-6">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={profile.avatar || ""} />
                    <AvatarFallback className="text-lg">
                      {profile.firstName.charAt(0)}
                      {profile.lastName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                    <Button
                      size="sm"
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = "image/*";
                        input.onchange = (e: any) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              setProfile((prev) => ({
                                ...prev,
                                avatar: ev.target?.result as string
                              }));
                              showAlert("success", "Avatar updated! Don't forget to save your changes.");
                            };
                            reader.readAsDataURL(file);
                          }
                        };
                        input.click();
                      }}
                    >
                      <Upload className="w-full sm:w-auto" />
                      Change Avatar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setProfile((prev) => ({ ...prev, avatar: "" }));
                        showAlert("success", "Avatar removed! Don't forget to save your changes.");
                      }}
                    >
                      <Trash2 className="w-full sm:w-auto" />
                      Remove
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={profile.firstName}
                      onChange={(e) =>
                        setProfile((prev) => ({
                          ...prev,
                          firstName: e.target.value
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={profile.lastName}
                      onChange={(e) =>
                        setProfile((prev) => ({
                          ...prev,
                          lastName: e.target.value
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={profile.email} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={(e) =>
                        setProfile((prev) => ({
                          ...prev,
                          phone: e.target.value
                        }))
                      }
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                <div className="flex justify-center mt-6">
                  <Button
                    disabled={savingProfile}
                    onClick={saveProfile}
                    className="group w-full sm:w-auto save-success transition-all duration-200 hover:scale-105 justify-center flex items-center"
                  >
                    {savingProfile ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4 text-white" />
                        <span className="text-center w-full">Save Changes</span>
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Data & Privacy
                </CardTitle>
                <CardDescription>Download a copy of your data or permanently delete your account.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                  <div className="space-y-3">
                    <div>
                      <div className="font-medium">Download Your Data</div>
                      <div className="text-sm text-muted-foreground">
                        Export all your learning data, prompts, and progress.
                      </div>
                    </div>
                    <Button variant="outline" onClick={exportData}>
                      <Download className="h-4 w-4 mr-2" />
                      Request Data Export
                    </Button>
                  </div>
                </div>

                <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                  <div className="space-y-3">
                    <div>
                      <div className="font-medium text-destructive">Delete Account</div>
                      <div className="text-sm text-muted-foreground">
                        Permanently delete your account and all associated data.
                      </div>
                    </div>
                    <Button variant="destructive" onClick={deleteAccount}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Account
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}

