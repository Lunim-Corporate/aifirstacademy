import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Home,
  BookOpen, 
  Code, 
  Library,
  Users,
  Award,
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  CreditCard,
  Key,
  Trash2,
  Download,
  Upload,
  Moon,
  Sun,
  Globe,
  Link as LinkIcon,
  Eye,
  EyeOff,
  Check,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { Link } from "react-router-dom";
import LoggedInHeader from "@/components/LoggedInHeader";
import { useEffect, useState } from "react";
import { 
  apiMe, 
  apiMeCookie,
  apiUpdateMe, 
  apiGetSettingsProfile, 
  apiSaveSettingsProfile,
  apiGetNotificationSettings,
  apiSaveNotificationSettings,
  apiGetSecuritySettings,
  apiSaveSecuritySettings,
  apiChangePassword,
  apiGetBillingSettings,
  apiSaveBillingSettings,
  apiGetPreferences,
  apiSavePreferences,
  apiExportData,
  apiDeleteAccount
} from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";

const sidebarItems = [
  { icon: Home, label: "Dashboard", href: "/dashboard" },
  { icon: BookOpen, label: "Learning Path", href: "/learning" },
  { icon: Code, label: "Sandbox", href: "/sandbox" },
  { icon: Library, label: "Library", href: "/library" },
  { icon: Users, label: "Community", href: "/community" },
  { icon: Award, label: "Certificates", href: "/certificates" },
  { icon: SettingsIcon, label: "Settings", href: "/settings", active: true },
];

