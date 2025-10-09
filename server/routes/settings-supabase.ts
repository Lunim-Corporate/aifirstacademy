import { Router, type RequestHandler } from "express";
import { getUserById, updateUser } from "../storage-supabase";
import { verifyToken } from "../utils/jwt";

const router = Router();

function getTokenFromCookie(req: any): string | null {
  const raw = req.headers.cookie as string | undefined;
  if (!raw) return null;
  const parts = raw.split(/;\s*/);
  for (const p of parts) {
    const [k, v] = p.split("=", 2);
    if (k?.trim() === "auth_token") {
      return decodeURIComponent(v || "").trim() || null;
    }
  }
  return null;
}

function getUser(req: any): { id: string | null; role: string | null } {
  const auth = req.headers.authorization as string | undefined;
  const token = auth ? auth.split(" ")[1] : getTokenFromCookie(req);
  if (!token) return { id: null, role: null };
  const payload = verifyToken(token);
  if (!payload) return { id: null, role: null };
  
  // Handle both new (userId) and legacy (sub) token formats
  const userId = (payload as any)?.userId || payload?.sub || null;
  const role = (payload as any)?.role || null;
  
  return { id: userId, role };
}

function getUserId(req: any): string | null {
  return getUser(req).id;
}

// ========================================
// PROFILE SETTINGS
// ========================================

