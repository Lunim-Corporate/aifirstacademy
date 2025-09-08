import { Router, type RequestHandler } from "express";
import { readDB, writeDB, createId, hashPassword } from "../storage";
import { verifyToken } from "../utils/jwt";
import crypto from "crypto";

const router = Router();

function getUserId(req: any): string | null {
  const auth = req.headers.authorization as string | undefined;
  if (!auth) return null;
  const token = auth.split(" ")[1];
  const payload = verifyToken(token || "");
  return payload?.sub || null;
}

function getUser(req: any): { id: string | null; role: string | null } {
  const auth = req.headers.authorization as string | undefined;
  if (!auth) return { id: null, role: null };
  const token = auth.split(" ")[1];
  const payload = verifyToken(token || "");
  return { id: payload?.sub || null, role: (payload as any)?.role || null };
}

export const getProfile: RequestHandler = (req, res) => {
  const uid = getUserId(req);
  if (!uid) return res.status(401).json({ error: "Unauthorized" });
  const db = readDB() as any;
  db.userProfiles = db.userProfiles || [];
  
  // Get user basic info
  const user = db.users.find((u: any) => u.id === uid);
  if (!user) return res.status(404).json({ error: "User not found" });
  
  // Get or create profile
  let profile = db.userProfiles.find((p: any) => p.userId === uid);
  if (!profile) {
    profile = {
      userId: uid,
      personaRole: "engineer",
      displayName: user.name,
      bio: "",
      location: "",
      website: "",
      company: "",
      jobTitle: "",
      skills: [],
      interests: [],
      timezone: "UTC",
      language: "en",
      avatar: "",
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.userProfiles.push(profile);
    writeDB(db);
  }
  
  const profileData = {
    ...profile,
    email: user.email,
    name: user.name,
    role: user.role,
    isVerified: user.isVerified,
    createdAt: user.createdAt
  };
  
  return res.json({ profile: profileData });
};

export const updateProfile: RequestHandler = (req, res) => {
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
    socialLinks,
    privacy
  } = req.body;
  
  const db = readDB() as any;
  db.userProfiles = db.userProfiles || [];
  
  // Validate personaRole if provided
  if (personaRole) {
    const allowed = ["engineer", "manager", "designer", "marketer", "researcher"];
    if (!allowed.includes(String(personaRole))) {
      return res.status(400).json({ error: "Invalid personaRole" });
    }
  }
  
  // Get or create profile
  let profile = db.userProfiles.find((p: any) => p.userId === uid);
  if (!profile) {
    const user = db.users.find((u: any) => u.id === uid);
    profile = {
      userId: uid,
      personaRole: "engineer",
      displayName: user?.name || "",
      bio: "",
      location: "",
      website: "",
      company: "",
      jobTitle: "",
      skills: [],
      interests: [],
      timezone: "UTC",
      language: "en",
      avatar: "",
      socialLinks: { twitter: "", linkedin: "", github: "", portfolio: "" },
      privacy: { profileVisible: true, emailVisible: false, activityVisible: true },
      createdAt: new Date().toISOString()
    };
    db.userProfiles.push(profile);
  }
  
  // Update fields
  if (personaRole !== undefined) profile.personaRole = personaRole;
  if (displayName !== undefined) profile.displayName = displayName;
  if (bio !== undefined) profile.bio = bio;
  if (location !== undefined) profile.location = location;
  if (website !== undefined) profile.website = website;
  if (company !== undefined) profile.company = company;
  if (jobTitle !== undefined) profile.jobTitle = jobTitle;
  if (skills !== undefined) profile.skills = Array.isArray(skills) ? skills : [];
  if (interests !== undefined) profile.interests = Array.isArray(interests) ? interests : [];
  if (timezone !== undefined) profile.timezone = timezone;
  if (language !== undefined) profile.language = language;
  if (avatar !== undefined) profile.avatar = avatar;
  if (socialLinks !== undefined) profile.socialLinks = { ...profile.socialLinks, ...socialLinks };
  if (privacy !== undefined) profile.privacy = { ...profile.privacy, ...privacy };
  
  profile.updatedAt = new Date().toISOString();
  
  writeDB(db);
  res.json({ profile, message: "Profile updated successfully" });
};