export default function Settings() {
  // UI State
  const [bootLoading, setBootLoading] = useState(true);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  
  // Loading states
  const [loading, setLoading] = useState({ profile: false, notifications: false, security: false, billing: false, preferences: false });
  const [saving, setSaving] = useState({ profile: false, notifications: false, security: false, billing: false, preferences: false });
  
  // Profile State
  const [profile, setProfile] = useState({
    firstName: "", lastName: "", email: "", phone: "", company: "", bio: "",
    // personaRole: "engineer",
    personaRole: "marketer", displayName: "", location: "", website: "", jobTitle: "",
    skills: [] as string[], interests: [] as string[], avatar: ""
  });
  
  // Notification State
  const [notifications, setNotifications] = useState({
  email: { 
    enabled: emailNotifications, 
    frequency: "daily" as "immediate" | "daily" | "weekly" | "never",
    types: { likes: true, comments: true, saves: true, follows: true, achievements: true, system: true, marketing: false }
  },
  push: { 
    enabled: pushNotifications, 
    types: { likes: false, comments: true, saves: false, follows: true, achievements: true, system: true, marketing: false } 
  },
  inApp: { 
    enabled: true, 
    types: { likes: true, comments: true, saves: true, follows: true, achievements: true, system: true, marketing: false } 
  }
});

useEffect(() => {
  setNotifications(prev => ({
    ...prev,
    email: { ...prev.email, enabled: emailNotifications }
  }));
}, [emailNotifications]);

useEffect(() => {
  setNotifications(prev => ({
    ...prev,
    push: { ...prev.push, enabled: pushNotifications }
  }));
}, [pushNotifications]);
  
  // Security State  
  const [security, setSecurity] = useState({
    twoFactorEnabled: false, loginNotifications: true, sessionTimeout: 30,
    currentPassword: "", newPassword: "", confirmPassword: ""
  });
  
  // Billing State
  const [billing, setBilling] = useState({
    plan: "free" as "free" | "pro" | "enterprise", billingCycle: "monthly" as "monthly" | "yearly",
    paymentMethod: null as any, billingAddress: { street: "", city: "", state: "", zipCode: "", country: "" },
    usage: { promptsUsed: 0, promptsLimit: 100, storageUsed: 0, storageLimit: 1000 }
  });
  
  // Preferences State
  const [preferences, setPreferences] = useState({
    theme: "light" as "light" | "dark" | "auto", language: "en", timezone: "UTC",
    dateFormat: "MM/DD/YYYY", timeFormat: "12h" as "12h" | "24h", autoSave: true,
    analytics: true, personalization: true, experimentalFeatures: false,
    // defaultTrack: "engineering"
    defaultTrack: "marketing"
  });
  
  // Show alert helper
  const showAlert = (type: 'success' | 'error' | 'info', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
    
    // Add visual feedback for success
    if (type === 'success') {
      // Trigger a subtle page animation or highlight
      const element = document.querySelector('.save-success');
      if (element) {
        element.classList.add('animate-pulse');
        setTimeout(() => element.classList.remove('animate-pulse'), 1000);
      }
    }
  };
  
  // Load all settings data
  const { user: authUser, loading: authLoading, refresh } = useAuth();

  // Load all settings data
  const loadSettingsData = async () => {
    try {
      // Load user profile with fallback to cookie auth
      let userRes, profileRes, notifRes, secRes, billRes, prefRes;
      try {
        [userRes, profileRes, notifRes, secRes, billRes, prefRes] = await Promise.allSettled([
          apiMe(),
          apiGetSettingsProfile(),
          apiGetNotificationSettings(),
          apiGetSecuritySettings(),
          apiGetBillingSettings(),
          apiGetPreferences()
        ]);
      } catch (error: any) {
        // If token-based auth fails, try cookie-based auth
        console.log('Token-based auth failed, trying cookie auth:', error.message);
        [userRes, profileRes, notifRes, secRes, billRes, prefRes] = await Promise.allSettled([
          apiMeCookie(),
          apiGetSettingsProfile(),
          apiGetNotificationSettings(),
          apiGetSecuritySettings(),
          apiGetBillingSettings(),
          apiGetPreferences()
        ]);
      }
      
      // Update profile
      if (userRes.status === 'fulfilled') {
        const { user } = userRes.value;
        const parts = (user.name || "").split(" ");
        setProfile(prev => ({
          ...prev,
          firstName: parts[0] || "",
          lastName: parts.slice(1).join(" ") || "",
          email: user.email
        }));
      } else if (authUser) {
        // Fallback to auth context if apiMe failed but auth is present
        const parts = (authUser.name || "").split(" ");
        setProfile(prev => ({
          ...prev,
          firstName: parts[0] || "",
          lastName: parts.slice(1).join(" ") || "",
          email: authUser.email
        }));
      }
      
      if (profileRes.status === 'fulfilled') {
        const { profile: profileData } = profileRes.value;
        // Merge profile data carefully, preserving user.email from userRes
        setProfile(prev => ({ 
          ...prev, 
          ...profileData,
          // Don't overwrite email from apiMe if it exists
          email: prev.email || profileData.email || ""
        }));
      }
      
      if (notifRes.status === 'fulfilled') {
        setNotifications(notifRes.value.settings);
      }
      
      if (secRes.status === 'fulfilled') {
        setSecurity(prev => ({ ...prev, ...secRes.value.settings }));
      }
      
      if (billRes.status === 'fulfilled') {
        setBilling(prev => ({ ...prev, ...billRes.value.settings }));
      }
      
      if (prefRes.status === 'fulfilled') {
        const prefs = prefRes.value.preferences;
        setPreferences(prev => ({ ...prev, ...prefs }));
        
        // Apply theme if loaded
        if (prefs.theme) {
          // Persist and apply theme globally
          try {
            const { applyTheme } = await import("@/lib/theme");
            applyTheme(prefs.theme);
          } catch {
            // Fallback: minimal apply
            const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const dark = prefs.theme === 'dark' || (prefs.theme === 'auto' && systemDark);
            document.documentElement.classList.toggle('dark', dark);
          }
        }
      }
      
    } catch (error: any) {
      console.error('Failed to load settings:', error);
      showAlert('error', 'Failed to load settings data');
    }
  };
  
  useEffect(() => {
    const initSettings = async () => {
      if (authLoading) return;
      await loadSettingsData();
      setBootLoading(false);
    };
    initSettings();
  }, [authLoading]);
  
  // Refetch data when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && !bootLoading) {
        console.log('Settings page became visible - refetching data');
        loadSettingsData();
      }
    };
    
    const handleFocus = () => {
      if (!bootLoading) {
        console.log('Settings page focused - refetching data');
        loadSettingsData();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [bootLoading]);
  
  // Save functions
  const saveProfile = async () => {
    setSaving(prev => ({ ...prev, profile: true }));
    try {
      const name = `${profile.firstName} ${profile.lastName}`.trim();
      if (!name) {
        showAlert('error', 'Please enter your full name');
        return;
      }
      
      await Promise.all([
        apiUpdateMe(name),
        apiSaveSettingsProfile({
          personaRole: profile.personaRole,
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
      
      // Refresh auth user so headers and other pages update immediately
      await refresh().catch(()=>{});
      showAlert('success', '✨ Profile updated successfully!');
      
      // Add temporary success state to button
      const button = document.querySelector('.save-success');
      if (button) {
        button.classList.add('bg-green-600', 'text-white');
        setTimeout(() => {
          button.classList.remove('bg-green-600', 'text-white');
        }, 2000);
      }
    } catch (error: any) {
      showAlert('error', error?.message || 'Failed to update profile');
    } finally {
      setSaving(prev => ({ ...prev, profile: false }));
    }
  };
  
  const saveNotifications = async () => {
  setSaving(prev => ({ ...prev, notifications: true }));
  try {
    await apiSaveNotificationSettings(notifications);
    showAlert('success', '✨ Notification preferences saved!');
    
    // Add temporary success visual feedback
    const buttons = document.querySelectorAll('.save-success');
    buttons.forEach(button => {
      button.classList.add('bg-green-600', 'text-white');
      setTimeout(() => {
        button.classList.remove('bg-green-600', 'text-white');
      }, 2000);
    });
  } catch (error: any) {
    showAlert('error', error?.message || 'Failed to save notification settings');
  } finally {
    setSaving(prev => ({ ...prev, notifications: false }));
  }
};
  
  const saveSecurity = async () => {
    setSaving(prev => ({ ...prev, security: true }));
    try {
      await apiSaveSecuritySettings({
        twoFactorEnabled: security.twoFactorEnabled,
        loginNotifications: security.loginNotifications,
        sessionTimeout: security.sessionTimeout
      });
      showAlert('success', '✨ Security settings updated!');
    } catch (error: any) {
      showAlert('error', error?.message || 'Failed to update security settings');
    } finally {
      setSaving(prev => ({ ...prev, security: false }));
    }
  };
  
  const changePassword = async () => {
    if (!security.currentPassword || !security.newPassword) {
      showAlert('error', 'Please enter both current and new passwords');
      return;
    }
    if (security.newPassword !== security.confirmPassword) {
      showAlert('error', 'New passwords do not match');
      return;
    }
    if (security.newPassword.length < 8) {
      showAlert('error', 'New password must be at least 8 characters long');
      return;
    }
    
    setSaving(prev => ({ ...prev, security: true }));
    try {
      await apiChangePassword(security.currentPassword, security.newPassword);
      setSecurity(prev => ({ ...prev, currentPassword: "", newPassword: "", confirmPassword: "" }));
      showAlert('success', '✨ Password changed successfully!');
    } catch (error: any) {
      showAlert('error', error?.message || 'Failed to change password');
    } finally {
      setSaving(prev => ({ ...prev, security: false }));
    }
  };
  
  const saveBilling = async () => {
    setSaving(prev => ({ ...prev, billing: true }));
    try {
      await apiSaveBillingSettings(billing);
      showAlert('success', 'Billing settings updated');
    } catch (error: any) {
      showAlert('error', error?.message || 'Failed to update billing settings');
    } finally {
      setSaving(prev => ({ ...prev, billing: false }));
    }
  };
  
  const savePreferences = async () => {
    setSaving(prev => ({ ...prev, preferences: true }));
    try {
      await apiSavePreferences(preferences);
      showAlert('success', '✨ Preferences saved!');
      
      // Add temporary success visual feedback
      const buttons = document.querySelectorAll('.save-success');
      buttons.forEach(button => {
        button.classList.add('bg-green-600', 'text-white');
        setTimeout(() => {
          button.classList.remove('bg-green-600', 'text-white');
        }, 2000);
      });
    } catch (error: any) {
      showAlert('error', error?.message || 'Failed to save preferences');
    } finally {
      setSaving(prev => ({ ...prev, preferences: false }));
    }
  };
  
  const exportData = async () => {
    try {
      const response = await apiExportData();
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ai-first-academy-data.json';
      a.click();
      URL.revokeObjectURL(url);
      showAlert('success', 'Data export downloaded');
    } catch (error: any) {
      showAlert('error', error?.message || 'Failed to export data');
    }
  };
  
  const deleteAccount = async () => {
    const password = prompt('Enter your password to confirm account deletion:');
    if (!password) return;
    
    const confirmed = confirm('Are you absolutely sure? This action cannot be undone.');
    if (!confirmed) return;
    
    try {
      await apiDeleteAccount(password);
      localStorage.removeItem('auth_token');
      window.location.href = '/';
    } catch (error: any) {
      showAlert('error', error?.message || 'Failed to delete account');
    }
  };

  if (bootLoading) {
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
          <main className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-6">
              <div>
                <Skeleton className="h-8 w-40" />
                <Skeleton className="h-4 w-80 mt-2" />
              </div>
              <div className="grid grid-cols-5 gap-2 max-w-2xl">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-full" />
                ))}
              </div>
              {Array.from({ length: 2 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-5 w-56" />
                    <Skeleton className="h-3 w-80" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Array.from({ length: 3 }).map((_, j) => (
                      <div key={j} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ))}
                    <Skeleton className="h-9 w-32" />
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
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="text-muted-foreground">Manage your account preferences and settings</p>
            </div>

            {alert && (
              <Alert className={`mb-6 animate-in slide-in-from-top-2 duration-300 ${
                alert.type === 'success' ? 'border-green-200 bg-green-50/80 backdrop-blur-sm' : 
                alert.type === 'error' ? 'border-red-200 bg-red-50/80 backdrop-blur-sm' :
                'border-blue-200 bg-blue-50/80 backdrop-blur-sm'
              }`}>
                {alert.type === 'success' ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : alert.type === 'error' ? (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-blue-600" />
                )}
                <AlertDescription className={`font-medium ${
                  alert.type === 'success' ? 'text-green-800' : 
                  alert.type === 'error' ? 'text-red-800' : 
                  'text-blue-800'
                }`}>
                  {alert.message}
                </AlertDescription>
              </Alert>
            )}
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-5 max-w-2xl">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
                <TabsTrigger value="billing">Billing</TabsTrigger>
                <TabsTrigger value="preferences">Preferences</TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      Profile Information
                    </CardTitle>
                    <CardDescription>
                      Update your personal information and profile settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center space-x-6">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={profile.avatar || "/api/placeholder/80/80"} />
                        <AvatarFallback className="text-lg">
                          {profile.firstName.charAt(0)}{profile.lastName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-2">
                        <Button 
                          size="sm"
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.onchange = (e: any) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (e) => {
                                  setProfile(prev => ({ ...prev, avatar: e.target?.result as string }));
                                  showAlert('success', 'Avatar updated! Don\'t forget to save your changes.');
                                };
                                reader.readAsDataURL(file);
                              }
                            };
                            input.click();
                          }}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Change Avatar
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setProfile(prev => ({ ...prev, avatar: '' }));
                            showAlert('success', 'Avatar removed! Don\'t forget to save your changes.');
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
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
                          onChange={(e) => setProfile(prev => ({ ...prev, firstName: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input 
                          id="lastName" 
                          value={profile.lastName} 
                          onChange={(e) => setProfile(prev => ({ ...prev, lastName: e.target.value }))}
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
                          onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="company">Company</Label>
                        <Input 
                          id="company" 
                          value={profile.company} 
                          onChange={(e) => setProfile(prev => ({ ...prev, company: e.target.value }))}
                          placeholder="Your company"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="jobTitle">Job Title</Label>
                        <Input 
                          id="jobTitle" 
                          value={profile.jobTitle} 
                          onChange={(e) => setProfile(prev => ({ ...prev, jobTitle: e.target.value }))}
                          placeholder="Your job title"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input 
                          id="location" 
                          value={profile.location} 
                          onChange={(e) => setProfile(prev => ({ ...prev, location: e.target.value }))}
                          placeholder="City, Country"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Primary Role</Label>
                        <Select 
                          value={profile.personaRole} 
                          onValueChange={(value) => setProfile(prev => ({ ...prev, personaRole: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {/* <SelectItem value="engineer">Engineer</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="designer">Designer</SelectItem> */}
                            <SelectItem value="marketer">Marketer</SelectItem>
                            {/* <SelectItem value="researcher">Researcher</SelectItem> */}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input 
                        id="website" 
                        type="url" 
                        value={profile.website} 
                        onChange={(e) => setProfile(prev => ({ ...prev, website: e.target.value }))}
                        placeholder="https://yourwebsite.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea 
                        id="bio" 
                        value={profile.bio}
                        onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                        placeholder="Tell us about yourself..."
                        className="min-h-[100px]"
                      />
                    </div>

                    <Button 
                      disabled={saving.profile} 
                      onClick={saveProfile}
                      className="w-full sm:w-auto save-success transition-all duration-200 hover:scale-105"
                    >
                      {saving.profile ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Notifications Tab */}
              <TabsContent value="notifications" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Bell className="h-5 w-5 mr-2" />
                      Notification Preferences
                    </CardTitle>
                    <CardDescription>
                      Choose what notifications you'd like to receive
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Email Notifications</div>
                          <div className="text-sm text-muted-foreground">Receive important updates via email</div>
                        </div>
                        <Switch 
                          checked={notifications.email.enabled} 
                          onCheckedChange={(checked) => {
                            setEmailNotifications(checked);
                            setNotifications(prev => ({
                              ...prev,
                              email: { ...prev.email, enabled: checked }
                            }));
                          }} 
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Push Notifications</div>
                          <div className="text-sm text-muted-foreground">Get notified in your browser</div>
                        </div>
                        <Switch 
                          checked={notifications.push.enabled} 
                          onCheckedChange={(checked) => {
                            setPushNotifications(checked);
                            setNotifications(prev => ({
                              ...prev,
                              push: { ...prev.push, enabled: checked }
                            }));
                          }} 
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Weekly Digest</div>
                          <div className="text-sm text-muted-foreground">Summary of your weekly progress</div>
                        </div>
                        <Switch 
                          checked={weeklyDigest} 
                          onCheckedChange={(checked) => {
                            setWeeklyDigest(checked);
                            setNotifications(prev => ({
                              ...prev,
                              email: { ...prev.email, types: { ...prev.email.types, achievements: checked } }
                            }));
                          }} 
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Email Frequency</Label>
                        <Select 
                          value={notifications.email.frequency} 
                          onValueChange={(value) => {
                            setNotifications(prev => ({
                              ...prev,
                              email: { ...prev.email, frequency: value as "immediate" | "daily" | "weekly" | "never" }
                            }));
                          }} 
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="immediate">Immediately</SelectItem>
                            <SelectItem value="daily">Daily digest</SelectItem>
                            <SelectItem value="weekly">Weekly digest</SelectItem>
                            <SelectItem value="never">Never</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h4 className="font-medium">Email Types</h4>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">Course Updates</div>
                            <div className="text-sm text-muted-foreground">New modules and content releases</div>
                          </div>
                          <Switch 
                            checked={notifications.email.types.achievements}
                            onCheckedChange={(checked) => {
                              setNotifications(prev => ({
                                ...prev,
                                email: { ...prev.email, types: { ...prev.email.types, achievements: checked } }
                              }));
                            }}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">Progress Reminders</div>
                            <div className="text-sm text-muted-foreground">Gentle nudges to continue learning</div>
                          </div>
                          <Switch 
                            checked={notifications.email.types.system}
                            onCheckedChange={(checked) => {
                              setNotifications(prev => ({
                                ...prev,
                                email: { ...prev.email, types: { ...prev.email.types, system: checked } }
                              }));
                            }}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">Community Activity</div>
                            <div className="text-sm text-muted-foreground">Replies and mentions in discussions</div>
                          </div>
                          <Switch 
                            checked={notifications.email.types.comments}
                            onCheckedChange={(checked) => {
                              setNotifications(prev => ({
                                ...prev,
                                email: { ...prev.email, types: { ...prev.email.types, comments: checked } }
                              }));
                            }}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">Marketing</div>
                            <div className="text-sm text-muted-foreground">Product updates and promotions</div>
                          </div>
                          <Switch 
                            checked={notifications.email.types.marketing}
                            onCheckedChange={(checked) => {
                              setNotifications(prev => ({
                                ...prev,
                                email: { ...prev.email, types: { ...prev.email.types, marketing: checked } }
                              }));
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <Button 
                      disabled={saving.notifications} 
                      onClick={saveNotifications}
                      className="w-full sm:w-auto save-success transition-all duration-200 hover:scale-105"
                    >
                      {saving.notifications ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                          Save Preferences
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Shield className="h-5 w-5 mr-2" />
                      Security Settings
                    </CardTitle>
                    <CardDescription>
                      Manage your account security and authentication
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <h4 className="font-medium">Change Password</h4>
                      
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <div className="relative">
                          <Input
                            id="currentPassword"
                            type={showCurrentPassword ? "text" : "password"}
                            placeholder="Enter current password"
                            value={security.currentPassword}
                            onChange={(e) => setSecurity(prev => ({ ...prev, currentPassword: e.target.value }))}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          >
                            {showCurrentPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <div className="relative">
                          <Input
                            id="newPassword"
                            type={showNewPassword ? "text" : "password"}
                            placeholder="Enter new password"
                            value={security.newPassword}
                            onChange={(e) => setSecurity(prev => ({ ...prev, newPassword: e.target.value }))}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                          >
                            {showNewPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="Confirm new password"
                          value={security.confirmPassword}
                          onChange={(e) => setSecurity(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        />
                      </div>

                      <Button 
                        disabled={saving.security} 
                        onClick={changePassword}
                        className="w-full sm:w-auto save-success transition-all duration-200 hover:scale-105"
                      >
                        {saving.security ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <Shield className="mr-2 h-4 w-4" />
                            Update Password
                          </>
                        )}
                      </Button>

                      <Separator />

                      <div className="space-y-4">
                        <h4 className="font-medium">Two-Factor Authentication</h4>
                        <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                          <div>
                            <div className="font-medium">Authenticator App</div>
                            <div className="text-sm text-muted-foreground">
                              Use an app like Google Authenticator or Authy
                            </div>
                          </div>
                          <Badge variant={security.twoFactorEnabled ? "default" : "outline"} className={security.twoFactorEnabled ? "bg-success text-white" : "text-muted-foreground"}>
                            {security.twoFactorEnabled ? "Enabled" : "Not Enabled"}
                          </Badge>
                        </div>
                        <Button 
                          variant="outline"
                          onClick={async () => {
                            if (security.twoFactorEnabled) {
                              const confirmed = confirm('Are you sure you want to disable two-factor authentication? This will make your account less secure.');
                              if (!confirmed) return;
                            }
                            setSecurity(prev => ({ ...prev, twoFactorEnabled: !prev.twoFactorEnabled }));
                            await saveSecurity();
                            showAlert('success', `Two-factor authentication ${security.twoFactorEnabled ? 'disabled' : 'enabled'} successfully!`);
                          }}
                        >
                          <Key className="h-4 w-4 mr-2" />
                          {security.twoFactorEnabled ? "Disable 2FA" : "Enable 2FA"}
                        </Button>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h4 className="font-medium">Session Management</h4>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">Login Notifications</div>
                            <div className="text-sm text-muted-foreground">Get notified when someone logs into your account</div>
                          </div>
                          <Switch 
                            checked={security.loginNotifications} 
                            onCheckedChange={(checked) => setSecurity(prev => ({ ...prev, loginNotifications: checked }))}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Session Timeout</Label>
                          <Select 
                            value={security.sessionTimeout.toString()} 
                            onValueChange={(value) => setSecurity(prev => ({ ...prev, sessionTimeout: parseInt(value) }))}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 day</SelectItem>
                              <SelectItem value="7">7 days</SelectItem>
                              <SelectItem value="30">30 days</SelectItem>
                              <SelectItem value="90">90 days</SelectItem>
                              <SelectItem value="365">1 year</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <Button 
                          disabled={saving.security} 
                          onClick={saveSecurity}
                          className="w-full sm:w-auto save-success transition-all duration-200 hover:scale-105"
                        >
                          {saving.security ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Check className="mr-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                              Save Settings
                            </>
                          )}
                        </Button>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h4 className="font-medium">Connected Accounts</h4>
                        
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                                <span className="text-red-600 font-bold text-sm">G</span>
                              </div>
                              <div>
                                <div className="font-medium">Google</div>
                                <div className="text-sm text-muted-foreground">john.doe@gmail.com</div>
                              </div>
                            </div>
                            <Button variant="outline" size="sm">Disconnect</Button>
                          </div>

                          <div className="flex items-center justify-between p-4 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <span className="text-blue-600 font-bold text-sm">M</span>
                              </div>
                              <div>
                                <div className="font-medium">Microsoft</div>
                                <div className="text-sm text-muted-foreground">Not connected</div>
                              </div>
                            </div>
                            <Button variant="outline" size="sm">
                              <LinkIcon className="h-4 w-4 mr-2" />
                              Connect
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Billing Tab */}
              <TabsContent value="billing" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <CreditCard className="h-5 w-5 mr-2" />
                      Billing & Subscription
                    </CardTitle>
                    <CardDescription>
                      Manage your subscription and billing information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                      <div className="p-4 bg-brand-50 border border-brand-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-brand-900">
                            {billing.plan === 'free' ? 'Free Plan' : billing.plan === 'pro' ? 'Pro Plan' : 'Enterprise Plan'}
                          </div>
                          <div className="text-sm text-brand-700">
                            {billing.plan === 'free' ? 'No cost' : 
                             billing.plan === 'pro' ? `$${billing.billingCycle === 'monthly' ? '29/month' : '290/year'}` : 
                             'Contact sales'} • Billed {billing.billingCycle}
                          </div>
                        </div>
                        <Badge className={billing.plan === 'free' ? 'bg-gray-600' : 'bg-brand-600'}>
                          {(billing as any).subscriptionStatus === 'active' ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">Payment Method</h4>
                      <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded"></div>
                          <div>
                            <div className="font-medium">•••• •••• •••• 4242</div>
                            <div className="text-sm text-muted-foreground">Expires 12/25</div>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            showAlert('info', 'Payment method update coming soon!');
                          }}
                        >
                          Update
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">Billing History</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between py-2">
                          <div>
                            <div className="font-medium">Pro Plan - January 2024</div>
                            <div className="text-sm text-muted-foreground">Paid on Jan 1, 2024</div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">$29.00</span>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between py-2">
                          <div>
                            <div className="font-medium">Pro Plan - December 2023</div>
                            <div className="text-sm text-muted-foreground">Paid on Dec 1, 2023</div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">$29.00</span>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button 
                        variant="outline"
                        onClick={() => showAlert('info', 'Payment method update coming soon!')}
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Update Payment Method
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => showAlert('success', 'Receipt download initiated')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Receipts
                      </Button>
                      <Button 
                        variant="destructive"
                        onClick={() => {
                          const confirmed = confirm('Are you sure you want to cancel your subscription? This action cannot be undone.');
                          if (confirmed) {
                            setBilling(prev => ({ ...prev, plan: 'free' } as any));
                            saveBilling();
                            showAlert('success', 'Subscription cancelled successfully');
                          }
                        }}
                      >
                        Cancel Subscription
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Preferences Tab */}
              <TabsContent value="preferences" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>App Preferences</CardTitle>
                    <CardDescription>
                      Customize your learning experience
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Theme</Label>
                        <Select 
                          value={preferences.theme} 
                          onValueChange={async (value) => {
                            const themeValue = value as "light" | "dark" | "auto";
                            setPreferences(prev => ({ ...prev, theme: themeValue }));
                            // Apply theme immediately and persist
                            try {
                              const { applyTheme } = await import("@/lib/theme");
                              applyTheme(themeValue);
                            } catch {
                              const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                              const dark = themeValue === 'dark' || (themeValue === 'auto' && systemDark);
                              document.documentElement.classList.toggle('dark', dark);
                            }
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="light">Light</SelectItem>
                            <SelectItem value="dark">Dark</SelectItem>
                            <SelectItem value="auto">System</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Language</Label>
                        <Select 
                          value={preferences.language} 
                          onValueChange={(value) => setPreferences(prev => ({ ...prev, language: value }))}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="es">Español</SelectItem>
                            <SelectItem value="fr">Français</SelectItem>
                            <SelectItem value="de">Deutsch</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Timezone</Label>
                        <Select 
                          value={preferences.timezone} 
                          onValueChange={(value) => setPreferences(prev => ({ ...prev, timezone: value }))}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="utc-8">Pacific Time (UTC-8)</SelectItem>
                            <SelectItem value="utc-5">Eastern Time (UTC-5)</SelectItem>
                            <SelectItem value="utc+0">UTC</SelectItem>
                            <SelectItem value="utc+1">Central European Time (UTC+1)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Default Learning Track</Label>
                        <Select 
                          value={preferences.defaultTrack || "marketing"} 
                          onValueChange={(value) => setPreferences(prev => ({ ...prev, defaultTrack: value }))}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {/* <SelectItem value="engineering">Engineering</SelectItem> */}
                            <SelectItem value="marketing">Marketing</SelectItem>
                            {/* <SelectItem value="design">Design</SelectItem>
                            <SelectItem value="research">Research</SelectItem> */}
                          </SelectContent>
                        </Select>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h4 className="font-medium">Data & Privacy</h4>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">Analytics</div>
                            <div className="text-sm text-muted-foreground">Help improve the platform with usage data</div>
                          </div>
                          <Switch 
                            checked={preferences.analytics} 
                            onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, analytics: checked }))}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">Personalization</div>
                            <div className="text-sm text-muted-foreground">Personalized content recommendations</div>
                          </div>
                          <Switch 
                            checked={preferences.personalization} 
                            onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, personalization: checked }))}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">Experimental Features</div>
                            <div className="text-sm text-muted-foreground">Enable beta features and improvements</div>
                          </div>
                          <Switch 
                            checked={preferences.experimentalFeatures} 
                            onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, experimentalFeatures: checked }))}
                          />
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h4 className="font-medium text-destructive">Danger Zone</h4>
                        
                        <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                          <div className="space-y-3">
                            <div>
                              <div className="font-medium">Download Your Data</div>
                              <div className="text-sm text-muted-foreground">
                                Export all your learning data, prompts, and progress
                              </div>
                            </div>
                            <Button 
                              variant="outline"
                              onClick={exportData}
                            >
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
                                Permanently delete your account and all associated data
                              </div>
                            </div>
                            <Button 
                              variant="destructive"
                              onClick={deleteAccount}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Account
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button 
                      disabled={saving.preferences} 
                      onClick={savePreferences}
                      className="w-full sm:w-auto save-success transition-all duration-200 hover:scale-105"
                    >
                      {saving.preferences ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                          Save Preferences
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}