export const getProfile: RequestHandler = async (req, res) => {
  try {
    const uid = getUserId(req);
    if (!uid) return res.status(401).json({ error: "Unauthorized" });

    const user = await getUserById(uid);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Map user data to profile format expected by frontend
    const profileData = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isVerified: user.is_verified || false,
      personaRole: user.persona_role || "engineer",
      displayName: user.display_name || user.name,
      bio: user.bio || "",
      location: user.location || "",
      website: user.website || "",
      company: user.company || "",
      jobTitle: user.job_title || "",
      skills: user.skills || [],
      interests: user.interests || [],
      timezone: user.timezone || "UTC",
      language: user.language || "en",
      avatar: user.avatar || "",
      socialLinks: {
        twitter: "",
        linkedin: "",
        github: "",
        portfolio: ""
      },
      privacy: {
        profileVisible: true,
        emailVisible: false,
        activityVisible: true
      },
      createdAt: user.created_at,
      updatedAt: user.updated_at
    };

    return res.json({ profile: profileData });
  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateProfile: RequestHandler = async (req, res) => {
  try {
    const uid = getUserId(req);
    if (!uid) return res.status(401).json({ error: "Unauthorized" });

    const {
      personaRole,
      displayName,
      bio,
      location,
      website,
      company,
      jobTitle,
      skills,
      interests,
      timezone,
      language,
      avatar,
    } = req.body;

    // Validate personaRole if provided
    if (personaRole) {
      const allowed = ["engineer", "manager", "designer", "marketer", "researcher"];
      if (!allowed.includes(String(personaRole))) {
        return res.status(400).json({ error: "Invalid personaRole" });
      }
    }

    // Build update object with only provided fields
    const updates: any = {};
    if (personaRole !== undefined) updates.persona_role = personaRole;
    if (displayName !== undefined) updates.display_name = displayName;
    if (bio !== undefined) updates.bio = bio;
    if (location !== undefined) updates.location = location;
    if (website !== undefined) updates.website = website;
    if (company !== undefined) updates.company = company;
    if (jobTitle !== undefined) updates.job_title = jobTitle;
    if (skills !== undefined) updates.skills = Array.isArray(skills) ? skills : [];
    if (interests !== undefined) updates.interests = Array.isArray(interests) ? interests : [];
    if (timezone !== undefined) updates.timezone = timezone;
    if (language !== undefined) updates.language = language;
    if (avatar !== undefined) updates.avatar = avatar;

    const updatedUser = await updateUser(uid, updates);

    const profileData = {
      userId: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      isVerified: updatedUser.is_verified || false,
      personaRole: updatedUser.persona_role || "engineer",
      displayName: updatedUser.display_name || updatedUser.name,
      bio: updatedUser.bio || "",
      location: updatedUser.location || "",
      website: updatedUser.website || "",
      company: updatedUser.company || "",
      jobTitle: updatedUser.job_title || "",
      skills: updatedUser.skills || [],
      interests: updatedUser.interests || [],
      timezone: updatedUser.timezone || "UTC",
      language: updatedUser.language || "en",
      avatar: updatedUser.avatar || "",
      createdAt: updatedUser.created_at,
      updatedAt: updatedUser.updated_at
    };

    res.json({ profile: profileData, message: "Profile updated successfully" });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ========================================
// OTHER SETTINGS (Placeholders for now)
// ========================================

export const getNotifications: RequestHandler = async (req, res) => {
  try {
    const uid = getUserId(req);
    if (!uid) return res.status(401).json({ error: "Unauthorized" });
    
    // Return default notification settings
    const settings = {
      userId: uid,
      email: {
        enabled: true,
        frequency: "daily",
        types: {
          likes: true,
          comments: true,
          saves: true,
          follows: true,
          achievements: true,
          system: true,
          marketing: false
        }
      },
      push: {
        enabled: true,
        types: {
          likes: false,
          comments: true,
          saves: false,
          follows: true,
          achievements: true,
          system: true,
          marketing: false
        }
      },
      inApp: {
        enabled: true,
        types: {
          likes: true,
          comments: true,
          saves: true,
          follows: true,
          achievements: true,
          system: true,
          marketing: false
        }
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    res.json({ settings });
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateNotifications: RequestHandler = async (req, res) => {
  try {
    const uid = getUserId(req);
    if (!uid) return res.status(401).json({ error: "Unauthorized" });
    
    const { email, push, inApp } = req.body;
    
    // For now, return the submitted settings back (mock functionality)
    // TODO: Implement actual notification settings storage in Supabase
    const updatedSettings = {
      userId: uid,
      email: email || {
        enabled: true,
        frequency: "daily",
        types: {
          likes: true,
          comments: true,
          saves: true,
          follows: true,
          achievements: true,
          system: true,
          marketing: false
        }
      },
      push: push || {
        enabled: true,
        types: {
          likes: false,
          comments: true,
          saves: false,
          follows: true,
          achievements: true,
          system: true,
          marketing: false
        }
      },
      inApp: inApp || {
        enabled: true,
        types: {
          likes: true,
          comments: true,
          saves: true,
          follows: true,
          achievements: true,
          system: true,
          marketing: false
        }
      },
      updatedAt: new Date().toISOString()
    };
    
    res.json({ settings: updatedSettings, message: "Notification settings updated successfully" });
  } catch (error) {
    console.error('Error updating notifications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getSecurity: RequestHandler = async (req, res) => {
  try {
    const uid = getUserId(req);
    if (!uid) return res.status(401).json({ error: "Unauthorized" });
    
    // Return default security settings
    const settings = {
      userId: uid,
      twoFactorEnabled: false,
      loginNotifications: true,
      trustedDevices: [],
      apiKeys: [],
      sessions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    res.json({ settings });
  } catch (error) {
    console.error('Error getting security:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateSecurity: RequestHandler = async (req, res) => {
  try {
    const uid = getUserId(req);
    if (!uid) return res.status(401).json({ error: "Unauthorized" });
    
    const { twoFactorEnabled, loginNotifications, sessionTimeout } = req.body;
    
    // For now, return mock updated settings
    // TODO: Implement actual security settings storage in Supabase
    const updatedSettings = {
      userId: uid,
      twoFactorEnabled: typeof twoFactorEnabled === 'boolean' ? twoFactorEnabled : false,
      loginNotifications: typeof loginNotifications === 'boolean' ? loginNotifications : true,
      sessionTimeout: typeof sessionTimeout === 'number' ? sessionTimeout : 30,
      trustedDevices: [],
      apiKeys: [],
      sessions: [],
      updatedAt: new Date().toISOString()
    };
    
    res.json({ settings: updatedSettings, message: "Security settings updated successfully" });
  } catch (error) {
    console.error('Error updating security:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getBilling: RequestHandler = async (req, res) => {
  try {
    const uid = getUserId(req);
    if (!uid) return res.status(401).json({ error: "Unauthorized" });
    
    // Return default billing settings
    const settings = {
      userId: uid,
      plan: "free",
      status: "active",
      billingCycle: "monthly",
      nextBillingDate: null,
      paymentMethod: null,
      invoices: [],
      usage: {
        apiCalls: 0,
        storageUsed: 0,
        promptsCreated: 0
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    res.json({ settings });
  } catch (error) {
    console.error('Error getting billing:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateBilling: RequestHandler = async (req, res) => {
  try {
    const uid = getUserId(req);
    if (!uid) return res.status(401).json({ error: "Unauthorized" });
    
    const { plan, billingCycle, billingAddress } = req.body;
    
    // For now, return mock updated settings
    // TODO: Implement actual billing settings storage in Supabase
    const updatedSettings = {
      userId: uid,
      plan: plan || "free",
      status: "active",
      billingCycle: billingCycle || "monthly",
      billingAddress: billingAddress || {},
      nextBillingDate: null,
      paymentMethod: null,
      invoices: [],
      usage: {
        apiCalls: 0,
        storageUsed: 0,
        promptsCreated: 0
      },
      updatedAt: new Date().toISOString()
    };
    
    res.json({ settings: updatedSettings, message: "Billing settings updated successfully" });
  } catch (error) {
    console.error('Error updating billing:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getPreferences: RequestHandler = async (req, res) => {
  try {
    const uid = getUserId(req);
    if (!uid) return res.status(401).json({ error: "Unauthorized" });
    
    // Return default preferences
    const preferences = {
      userId: uid,
      theme: "light",
      language: "en",
      timezone: "UTC",
      dateFormat: "MM/dd/yyyy",
      timeFormat: "12h",
      emailDigest: "daily",
      autoSave: true,
      showTips: true,
      compactMode: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    res.json({ preferences });
  } catch (error) {
    console.error('Error getting preferences:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updatePreferences: RequestHandler = async (req, res) => {
  try {
    const uid = getUserId(req);
    if (!uid) return res.status(401).json({ error: "Unauthorized" });
    
    const updates = req.body;
    
    // For now, return mock updated preferences with submitted changes
    // TODO: Implement actual preferences storage in Supabase
    const updatedPreferences = {
      userId: uid,
      theme: updates.theme || "light",
      language: updates.language || "en",
      timezone: updates.timezone || "UTC",
      dateFormat: updates.dateFormat || "MM/dd/yyyy",
      timeFormat: updates.timeFormat || "12h",
      emailDigest: updates.emailDigest || "daily",
      autoSave: typeof updates.autoSave === 'boolean' ? updates.autoSave : true,
      showTips: typeof updates.showTips === 'boolean' ? updates.showTips : true,
      compactMode: typeof updates.compactMode === 'boolean' ? updates.compactMode : false,
      analytics: typeof updates.analytics === 'boolean' ? updates.analytics : true,
      personalization: typeof updates.personalization === 'boolean' ? updates.personalization : true,
      experimentalFeatures: typeof updates.experimentalFeatures === 'boolean' ? updates.experimentalFeatures : false,
      defaultTrack: updates.defaultTrack || "engineering",
      updatedAt: new Date().toISOString()
    };
    
    res.json({ preferences: updatedPreferences, message: "Preferences updated successfully" });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Password Change
export const changePassword: RequestHandler = async (req, res) => {
  try {
    const uid = getUserId(req);
    if (!uid) return res.status(401).json({ error: "Unauthorized" });
    
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current password and new password are required" });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters long" });
    }
    
    // TODO: Implement actual password verification and update in Supabase
    // For now, just return success (mock functionality)
    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Data Export
export const exportData: RequestHandler = async (req, res) => {
  try {
    const uid = getUserId(req);
    if (!uid) return res.status(401).json({ error: "Unauthorized" });
    
    // TODO: Implement actual data collection from Supabase
    // For now, return mock data
    const exportData = {
      user: {
        id: uid,
        exportedAt: new Date().toISOString()
      },
      profile: {},
      settings: {},
      content: {
        prompts: [],
        comments: [],
        library: []
      },
      learning: {
        progress: [],
        certificates: []
      }
    };
    
    res.json({ data: exportData, message: "Data export completed" });
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete Account
export const deleteAccount: RequestHandler = async (req, res) => {
  try {
    const uid = getUserId(req);
    if (!uid) return res.status(401).json({ error: "Unauthorized" });
    
    const { confirmPassword } = req.body;
    
    if (!confirmPassword) {
      return res.status(400).json({ error: "Password confirmation required" });
    }
    
    // TODO: Implement actual account deletion in Supabase
    // For now, just return success (mock functionality)
    // In production, this would verify password and delete all user data
    res.json({ message: "Account deletion request received. This feature is not yet implemented." });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ========================================
// ROUTES
// ========================================

router.get("/profile", getProfile);
router.put("/profile", updateProfile);

router.get("/notifications", getNotifications);
router.put("/notifications", updateNotifications);

router.get("/security", getSecurity);
router.put("/security", updateSecurity);

router.get("/billing", getBilling);
router.put("/billing", updateBilling);

router.get("/preferences", getPreferences);
router.put("/preferences", updatePreferences);

// Additional endpoints
router.post("/security/change-password", changePassword);
router.get("/export", exportData);
router.delete("/account", deleteAccount);

export default router;