// Notifications Settings
export const getNotifications: RequestHandler = (req, res) => {
  const uid = getUserId(req);
  if (!uid) return res.status(401).json({ error: "Unauthorized" });
  
  const db = readDB() as any;
  db.notificationSettings = db.notificationSettings || [];
  
  let settings = db.notificationSettings.find((s: any) => s.userId === uid);
  if (!settings) {
    settings = {
      userId: uid,
      email: {
        enabled: true,
        frequency: "daily", // immediate, daily, weekly, never
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
    db.notificationSettings.push(settings);
    writeDB(db);
  }
  
  res.json({ settings });
};

export const updateNotifications: RequestHandler = (req, res) => {
  const uid = getUserId(req);
  if (!uid) return res.status(401).json({ error: "Unauthorized" });
  
  const { email, push, inApp } = req.body;
  
  const db = readDB() as any;
  db.notificationSettings = db.notificationSettings || [];
  
  let settings = db.notificationSettings.find((s: any) => s.userId === uid);
  if (!settings) {
    settings = {
      userId: uid,
      email: { enabled: true, frequency: "daily", types: {} },
      push: { enabled: true, types: {} },
      inApp: { enabled: true, types: {} },
      createdAt: new Date().toISOString()
    };
    db.notificationSettings.push(settings);
  }
  
  if (email !== undefined) settings.email = { ...settings.email, ...email };
  if (push !== undefined) settings.push = { ...settings.push, ...push };
  if (inApp !== undefined) settings.inApp = { ...settings.inApp, ...inApp };
  
  settings.updatedAt = new Date().toISOString();
  
  writeDB(db);
  res.json({ settings, message: "Notification settings updated successfully" });
};

// Security Settings
export const getSecurity: RequestHandler = (req, res) => {
  const uid = getUserId(req);
  if (!uid) return res.status(401).json({ error: "Unauthorized" });
  
  const db = readDB() as any;
  db.securitySettings = db.securitySettings || [];
  
  let settings = db.securitySettings.find((s: any) => s.userId === uid);
  if (!settings) {
    settings = {
      userId: uid,
      twoFactorEnabled: false,
      loginNotifications: true,
      sessionTimeout: 30, // days
      passwordLastChanged: new Date().toISOString(),
      trustedDevices: [],
      loginHistory: [],
      apiKeys: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.securitySettings.push(settings);
    writeDB(db);
  }
  
  // Don't expose sensitive data
  const safeSettings = {
    ...settings,
    apiKeys: settings.apiKeys.map((key: any) => ({
      id: key.id,
      name: key.name,
      lastUsed: key.lastUsed,
      createdAt: key.createdAt,
      permissions: key.permissions
    }))
  };
  
  res.json({ settings: safeSettings });
};

export const updateSecurity: RequestHandler = (req, res) => {
  const uid = getUserId(req);
  if (!uid) return res.status(401).json({ error: "Unauthorized" });
  
  const { twoFactorEnabled, loginNotifications, sessionTimeout } = req.body;
  
  const db = readDB() as any;
  db.securitySettings = db.securitySettings || [];
  
  let settings = db.securitySettings.find((s: any) => s.userId === uid);
  if (!settings) {
    settings = {
      userId: uid,
      twoFactorEnabled: false,
      loginNotifications: true,
      sessionTimeout: 30,
      passwordLastChanged: new Date().toISOString(),
      trustedDevices: [],
      loginHistory: [],
      apiKeys: [],
      createdAt: new Date().toISOString()
    };
    db.securitySettings.push(settings);
  }
  
  if (typeof twoFactorEnabled === 'boolean') settings.twoFactorEnabled = twoFactorEnabled;
  if (typeof loginNotifications === 'boolean') settings.loginNotifications = loginNotifications;
  if (typeof sessionTimeout === 'number' && sessionTimeout > 0) settings.sessionTimeout = sessionTimeout;
  
  settings.updatedAt = new Date().toISOString();
  
  writeDB(db);
  res.json({ settings, message: "Security settings updated successfully" });
};

export const changePassword: RequestHandler = (req, res) => {
  const uid = getUserId(req);
  if (!uid) return res.status(401).json({ error: "Unauthorized" });
  
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Current password and new password are required" });
  }
  
  if (newPassword.length < 8) {
    return res.status(400).json({ error: "New password must be at least 8 characters long" });
  }
  
  const db = readDB() as any;
  const user = db.users.find((u: any) => u.id === uid);
  if (!user) return res.status(404).json({ error: "User not found" });
  
  // Verify current password
  const currentHash = hashPassword(currentPassword, user.salt);
  if (currentHash !== user.passwordHash) {
    return res.status(400).json({ error: "Current password is incorrect" });
  }
  
  // Update password
  const newSalt = crypto.randomBytes(8).toString('hex');
  const newHash = hashPassword(newPassword, newSalt);
  
  user.salt = newSalt;
  user.passwordHash = newHash;
  
  // Update security settings
  db.securitySettings = db.securitySettings || [];
  let secSettings = db.securitySettings.find((s: any) => s.userId === uid);
  if (secSettings) {
    secSettings.passwordLastChanged = new Date().toISOString();
  }
  
  writeDB(db);
  res.json({ message: "Password changed successfully" });
};

// Billing Settings (Mock Implementation)
export const getBilling: RequestHandler = (req, res) => {
  const uid = getUserId(req);
  if (!uid) return res.status(401).json({ error: "Unauthorized" });
  
  const db = readDB() as any;
  db.billingSettings = db.billingSettings || [];
  
  let settings = db.billingSettings.find((s: any) => s.userId === uid);
  if (!settings) {
    settings = {
      userId: uid,
      plan: "free", // free, pro, enterprise
      billingCycle: "monthly", // monthly, yearly
      paymentMethod: null,
      billingAddress: {
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: ""
      },
      subscriptionStatus: "active",
      nextBillingDate: null,
      invoices: [],
      usage: {
        promptsUsed: 0,
        promptsLimit: 100,
        storageUsed: 0,
        storageLimit: 1000
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.billingSettings.push(settings);
    writeDB(db);
  }
  
  res.json({ settings });
};

export const updateBilling: RequestHandler = (req, res) => {
  const uid = getUserId(req);
  if (!uid) return res.status(401).json({ error: "Unauthorized" });
  
  const { plan, billingCycle, billingAddress } = req.body;
  
  const db = readDB() as any;
  db.billingSettings = db.billingSettings || [];
  
  let settings = db.billingSettings.find((s: any) => s.userId === uid);
  if (!settings) {
    settings = {
      userId: uid,
      plan: "free",
      billingCycle: "monthly",
      paymentMethod: null,
      billingAddress: {},
      subscriptionStatus: "active",
      nextBillingDate: null,
      invoices: [],
      usage: { promptsUsed: 0, promptsLimit: 100, storageUsed: 0, storageLimit: 1000 },
      createdAt: new Date().toISOString()
    };
    db.billingSettings.push(settings);
  }
  
  if (plan && ["free", "pro", "enterprise"].includes(plan)) {
    settings.plan = plan;
    // Update limits based on plan
    if (plan === "pro") {
      settings.usage.promptsLimit = 1000;
      settings.usage.storageLimit = 10000;
    } else if (plan === "enterprise") {
      settings.usage.promptsLimit = -1; // unlimited
      settings.usage.storageLimit = -1; // unlimited
    }
  }
  
  if (billingCycle && ["monthly", "yearly"].includes(billingCycle)) {
    settings.billingCycle = billingCycle;
  }
  
  if (billingAddress) {
    settings.billingAddress = { ...settings.billingAddress, ...billingAddress };
  }
  
  settings.updatedAt = new Date().toISOString();
  
  writeDB(db);
  res.json({ settings, message: "Billing settings updated successfully" });
};

// Preferences Settings
export const getPreferences: RequestHandler = (req, res) => {
  const uid = getUserId(req);
  if (!uid) return res.status(401).json({ error: "Unauthorized" });
  
  const db = readDB() as any;
  db.userPreferences = db.userPreferences || [];
  
  let preferences = db.userPreferences.find((p: any) => p.userId === uid);
  if (!preferences) {
    preferences = {
      userId: uid,
      theme: "light", // light, dark, auto
      language: "en",
      timezone: "UTC",
      dateFormat: "MM/DD/YYYY",
      timeFormat: "12h", // 12h, 24h
      autoSave: true,
      codeTheme: "vs-code-light",
      fontSize: 14,
      lineNumbers: true,
      wordWrap: false,
      minimap: true,
      suggestions: true,
      autoComplete: true,
      keyBindings: "default", // default, vim, emacs
      experimentalFeatures: false,
      analytics: true,
      errorReporting: true,
      betaFeatures: false,
      shortcuts: {
        save: "Ctrl+S",
        run: "Ctrl+R",
        format: "Ctrl+Shift+F"
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.userPreferences.push(preferences);
    writeDB(db);
  }
  
  res.json({ preferences });
};

export const updatePreferences: RequestHandler = (req, res) => {
  const uid = getUserId(req);
  if (!uid) return res.status(401).json({ error: "Unauthorized" });
  
  const updates = req.body;
  
  const db = readDB() as any;
  db.userPreferences = db.userPreferences || [];
  
  let preferences = db.userPreferences.find((p: any) => p.userId === uid);
  if (!preferences) {
    preferences = {
      userId: uid,
      theme: "light",
      language: "en",
      timezone: "UTC",
      dateFormat: "MM/DD/YYYY",
      timeFormat: "12h",
      autoSave: true,
      codeTheme: "vs-code-light",
      fontSize: 14,
      lineNumbers: true,
      wordWrap: false,
      minimap: true,
      suggestions: true,
      autoComplete: true,
      keyBindings: "default",
      experimentalFeatures: false,
      analytics: true,
      errorReporting: true,
      betaFeatures: false,
      shortcuts: {},
      createdAt: new Date().toISOString()
    };
    db.userPreferences.push(preferences);
  }
  
  // Update preferences
  Object.keys(updates).forEach(key => {
    if (updates[key] !== undefined) {
      if (key === "shortcuts" && typeof updates[key] === "object") {
        preferences.shortcuts = { ...preferences.shortcuts, ...updates[key] };
      } else {
        preferences[key] = updates[key];
      }
    }
  });
  
  preferences.updatedAt = new Date().toISOString();
  
  writeDB(db);
  res.json({ preferences, message: "Preferences updated successfully" });
};

// Export Data
export const exportData: RequestHandler = (req, res) => {
  const uid = getUserId(req);
  if (!uid) return res.status(401).json({ error: "Unauthorized" });
  
  const db = readDB() as any;
  
  // Collect user data
  const user = db.users.find((u: any) => u.id === uid);
  const profile = db.userProfiles.find((p: any) => p.userId === uid);
  const notifications = db.notificationSettings.find((n: any) => n.userId === uid);
  const security = db.securitySettings.find((s: any) => s.userId === uid);
  const billing = db.billingSettings.find((b: any) => b.userId === uid);
  const preferences = db.userPreferences.find((p: any) => p.userId === uid);
  const userLibrary = db.libraryByUser.find((l: any) => l.userId === uid);
  const userPrompts = db.prompts.filter((p: any) => p.authorId === uid);
  const userComments = db.promptComments.filter((c: any) => c.userId === uid);
  const userProgress = db.userLearning.filter((l: any) => l.userId === uid);
  
  const exportData = {
    user: user ? { 
      id: user.id, 
      email: user.email, 
      name: user.name, 
      role: user.role, 
      createdAt: user.createdAt 
    } : null,
    profile,
    settings: {
      notifications,
      security: security ? {
        ...security,
        // Remove sensitive data
        apiKeys: security.apiKeys?.map((key: any) => ({
          id: key.id,
          name: key.name,
          permissions: key.permissions,
          createdAt: key.createdAt
        })),
        trustedDevices: security.trustedDevices?.map((device: any) => ({
          id: device.id,
          name: device.name,
          lastUsed: device.lastUsed
        }))
      } : null,
      billing,
      preferences
    },
    content: {
      library: userLibrary?.resources || [],
      prompts: userPrompts,
      comments: userComments
    },
    learning: {
      progress: userProgress
    },
    exportedAt: new Date().toISOString()
  };
  
  res.json({ data: exportData, message: "Data exported successfully" });
};

// Delete Account
export const deleteAccount: RequestHandler = (req, res) => {
  const { id: uid, role } = getUser(req);
  if (!uid) return res.status(401).json({ error: "Unauthorized" });
  
  const { confirmPassword } = req.body;
  
  if (!confirmPassword) {
    return res.status(400).json({ error: "Password confirmation required" });
  }
  
  const db = readDB() as any;
  const user = db.users.find((u: any) => u.id === uid);
  if (!user) return res.status(404).json({ error: "User not found" });
  
  // Verify password
  const passwordHash = hashPassword(confirmPassword, user.salt);
  if (passwordHash !== user.passwordHash) {
    return res.status(400).json({ error: "Password confirmation failed" });
  }
  
  // Remove all user data
  db.users = db.users.filter((u: any) => u.id !== uid);
  db.userProfiles = (db.userProfiles || []).filter((p: any) => p.userId !== uid);
  db.notificationSettings = (db.notificationSettings || []).filter((n: any) => n.userId !== uid);
  db.securitySettings = (db.securitySettings || []).filter((s: any) => s.userId !== uid);
  db.billingSettings = (db.billingSettings || []).filter((b: any) => b.userId !== uid);
  db.userPreferences = (db.userPreferences || []).filter((p: any) => p.userId !== uid);
  db.libraryByUser = (db.libraryByUser || []).filter((l: any) => l.userId !== uid);
  db.promptLikes = (db.promptLikes || []).filter((l: any) => l.userId !== uid);
  db.promptSaves = (db.promptSaves || []).filter((s: any) => s.userId !== uid);
  db.promptComments = (db.promptComments || []).filter((c: any) => c.userId !== uid);
  db.userLearning = (db.userLearning || []).filter((l: any) => l.userId !== uid);
  db.notifications = (db.notifications || []).filter((n: any) => n.userId !== uid);
  
  // Keep prompts but anonymize them (or delete based on preference)
  db.prompts.forEach((p: any) => {
    if (p.authorId === uid) {
      p.authorId = "deleted_user";
      p.authorName = "Deleted User";
    }
  });
  
  writeDB(db);
  res.json({ message: "Account deleted successfully" });
};

// Routes
router.get("/profile", getProfile);
router.put("/profile", updateProfile);

router.get("/notifications", getNotifications);
router.put("/notifications", updateNotifications);

router.get("/security", getSecurity);
router.put("/security", updateSecurity);
router.post("/security/change-password", changePassword);

router.get("/billing", getBilling);
router.put("/billing", updateBilling);

router.get("/preferences", getPreferences);
router.put("/preferences", updatePreferences);

router.get("/export", exportData);
router.delete("/account", deleteAccount);

export default router;
