import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string; // sha256(salt+password)
  salt: string;
  role: "student" | "instructor" | "admin";
  createdAt: string;
  isVerified?: boolean;
}

export interface Prompt {
  id: string;
  title: string;
  content: string;
  authorId: string;
  tags: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  likes: number;
  saves: number;
  views: number;
  runs: number;
  createdAt: string;
}

export type ResourceType = "prompt" | "template" | "guide" | "video";
export interface ResourceBase {
  id: string;
  type: ResourceType;
  title: string;
  tags: string[];
  createdAt: string;
}
export interface PromptResource extends ResourceBase {
  type: "prompt";
  content: string;
}
export interface TemplateResource extends ResourceBase {
  type: "template";
  content: string;
}
export interface GuideResource extends ResourceBase {
  type: "guide";
  url?: string;
  description: string;
  content?: string;
  author?: string;
  category?: string;
}
export interface VideoResource extends ResourceBase {
  type: "video";
  url: string;
  duration: string;
}
export type LibraryResource = PromptResource | TemplateResource | GuideResource | VideoResource;

export interface PromptComment {
  id: string;
  promptId: string;
  userId: string;
  content: string;
  createdAt: string;
}

export interface Discussion {
  id: string;
  title: string;
  authorId: string;
  category: string;
  tags: string[];
  views: number;
  replies: number;
  isPinned?: boolean;
  createdAt: string;
  lastActivityAt: string;
}
export interface DiscussionReply {
  id: string;
  discussionId: string;
  authorId: string;
  content: string;
  createdAt: string;
}

export interface ChallengeCriteria {
  likesWeight: number;
  savesWeight: number;
  runsWeight: number;
  viewsWeight: number;
}
export interface Challenge {
  id: string;
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  criteria: ChallengeCriteria;
}
export interface ChallengeEntryMetrics { likes: number; saves: number; runs: number; views: number }
export interface ChallengeEntry {
  id: string;
  challengeId: string;
  authorId: string;
  title: string;
  content: string;
  metrics: ChallengeEntryMetrics;
  createdAt: string;
}

export interface Certificate {
  id: string;
  userId: string;
  trackId: string;
  title: string;
  issuedAt: string;
  score: number;
  credentialId: string;
}

export type LessonType = "video" | "text" | "reading" | "sandbox" | "quiz" | "interactive";
export interface TrackModuleLesson {
  id: string;
  title: string;
  durationMin: number;
  type?: LessonType;
  level?: "beginner" | "intermediate" | "advanced";
  status?: "completed" | "in-progress" | "locked";
  content?: string;
  videoUrl?: string;
}
export interface TrackModule {
  id: string;
  title: string;
  description: string;
  estimatedHours?: number;
  lessons: TrackModuleLesson[];
}
export interface Track {
  id: string;
  title: string;
  description?: string;
  level: "beginner" | "intermediate" | "advanced";
  role?: string;
  estimatedHours?: number;
  certificateAvailable?: boolean;
  modules: TrackModule[];
}

export interface UserLessonProgress {
  userId: string;
  trackId: string;
  moduleId: string;
  lessonId: string;
  status: "not_started" | "in_progress" | "completed";
  startedAt?: string;
  completedAt?: string;
  updatedAt: string;
}

export interface OTPChallenge {
  id: string;
  pendingId: string;
  email: string;
  userId?: string;
  purpose: "signup" | "login" | "reset";
  code: string; // 6 digits
  expiresAt: string;
  consumedAt?: string;
}

export type NotificationType = "system" | "like" | "reply" | "save" | "achievement";
export interface NotificationItem {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  href?: string;
  createdAt: string;
  readAt?: string;
}

export interface UserProfile { 
  userId: string; 
  personaRole: "engineer"|"manager"|"designer"|"marketer"|"researcher";
  displayName?: string;
  bio?: string;
  location?: string;
  website?: string;
  company?: string;
  jobTitle?: string;
  skills?: string[];
  interests?: string[];
  timezone?: string;
  language?: string;
  avatar?: string;
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
  privacy?: {
    profileVisible?: boolean;
    emailVisible?: boolean;
    activityVisible?: boolean;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface NotificationSettings {
  userId: string;
  email: {
    enabled: boolean;
    frequency: "immediate" | "daily" | "weekly" | "never";
    types: {
      likes: boolean;
      comments: boolean;
      saves: boolean;
      follows: boolean;
      achievements: boolean;
      system: boolean;
      marketing: boolean;
    };
  };
  push: {
    enabled: boolean;
    types: {
      likes: boolean;
      comments: boolean;
      saves: boolean;
      follows: boolean;
      achievements: boolean;
      system: boolean;
      marketing: boolean;
    };
  };
  inApp: {
    enabled: boolean;
    types: {
      likes: boolean;
      comments: boolean;
      saves: boolean;
      follows: boolean;
      achievements: boolean;
      system: boolean;
      marketing: boolean;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface SecuritySettings {
  userId: string;
  twoFactorEnabled: boolean;
  loginNotifications: boolean;
  sessionTimeout: number;
  passwordLastChanged: string;
  trustedDevices: Array<{
    id: string;
    name: string;
    lastUsed: string;
    ipAddress?: string;
    userAgent?: string;
  }>;
  loginHistory: Array<{
    timestamp: string;
    ipAddress: string;
    userAgent: string;
    success: boolean;
  }>;
  apiKeys: Array<{
    id: string;
    name: string;
    key: string;
    permissions: string[];
    lastUsed?: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface BillingSettings {
  userId: string;
  plan: "free" | "pro" | "enterprise";
  billingCycle: "monthly" | "yearly";
  paymentMethod: {
    type: "card" | "paypal" | null;
    last4?: string;
    brand?: string;
    expiryMonth?: number;
    expiryYear?: number;
  } | null;
  billingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  subscriptionStatus: "active" | "cancelled" | "past_due" | "trialing";
  nextBillingDate: string | null;
  invoices: Array<{
    id: string;
    amount: number;
    currency: string;
    status: "paid" | "pending" | "failed";
    date: string;
    downloadUrl?: string;
  }>;
  usage: {
    promptsUsed: number;
    promptsLimit: number;
    storageUsed: number;
    storageLimit: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  userId: string;
  theme: "light" | "dark" | "auto";
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: "12h" | "24h";
  autoSave: boolean;
  codeTheme: string;
  fontSize: number;
  lineNumbers: boolean;
  wordWrap: boolean;
  minimap: boolean;
  suggestions: boolean;
  autoComplete: boolean;
  keyBindings: "default" | "vim" | "emacs";
  experimentalFeatures: boolean;
  analytics: boolean;
  errorReporting: boolean;
  betaFeatures: boolean;
  shortcuts: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface DB {
  users: User[];
  prompts: Prompt[];
  promptComments: PromptComment[];
  promptLikes: { promptId: string; userId: string }[];
  promptSaves: { promptId: string; userId: string }[];
  certificates: Certificate[];
  tracks: Track[];
  libraryAcademy: LibraryResource[];
  libraryByUser: { userId: string; resources: LibraryResource[] }[];
  discussions: Discussion[];
  discussionReplies: DiscussionReply[];
  challenges: Challenge[];
  challengeEntries: ChallengeEntry[];
  challengeEntryLikes: { entryId: string; userId: string }[];
  challengeEntrySaves: { entryId: string; userId: string }[];
  otps: OTPChallenge[];
  notifications: NotificationItem[];
  userLearning: UserLessonProgress[];
  userProfiles: UserProfile[];
  notificationSettings: NotificationSettings[];
  securitySettings: SecuritySettings[];
  billingSettings: BillingSettings[];
  userPreferences: UserPreferences[];
}

const DATA_DIR = path.resolve(process.cwd(), "server/data");
const DB_FILE = path.join(DATA_DIR, "db.json");

// In-memory fallback for serverless environments where file system isn't writable
let memoryDB: DB | null = null;
let isServerless = false;

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (error) {
    console.warn('Cannot create data directory, using memory storage:', error);
    isServerless = true;
  }
}

function initDB(): DB {
  const now = new Date().toISOString();
  const academyResources: LibraryResource[] = [
    { id: "lr_prompt_1", type: "prompt", title: "Bug Analysis Prompt", tags: ["engineering"], createdAt: now, content: "I have a bug in my {{language}} code..." },
    { id: "lr_tmpl_1", type: "template", title: "Code Review Template", tags: ["engineering"], createdAt: now, content: "Please review the following {{language}} code for..." },
    { id: "lr_guide_1", type: "guide", title: "Prompt Engineering 101", tags: ["guide"], createdAt: now, url: "https://platform.openai.com/docs/guides/prompt-engineering", description: "Foundational techniques and patterns" },
    { id: "lr_video_1", type: "video", title: "AI-First Academy Demo", tags: ["demo"], createdAt: now, url: "https://www.youtube.com/embed/dQw4w9WgXcQ", duration: "3:32" },
  ];
  const challenges: Challenge[] = [
    {
      id: "ch_weekly_1",
      title: "Weekly Prompt Challenge",
      description: "Create the best debugging prompt for JavaScript",
      startAt: now,
      endAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      criteria: { likesWeight: 0.4, savesWeight: 0.3, runsWeight: 0.2, viewsWeight: 0.1 },
    },
  ];
  return {
    users: [
      {
        id: "u_admin",
        email: "admin@aifirst.academy",
        name: "Admin",
        role: "admin",
        salt: crypto.randomBytes(8).toString("hex"),
        passwordHash: "",
        createdAt: now,
        isVerified: true,
      },
    ],
    prompts: [],
    promptComments: [],
    promptLikes: [],
    promptSaves: [],
    certificates: [],
    tracks: [
      // Engineering Track
      {
        id: "eng_track",
        title: "AI-First Engineering Mastery",
        description: "Master AI-powered development from prompt engineering to production deployment",
        role: "engineer",
        level: "beginner",
        estimatedHours: 24,
        certificateAvailable: true,
        modules: [
          {
            id: "eng_m1",
            title: "Prompt Engineering Fundamentals",
            description: "Learn the core principles of effective AI prompting for software development",
            estimatedHours: 4,
            lessons: [
              {
                id: "eng_l1",
                title: "Understanding AI Language Models",
                type: "reading",
                durationMin: 15,
                level: "beginner",
                content: "# Understanding AI Language Models\n\n## What are Large Language Models?\n\nLarge Language Models (LLMs) like GPT-4, Claude, and others are AI systems trained on vast amounts of text data. They excel at understanding context and generating human-like responses.\n\n## Key Concepts:\n\n### 1. Context Window\nThe context window is the amount of text the AI can \"remember\" in a single conversation. Most models have limits (e.g., 8K, 32K, or 128K tokens).\n\n### 2. Tokens\nTokens are pieces of text the AI processes. Roughly:\n- 1 token ≈ 0.75 words\n- 1 token ≈ 4 characters\n\n### 3. Temperature\nControls randomness in responses:\n- Lower (0-0.3): More focused, deterministic\n- Higher (0.7-1.0): More creative, varied\n\n## Best Practices for Engineers:\n\n1. **Be Specific**: Instead of \"write a function,\" say \"write a Python function that validates email addresses using regex\"\n\n2. **Provide Context**: Include relevant information about your project, tech stack, and constraints\n\n3. **Use Examples**: Show the AI what you want with concrete examples\n\n4. **Iterate**: Refine your prompts based on the results you get\n\n## Exercise\nTry this prompt: \"Create a TypeScript interface for a user profile with validation rules and explain each field.\"\n\nNotice how specific requirements lead to better results!"
              },
              {
                id: "eng_l2",
                title: "Basic Code Generation Prompts",
                type: "reading",
                durationMin: 20,
                level: "beginner",
                content: "# Basic Code Generation Prompts\n\n## The CLEAR Framework\n\nUse this framework for effective code generation:\n\n**C**ontext - What's the situation?\n**L**anguage - What programming language/framework?\n**E**xample - Show desired input/output\n**A**ssumptions - State your constraints\n**R**equirements - List specific needs\n\n## Effective Prompt Patterns\n\n### 1. The Specification Pattern\n```\nCreate a [language] [component type] that:\n- [requirement 1]\n- [requirement 2]\n- [requirement 3]\n\nInclude error handling and comments.\n```\n\n**Example:**\n```\nCreate a Python class that:\n- Manages database connections\n- Implements connection pooling\n- Handles connection timeouts\n- Provides retry logic for failed connections\n\nInclude error handling and detailed comments.\n```\n\n### 2. The Example-Driven Pattern\n```\nWrite a [language] function that takes [input] and returns [output].\n\nExample usage:\nInput: [example input]\nOutput: [example output]\n\nRequirements: [specific requirements]\n```\n\n**Example:**\n```\nWrite a JavaScript function that converts camelCase strings to snake_case.\n\nExample usage:\nInput: \"getUserProfile\"\nOutput: \"get_user_profile\"\n\nRequirements: Handle edge cases like empty strings and single characters.\n```\n\n### 3. The Incremental Pattern\n```\n1. First, create a basic [component] that [basic functionality]\n2. Then, add [feature 1]\n3. Finally, implement [feature 2]\n\nShow each step separately.\n```\n\n## Common Mistakes to Avoid\n\n❌ **Vague requests:** \"Make this better\"\n✅ **Specific requests:** \"Optimize this function for better performance by reducing time complexity\"\n\n❌ **No context:** \"Write a login function\"\n✅ **With context:** \"Write a Node.js login function using JWT tokens for a REST API\"\n\n❌ **Too broad:** \"Build an app\"\n✅ **Focused:** \"Create a React component for user authentication with form validation\"\n\n## Practice Exercise\n\nTry creating a prompt for a function that:\n- Validates API responses\n- Handles different error types\n- Returns structured error information\n\nUse the CLEAR framework!"
              },
              {
                id: "eng_l3",
                title: "Debugging with AI Prompts",
                type: "reading",
                durationMin: 25,
                level: "beginner",
                content: "# Debugging with AI Prompts\n\n## The Debug Process with AI\n\nEffective AI-assisted debugging follows these steps:\n\n1. **Describe the Problem** - What's not working?\n2. **Provide Context** - Share relevant code and error messages\n3. **Specify Environment** - Include version info, dependencies\n4. **Ask Targeted Questions** - Be specific about what you need\n\n## Debugging Prompt Templates\n\n### 1. Error Analysis Template\n```\nI'm getting this error in [language/framework]:\n\nError message: [exact error]\n\nRelevant code:\n```[language]\n[your code]\n```\n\nEnvironment:\n- [language] version: [version]\n- [framework] version: [version]\n- Operating system: [OS]\n\nWhat's causing this error and how do I fix it?\n```\n\n### 2. Performance Issue Template\n```\nMy [component/function] is running slowly:\n\nCode:\n```[language]\n[your code]\n```\n\nCurrent performance: [describe current behavior]\nExpected performance: [describe desired behavior]\n\nInput size: [typical input size]\nEnvironment: [relevant environment details]\n\nHow can I optimize this for better performance?\n```\n\n### 3. Logic Bug Template\n```\nThis [function/component] isn't producing the expected output:\n\nCode:\n```[language]\n[your code]\n```\n\nTest case:\nInput: [test input]\nExpected output: [what should happen]\nActual output: [what actually happens]\n\nWalk through the logic and identify the issue.\n```\n\n## Advanced Debugging Techniques\n\n### Step-by-Step Analysis\n```\nAnalyze this code step by step and identify potential issues:\n\n```[language]\n[your code]\n```\n\nFor each line, explain:\n1. What it's supposed to do\n2. What could go wrong\n3. Suggestions for improvement\n```\n\n### Code Review Style\n```\nReview this code for bugs and improvements:\n\n```[language]\n[your code]\n```\n\nFocus on:\n- Logic errors\n- Edge cases\n- Performance issues\n- Security vulnerabilities\n- Code style and best practices\n```\n\n## Real-World Example\n\nLet's debug a common issue:\n\n**Problem:** JavaScript async function not working\n\n**Effective Prompt:**\n```\nI have an async JavaScript function that's not working correctly:\n\n```javascript\nasync function fetchUserData(userId) {\n  const response = fetch(`/api/users/${userId}`);\n  const userData = response.json();\n  return userData;\n}\n```\n\nWhen I call it, I get [object Promise] instead of user data.\n\nEnvironment: Node.js 18, using fetch API\n\nWhat's wrong with this async function and how do I fix it?\n```\n\n**Why this prompt works:**\n- Specific problem description\n- Complete code example\n- Expected vs actual behavior\n- Environment context\n- Clear question\n\n## Practice Exercise\n\nCreate a debugging prompt for a situation where:\n- A loop is running indefinitely\n- You suspect it's related to the loop condition\n- You want to understand why and how to fix it\n\nInclude all necessary context!"
              },
              {
                id: "eng_l4",
                title: "Testing and Validation Prompts",
                type: "quiz",
                durationMin: 20,
                level: "beginner",
                content: "# Testing and Validation Prompts\n\n## Interactive Quiz: Testing Strategies\n\nTest your understanding of AI-assisted testing approaches."
              },
              {
                id: "eng_l5",
                title: "Hands-on: Code Generation Practice",
                type: "sandbox",
                durationMin: 30,
                level: "beginner",
                content: "# Practical Exercise: Generate a REST API\n\nIn this hands-on exercise, you'll use AI to generate a complete REST API for a todo application.\n\n## Your Task\n\nCreate prompts to generate:\n1. Express.js server setup\n2. CRUD endpoints for todos\n3. Input validation middleware\n4. Error handling\n5. Basic tests\n\n## Starter Prompt\nTry starting with: \"Create a Node.js Express API for a todo application with full CRUD operations, input validation, and proper error handling.\""
              }
            ]
          },
          {
            id: "eng_m2",
            title: "Advanced Development Patterns",
            description: "Master complex AI-assisted development workflows",
            estimatedHours: 6,
            lessons: [
              {
                id: "eng_l6",
                title: "Architecture Design with AI",
                type: "reading",
                durationMin: 35,
                level: "intermediate",
                content: "# Architecture Design with AI\n\n## System Design Prompting\n\nLearn to use AI for complex architectural decisions and system design."
              },
              {
                id: "eng_l7",
                title: "Code Review and Refactoring",
                type: "reading",
                durationMin: 30,
                level: "intermediate",
                content: "# AI-Powered Code Review\n\n## Advanced Refactoring Techniques\n\nMaster the art of using AI for code quality improvement."
              },
              {
                id: "eng_l8",
                title: "Performance Optimization",
                type: "video",
                durationMin: 25,
                level: "intermediate",
                videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
                content: "Learn advanced performance optimization techniques using AI assistance."
              },
              {
                id: "eng_l9",
                title: "Production Deployment",
                type: "sandbox",
                durationMin: 40,
                level: "advanced",
                content: "# Production Deployment Exercise\n\nBuild a complete CI/CD pipeline with AI assistance."
              }
            ]
          },
          {
            id: "eng_m3",
            title: "AI in Production Systems",
            description: "Deploy and maintain AI-powered applications at scale",
            estimatedHours: 8,
            lessons: [
              {
                id: "eng_l10",
                title: "Monitoring and Observability",
                type: "reading",
                durationMin: 30,
                level: "advanced",
                content: "# AI-Enhanced Monitoring\n\n## Building Observability into AI Systems\n\nLearn to monitor AI-powered applications effectively."
              },
              {
                id: "eng_l11",
                title: "Scaling AI Applications",
                type: "reading",
                durationMin: 35,
                level: "advanced",
                content: "# Scaling Strategies\n\n## Performance at Scale\n\nMaster techniques for scaling AI applications."
              },
              {
                id: "eng_l12",
                title: "Security Best Practices",
                type: "reading",
                durationMin: 25,
                level: "advanced",
                content: "# AI Security\n\n## Securing AI-Powered Systems\n\nEssential security practices for AI applications."
              },
              {
                id: "eng_l13",
                title: "Final Project: Production System",
                type: "sandbox",
                durationMin: 60,
                level: "advanced",
                content: "# Capstone Project\n\nBuild a complete production-ready AI-powered application."
              }
            ]
          }
        ]
      },
      // Management Track
      {
        id: "mgr_track",
        title: "AI Leadership & Strategy",
        description: "Lead AI transformation and manage AI-powered teams effectively",
        role: "manager",
        level: "intermediate",
        estimatedHours: 18,
        certificateAvailable: true,
        modules: [
          {
            id: "mgr_m1",
            title: "AI Strategy Fundamentals",
            description: "Understand AI's business impact and strategic implementation",
            estimatedHours: 6,
            lessons: [
              {
                id: "mgr_l1",
                title: "AI Business Impact Analysis",
                type: "reading",
                durationMin: 25,
                level: "beginner",
                content: "# AI in Business Context\n\n## Understanding AI's Transformative Power\n\nLearn how AI reshapes business operations and competitive advantages."
              },
              {
                id: "mgr_l2",
                title: "Building AI-Ready Teams",
                type: "video",
                durationMin: 30,
                level: "intermediate",
                videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
                content: "Master the art of hiring and developing AI-capable teams."
              },
              {
                id: "mgr_l3",
                title: "ROI Measurement for AI Projects",
                type: "reading",
                durationMin: 20,
                level: "intermediate",
                content: "# Measuring AI Success\n\n## KPIs and Metrics for AI Initiatives\n\nLearn to quantify AI impact and justify investments."
              }
            ]
          },
          {
            id: "mgr_m2",
            title: "Change Management",
            description: "Navigate organizational transformation with AI adoption",
            estimatedHours: 5,
            lessons: [
              {
                id: "mgr_l4",
                title: "Overcoming AI Resistance",
                type: "reading",
                durationMin: 25,
                level: "intermediate",
                content: "# Change Management\n\n## Leading Through AI Transformation\n\nStrategies for managing organizational change."
              },
              {
                id: "mgr_l5",
                title: "Training and Development",
                type: "sandbox",
                durationMin: 30,
                level: "intermediate",
                content: "# Team Development Exercise\n\nCreate a comprehensive AI training program for your team."
              }
            ]
          }
        ]
      },
      // Designer Track
      {
        id: "design_track",
        title: "AI-Powered Design Excellence",
        description: "Transform design workflows with AI tools and methodologies",
        role: "designer",
        level: "beginner",
        estimatedHours: 16,
        certificateAvailable: true,
        modules: [
          {
            id: "design_m1",
            title: "AI Design Fundamentals",
            description: "Introduction to AI tools for designers",
            estimatedHours: 6,
            lessons: [
              {
                id: "design_l1",
                title: "AI Tools for Designers",
                type: "reading",
                durationMin: 20,
                level: "beginner",
                content: "# AI Design Tools Overview\n\n## Revolutionary Design Assistance\n\nExplore the landscape of AI-powered design tools."
              },
              {
                id: "design_l2",
                title: "Prompt Engineering for Visual Content",
                type: "video",
                durationMin: 25,
                level: "beginner",
                videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
                content: "Master the art of visual prompt engineering."
              },
              {
                id: "design_l3",
                title: "AI-Assisted Prototyping",
                type: "sandbox",
                durationMin: 35,
                level: "intermediate",
                content: "# Rapid Prototyping Exercise\n\nCreate a complete app prototype using AI assistance."
              }
            ]
          },
          {
            id: "design_m2",
            title: "Advanced Design Workflows",
            description: "Integrate AI into professional design processes",
            estimatedHours: 7,
            lessons: [
              {
                id: "design_l4",
                title: "Design System Creation",
                type: "reading",
                durationMin: 30,
                level: "intermediate",
                content: "# AI-Generated Design Systems\n\n## Scalable Design with AI\n\nBuild comprehensive design systems efficiently."
              },
              {
                id: "design_l5",
                title: "User Research with AI",
                type: "reading",
                durationMin: 25,
                level: "intermediate",
                content: "# AI-Enhanced User Research\n\n## Data-Driven Design Decisions\n\nLeverage AI for better user insights."
              },
              {
                id: "design_l6",
                title: "Portfolio Project",
                type: "sandbox",
                durationMin: 50,
                level: "advanced",
                content: "# Design Portfolio Project\n\nCreate a complete design case study using AI tools."
              }
            ]
          }
        ]
      },
      // Marketing Track
      {
        id: "marketing_track",
        title: "AI Marketing Mastery",
        description: "Revolutionize your marketing with AI-powered strategies and automation",
        role: "marketer",
        level: "beginner",
        estimatedHours: 20,
        certificateAvailable: true,
        modules: [
          {
            id: "marketing_m1",
            title: "AI Marketing Foundations",
            description: "Essential AI concepts for modern marketers",
            estimatedHours: 7,
            lessons: [
              {
                id: "marketing_l1",
                title: "AI Marketing Landscape",
                type: "reading",
                durationMin: 20,
                level: "beginner",
                content: "# The AI Marketing Revolution\n\n## Transforming Customer Engagement\n\nUnderstand how AI is reshaping marketing."
              },
              {
                id: "marketing_l2",
                title: "Content Generation with AI",
                type: "video",
                durationMin: 25,
                level: "beginner",
                videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
                content: "Master AI-powered content creation techniques."
              },
              {
                id: "marketing_l3",
                title: "Personalization at Scale",
                type: "reading",
                durationMin: 30,
                level: "intermediate",
                content: "# AI-Driven Personalization\n\n## Creating Unique Customer Experiences\n\nImplement personalization strategies with AI."
              },
              {
                id: "marketing_l4",
                title: "Campaign Creation Exercise",
                type: "sandbox",
                durationMin: 35,
                level: "intermediate",
                content: "# Multi-Channel Campaign Project\n\nDesign a complete marketing campaign using AI tools."
              }
            ]
          },
          {
            id: "marketing_m2",
            title: "Advanced Marketing AI",
            description: "Sophisticated AI applications for marketing professionals",
            estimatedHours: 8,
            lessons: [
              {
                id: "marketing_l5",
                title: "Predictive Analytics",
                type: "reading",
                durationMin: 30,
                level: "advanced",
                content: "# Predictive Marketing\n\n## Forecasting Customer Behavior\n\nUse AI for predictive marketing insights."
              },
              {
                id: "marketing_l6",
                title: "Marketing Automation",
                type: "video",
                durationMin: 25,
                level: "advanced",
                videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
                content: "Advanced marketing automation with AI."
              },
              {
                id: "marketing_l7",
                title: "ROI Optimization",
                type: "reading",
                durationMin: 20,
                level: "advanced",
                content: "# Marketing ROI with AI\n\n## Data-Driven Optimization\n\nMaximize marketing ROI using AI insights."
              }
            ]
          }
        ]
      },
      // Researcher Track
      {
        id: "researcher_track",
        title: "AI Research Methodology",
        description: "Advanced AI research techniques and methodologies",
        role: "researcher",
        level: "advanced",
        estimatedHours: 25,
        certificateAvailable: true,
        modules: [
          {
            id: "research_m1",
            title: "AI Research Fundamentals",
            description: "Core principles of AI research and development",
            estimatedHours: 10,
            lessons: [
              {
                id: "research_l1",
                title: "Research Methodology",
                type: "reading",
                durationMin: 40,
                level: "advanced",
                content: "# AI Research Methods\n\n## Scientific Approach to AI\n\nMaster rigorous AI research methodologies."
              },
              {
                id: "research_l2",
                title: "Literature Review with AI",
                type: "reading",
                durationMin: 35,
                level: "advanced",
                content: "# AI-Assisted Research\n\n## Accelerating Discovery\n\nUse AI to enhance research processes."
              },
              {
                id: "research_l3",
                title: "Experimental Design",
                type: "sandbox",
                durationMin: 45,
                level: "advanced",
                content: "# Research Design Exercise\n\nPlan and execute an AI research experiment."
              }
            ]
          }
        ]
      }
    ],
    libraryAcademy: academyResources,
    libraryByUser: [],
    discussions: [
      {
        id: "d_getting_started",
        title: "Best practices for prompt engineering in production environments",
        authorId: "u_admin",
        category: "Engineering",
        tags: ["Production", "Best Practices", "Engineering"],
        views: 0,
        replies: 0,
        isPinned: true,
        createdAt: now,
        lastActivityAt: now,
      },
    ],
    discussionReplies: [],
    challenges,
    challengeEntries: [],
    challengeEntryLikes: [],
    challengeEntrySaves: [],
    otps: [],
    notifications: [],
    userLearning: [],
    userProfiles: [],
    notificationSettings: [],
    securitySettings: [],
    billingSettings: [],
    userPreferences: [],
  };
}

export function readDB(): DB {
  ensureDataDir();
  
  // If we're in serverless mode or memory DB exists, use memory
  if (isServerless || memoryDB) {
    if (!memoryDB) {
      console.log('Initializing memory database for serverless environment');
      memoryDB = initDB();
      const admin = memoryDB.users[0];
      admin.passwordHash = hashPassword("admin", admin.salt);
    }
    return JSON.parse(JSON.stringify(memoryDB)); // Deep copy to avoid mutations
  }
  
  try {
    if (!fs.existsSync(DB_FILE)) {
      const db = initDB();
      const admin = db.users[0];
      admin.passwordHash = hashPassword("admin", admin.salt);
      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
      } catch (writeError) {
        console.warn('Cannot write to file system, switching to memory mode:', writeError);
        isServerless = true;
        memoryDB = db;
        return JSON.parse(JSON.stringify(db));
      }
      return db;
    }
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    const data = JSON.parse(raw) as Partial<DB>;
    
    // Backfill new fields/arrays for older DB files
    const db: DB = {
      users: (data.users || []).map((u: any) => ({ ...u, isVerified: typeof u.isVerified === "boolean" ? u.isVerified : true })),
      prompts: data.prompts || [],
      promptComments: data.promptComments || [],
      promptLikes: data.promptLikes || [],
      promptSaves: data.promptSaves || [],
      certificates: data.certificates || [],
      tracks: data.tracks || [],
      libraryAcademy: data.libraryAcademy || [],
      libraryByUser: data.libraryByUser || [],
      discussions: data.discussions || [],
      discussionReplies: data.discussionReplies || [],
      challenges: data.challenges || [],
      challengeEntries: data.challengeEntries || [],
      challengeEntryLikes: (data as any).challengeEntryLikes || [],
      challengeEntrySaves: (data as any).challengeEntrySaves || [],
      otps: (data as any).otps || [],
      notifications: (data as any).notifications || [],
      userLearning: (data as any).userLearning || [],
      userProfiles: (data as any).userProfiles || [],
      notificationSettings: (data as any).notificationSettings || [],
      securitySettings: (data as any).securitySettings || [],
      billingSettings: (data as any).billingSettings || [],
      userPreferences: (data as any).userPreferences || [],
    } as any;

    // If using Supabase for learning content, clear local example tracks to avoid duplication
    if (process.env.SUPABASE_URL) {
      (db as any).tracks = [];
    }

    // Seed or backfill academy library with high-quality templates and guides
    try {
    const now = new Date().toISOString();
    // Remove previously seeded external-only guides to comply with in-app guide policy
    if (Array.isArray(db.libraryAcademy) && db.libraryAcademy.length) {
      db.libraryAcademy = db.libraryAcademy.filter((r: any) => {
        if (r?.type !== "guide") return true;
        const hasContent = !!(r as any).content;
        const url: string | undefined = (r as any).url;
        const external = !!url && /^https?:\/\//i.test(url);
        const seededId = typeof r.id === "string" && r.id.startsWith("lr_guide_");
        return hasContent || !external || !seededId; // keep if has content, or not external, or not a seeded id
      });
    }

    const existingById = new Set((db.libraryAcademy || []).map((r: any) => r.id));
    const existingByTitle = new Set((db.libraryAcademy || []).map((r: any) => r.title?.toLowerCase?.() || ""));

    const seeds: LibraryResource[] = [
      // Templates (at least 20)
      { id: "lr_tmpl_bug_triage", type: "template", title: "Bug Triage and Root-Cause Analysis", tags: ["engineering", "debugging"], createdAt: now, content: "You are a senior software engineer helping triage a bug. Context:\n- Repo/App: {{repo_or_app}}\n- Feature/Area: {{area}}\n- Error logs: {{logs}}\n- Steps to reproduce: {{steps}}\n- Expected vs actual: {{expected_vs_actual}}\n- Recent changes: {{recent_changes}}\n\nTasks:\n1) Hypothesize likely root causes (ranked).\n2) Suggest targeted diagnostics to confirm/deny each hypothesis.\n3) Propose minimal diffs or patches.\n4) Flag any product risks and customer impact.\nReturn a concise action plan with owners and ETA." },
      { id: "lr_tmpl_code_review", type: "template", title: "Code Review Checklist (LLM-Assisted)", tags: ["engineering", "quality"], createdAt: now, content: "You are reviewing the following diff:\n{{diff}}\n\nChecklist:\n- Correctness: identify logical errors or edge cases.\n- Security: injections, secrets, unsafe eval, authz.\n- Performance: N+1, heavy loops, unnecessary re-renders.\n- Readability: naming, cohesion, dead code.\n- Tests: coverage gaps and suggested tests.\n- Docs: update required docs or comments.\nProvide SUMMARY, BLOCKERS, NITS, and TESTS TO ADD." },
      { id: "lr_tmpl_refactor_plan", type: "template", title: "Refactor Plan from Code Snippet", tags: ["engineering", "maintainability"], createdAt: now, content: "Given the code:\n{{code}}\n\nIdentify smells (duplication, long function, god object, tight coupling). Propose a refactor plan with steps, before/after snippet examples, risks, and test strategy." },
      { id: "lr_tmpl_unit_tests", type: "template", title: "Unit Test Generator (Jest/Vitest)", tags: ["engineering", "testing"], createdAt: now, content: "Generate table-driven unit tests for the function:\n{{function_code}}\n\nInclude:\n- Edge cases\n- Error handling\n- Property-based ideas where suitable\n- Mocks for IO\nReturn runnable tests in {{framework}} with clear descriptions." },
      { id: "lr_tmpl_pr_description", type: "template", title: "Pull Request Description Writer", tags: ["engineering", "collaboration"], createdAt: now, content: "Create a PR description using Conventional Commits.\nInputs:\n- Scope: {{scope}}\n- Summary: {{summary}}\n- Details: {{details}}\n- Screenshots/links: {{links}}\n- Risk/Impact: {{risk}}\n- Rollback plan: {{rollback}}\nOutput: well-structured PR body with checklist." },
      { id: "lr_tmpl_commit_message", type: "template", title: "Conventional Commit Message Generator", tags: ["engineering", "workflow"], createdAt: now, content: "Given changes:\n{{diff_or_summary}}\nProduce a concise Conventional Commit message: type(scope): summary. Include a longer body if needed and BREAKING CHANGE when applicable." },
      { id: "lr_tmpl_openapi", type: "template", title: "OpenAPI Contract Draft from Requirements", tags: ["engineering", "api"], createdAt: now, content: "From requirements:\n{{requirements}}\nDraft an OpenAPI 3.1 YAML with endpoints, request/response schemas, auth, examples, and error models. Validate consistency and completeness." },
      { id: "lr_tmpl_sql", type: "template", title: "SQL Query from Natural Language", tags: ["data", "sql"], createdAt: now, content: "Schema:\n{{schema}}\nQuestion:\n{{question}}\nReturn optimized SQL for {{dialect}}. Explain indexes used and potential pitfalls. Provide a safe variant with limits and a production-safe version." },
      { id: "lr_tmpl_pandas", type: "template", title: "Data Analysis (pandas) Plan + Code", tags: ["data", "analysis"], createdAt: now, content: "Dataset notes:\n{{dataset_notes}}\nGoals:\n{{goals}}\nReturn: EDA plan, risks/biases, and Python code using pandas to compute KPIs, plots, and confidence intervals where relevant." },
      { id: "lr_tmpl_rag_answering", type: "template", title: "RAG Question Answering Prompt", tags: ["rag", "retrieval", "engineering"], createdAt: now, content: "You answer strictly using the provided context. If unsure, say you don't know.\nContext chunks (with sources):\n{{context}}\nUser question: {{question}}\nInstructions: cite sources, avoid fabrication, highlight uncertainties, and suggest missing docs to retrieve." },
      { id: "lr_tmpl_system_prompt", type: "template", title: "System Prompt: AI-First App Assistant", tags: ["system", "prompting"], createdAt: now, content: "Role: Senior assistant for AI-First Academy users.\nGuidelines: be concise, safe, and cite internal links. Avoid hallucinations. Ask clarifying questions sparingly.\nTone: professional, supportive, and direct.\nForbidden: leaking secrets, inventing data, unsafe code." },
      { id: "lr_tmpl_red_team", type: "template", title: "Prompt Injection Red-Teaming Checklist", tags: ["security", "red-team"], createdAt: now, content: "Evaluate model vulnerability to: system prompt leaks, tool jailbreaks, data exfiltration, role confusion, and hidden instructions in files/links. Provide payloads, expected safe behaviors, and detection heuristics." },
      { id: "lr_tmpl_prd", type: "template", title: "Product Requirements Document (PRD)", tags: ["product", "planning"], createdAt: now, content: "Write a PRD for {{feature}} including: Problem, Goals/Non-goals, Personas, User stories, UX flows, Acceptance criteria, Metrics, Risks, Rollout, and Open questions." },
      { id: "lr_tmpl_ux_copy", type: "template", title: "UX Microcopy Generator", tags: ["ux", "content"], createdAt: now, content: "Generate clear, inclusive microcopy for UI. Inputs: screen description {{screen}}, actions {{actions}}, tone {{tone}}. Provide variants, rationale, and i18n notes." },
      { id: "lr_tmpl_marketing_email", type: "template", title: "Marketing Email Sequence (Lifecycle)", tags: ["marketing", "growth"], createdAt: now, content: "Create a 5-email sequence for {{audience}} with subject lines, preview text, body, CTA, and A/B test ideas. Ensure CAN-SPAM compliance notes." },
      { id: "lr_tmpl_meeting_notes", type: "template", title: "Meeting Summary + Action Items", tags: ["operations", "product"], createdAt: now, content: "Transcript:\n{{transcript}}\nSummarize decisions, owners, deadlines, risks, and follow-ups. Provide a clean summary and task list (owner, due date, status)." },
      { id: "lr_tmpl_interview_questions", type: "template", title: "Technical Interview Question Set", tags: ["hiring", "engineering"], createdAt: now, content: "Role: {{role}}\nGenerate structured interview questions across fundamentals, practical skills, systems, and culture. Include rubrics and red flags." },
      { id: "lr_tmpl_eval_rubric", type: "template", title: "LLM Output Evaluation Rubric", tags: ["evaluation", "quality"], createdAt: now, content: "Define a rubric for task {{task}} with dimensions: correctness, completeness, harmfulness, formatting, latency, cost. Provide scoring guidelines (1-5) and examples of low/mid/high quality." },
      { id: "lr_tmpl_style_guide", type: "template", title: "Prompt Style Guide Template", tags: ["prompting", "governance"], createdAt: now, content: "Define prompt style rules for {{team}}: structure, variables, ground truth usage, citations, refusal policy, and safety disclaimers. Include do/don't examples." },
      { id: "lr_tmpl_postmortem", type: "template", title: "Incident Postmortem (AAR)", tags: ["operations", "reliability"], createdAt: now, content: "Incident: {{incident}}\nTimeline, impact, root cause, contributing factors, detection, response, what went well/poorly, corrective actions, owners, deadlines, verification plan." },
      { id: "lr_tmpl_eval_dataset", type: "template", title: "Eval Dataset Creation Prompt", tags: ["evaluation", "data"], createdAt: now, content: "Generate {{n}} evaluation items for task {{task}} with inputs, expected outputs, and rationales. Ensure coverage of edge cases and adversarial variants." },
      { id: "lr_tmpl_release_notes", type: "template", title: "Release Notes Generator", tags: ["product", "engineering"], createdAt: now, content: "Inputs: merged PRs, highlights, deprecations, migrations, known issues. Output: semantic version bump suggestion and crisp release notes with categories." },
      { id: "lr_tmpl_standup", type: "template", title: "Daily Standup Summarizer", tags: ["operations", "product"], createdAt: now, content: "Given updates from team members:\n{{updates}}\nProduce a concise summary per person, blockers, dependencies, and risks, plus a team-wide snapshot." },
      { id: "lr_tmpl_onboarding", type: "template", title: "Engineer Onboarding Checklist", tags: ["operations", "engineering"], createdAt: now, content: "Create a 30/60/90 day onboarding plan for role {{role}}. Include environment setup, key docs, mentorship plan, and first impactful tasks." },
      { id: "lr_tmpl_eval_prompt_injection", type: "template", title: "Prompt Injection Detection Patterns", tags: ["security", "safety"], createdAt: now, content: "Given user input:\n{{input}}\nDetect signs of instruction override, data exfiltration, or tool abuse. Return risk rating, matched patterns, and recommended safe response template." },
      { id: "lr_tmpl_api_spec_from_db", type: "template", title: "API Spec Derivation from Database Schema", tags: ["api", "engineering"], createdAt: now, content: "Given DB schema:\n{{schema}}\nDraft endpoints, CRUD operations, pagination, querying, and constraints. Propose authorization model and rate limits." },
      { id: "lr_tmpl_pr_template_repo", type: "template", title: "Repository PR Template Generator", tags: ["engineering", "workflow"], createdAt: now, content: "Given repo context {{repo_context}}, generate a PR template (PULL_REQUEST_TEMPLATE.md) with sections for context, changes, screenshots, tests, rollout, and checklist." },
      { id: "lr_tmpl_contract_test", type: "template", title: "API Contract Test Scenarios", tags: ["testing", "api"], createdAt: now, content: "From OpenAPI spec:\n{{openapi}}\nGenerate contract tests covering success, validation errors, auth failures, idempotency, and rate limits. Provide runnable examples in {{language}}." },
      { id: "lr_tmpl_product_brief", type: "template", title: "Product Brief Generator", tags: ["product", "strategy"], createdAt: now, content: "For initiative {{initiative}}, produce a product brief: context, opportunity, goals, competitive landscape, hypotheses, KPIs, and risks." },
      { id: "lr_tmpl_eval_judges", type: "template", title: "Pairwise Judge Prompt for Evals", tags: ["evaluation", "prompting"], createdAt: now, content: "Compare two model outputs for task {{task}} using rubric {{rubric}}. Return winner, confidence, and rationale while avoiding position bias." },
      { id: "lr_tmpl_guardrails", type: "template", title: "Guardrails Specification", tags: ["safety", "governance"], createdAt: now, content: "Define guardrails for {{use_case}}: disallowed content, refusal phrasing, PII handling, tool usage constraints, and logging requirements." },

      // Guides (first-party, in-app content)
      { id: "lr_guide_prompting_foundations", type: "guide", title: "Prompting Foundations: Goals, Roles, Constraints", tags: ["prompting", "fundamentals"], createdAt: now, description: "Core mental model for effective prompting.", content: "Overview\n- Define the task goal and desired output format.\n- Assign a clear role to the model (e.g., 'Senior JS Engineer').\n- Provide constraints: tone, length, safety limits, citations.\n\nChecklist\n1) Task: {{task}}\n2) Role: {{role}}\n3) Inputs/context: {{context}}\n4) Constraints: {{constraints}}\n5) Output format: {{format}}\n6) Validation steps: {{validation}}\n\nExamples\n- Summarization with bullet rules\n- Email with tone and CTA\n- Code review with checklists" },
      { id: "lr_guide_structuring_prompts", type: "guide", title: "Structuring Prompts for Reliability", tags: ["prompting", "structure"], createdAt: now, description: "Scaffolds that reduce ambiguity.", content: "Patterns\n- Instruction then context, then examples, then task.\n- Use headings and numbered steps.\n- Declare refusal policy and don't-invent rules.\n\nTemplate\nSYSTEM: You are {{role}}. Follow policy: {{policy}}.\nUSER: Context -> {{context}}\nEXAMPLES: {{few_shots}}\nTASK: {{task}}\nOUTPUT FORMAT: {{format}}\nQUALITY CHECK: {{checks}}" },
      { id: "lr_guide_few_shot", type: "guide", title: "Few-shot and Counter-examples", tags: ["prompting", "examples"], createdAt: now, description: "Use positive/negative shots to shape behavior.", content: "Guidelines\n- 2–5 representative examples.\n- Add counter-examples for common mistakes.\n- Keep examples short but precise.\n\nExample Set\n- Good extraction -> valid JSON\n- Bad extraction -> missing fields -> show correction" },
      { id: "lr_guide_cot_reasoning", type: "guide", title: "Reasoning: CoT, Self-Consistency, and Debate", tags: ["reasoning"], createdAt: now, description: "When and how to enable reasoning.", content: "Approaches\n- Chain-of-Thought: ask for stepwise reasoning (hidden in production).\n- Self-Consistency: sample multiple paths, pick majority.\n- Self-Debate: generate pros/cons before final.\n\nSandbox Tips\n- Toggle temperature to diversify reasoning.\n- Compare outputs, aggregate best." },
      { id: "lr_guide_structured_output", type: "guide", title: "Structured Outputs: JSON and Schemas", tags: ["engineering", "json"], createdAt: now, description: "Enforce shape with schemas.", content: "Principles\n- Always define schema and required fields.\n- Include examples.\n- Validate and re-ask on failure.\n\nSchema\n{ name: string, tags: string[], score: number }\nValidation\n- If invalid, return errors and request regeneration." },
      { id: "lr_guide_tool_use", type: "guide", title: "Tool Use and API Calls", tags: ["tools", "api"], createdAt: now, description: "Design tool interfaces for LLMs.", content: "Design\n- Small, pure functions.\n- Clear names and param types.\n- Idempotent when possible.\n\nPrompting\n- Describe tool purpose\n- Input/Output contracts\n- Safety constraints (PII, rate limits)" },
      { id: "lr_guide_rag_end_to_end", type: "guide", title: "RAG: Retrieval-Augmented Generation End-to-End", tags: ["rag", "retrieval"], createdAt: now, description: "From ingestion to answering.", content: "Pipeline\n1) Chunking strategy and metadata\n2) Embeddings and vector DB\n3) Retrieval filters and k\n4) Context assembly with source attributions\n5) Prompting to cite sources only\n\nPitfalls\n- Overlong context, stale data, leakage of internal notes." },
      { id: "lr_guide_eval_basics", type: "guide", title: "LLM Evaluation: Rubrics and Automation", tags: ["evaluation", "quality"], createdAt: now, description: "Measure correctness and helpfulness.", content: "Rubric\n- Define axes: correctness, completeness, harmfulness, formatting.\nAutomation\n- Pairwise judges, win-rate, majority vote.\n- Track latency and cost.\n\nIn-App\n- Use Sandbox scores as a proxy; refine with offline evals." },
      { id: "lr_guide_security_safety", type: "guide", title: "Security and Safety in Prompting", tags: ["security", "safety"], createdAt: now, description: "Defend against prompt injection.", content: "Threats\n- Instruction override, data exfiltration, tool abuse.\nControls\n- System policy, content filters, allowlists/denylists.\n- Never execute untrusted output.\n\nChecklist\n- Sanitize inputs, escape outputs, log tool calls." },
      { id: "lr_guide_governance", type: "guide", title: "Prompt Governance and Style Guides", tags: ["governance"], createdAt: now, description: "Standardize prompts across teams.", content: "Components\n- Style guide (tone, structure)\n- Variables registry and secret handling\n- Review and approval steps\n- Versioning and changelog\n\nArtifacts\n- PRD for prompts\n- Eval dashboards" },
      { id: "lr_guide_prod_patterns", type: "guide", title: "Production Patterns for AI Apps", tags: ["engineering", "production"], createdAt: now, description: "Retries, fallbacks, and observability.", content: "Patterns\n- Timeouts, retries with jitter\n- Fallback models and cached answers\n- Guarded tool execution\n- Structured logging and tracing\n\nKPIs\n- Quality, latency, cost, failure rate" },
      { id: "lr_guide_sandbox_workflows", type: "guide", title: "Using the Sandbox Effectively", tags: ["sandbox", "workflows"], createdAt: now, description: "Experiment-to-production workflow.", content: "Flow\n1) Draft prompt from template\n2) Add few-shots\n3) Tune temperature and tokens\n4) Record scores and notes\n5) Export to app components\n\nTips\n- Save best runs, compare diffs." },
      { id: "lr_guide_library_usage", type: "guide", title: "Leveraging the Library: Templates and Guides", tags: ["library", "product"], createdAt: now, description: "Find, preview, adapt, and share.", content: "How-To\n- Filter by type and tags\n- Preview templates and copy parts\n- Read guides in-app\n- Save your own variants\n- Keep titles and tags consistent for discoverability" },
      { id: "lr_guide_community_best_practices", type: "guide", title: "Community: Sharing and Feedback", tags: ["community"], createdAt: now, description: "Contribute high-quality prompts.", content: "Guidelines\n- Provide context and variables\n- Include eval score screenshots\n- Credit sources where applicable\n- Be constructive in reviews\n\nModeration\n- Report harmful content, follow CoC" },
      { id: "lr_guide_certificates_path", type: "guide", title: "Certificates and Learning Path Strategy", tags: ["learning", "planning"], createdAt: now, description: "Plan modules toward certification.", content: "Plan\n- Choose a track and set weekly goals\n- Track progress from Dashboard\n- Use recommendations to fill gaps\n\nExam Tips\n- Practice with timed prompts\n- Review mistakes with rubrics" },
      { id: "lr_guide_engineering_prompts", type: "guide", title: "Engineering Prompts: Debugging, Reviews, Refactors", tags: ["engineering"], createdAt: now, description: "Concrete engineering prompt patterns.", content: "Debugging\n- Provide logs, repro steps, diffs\nReviews\n- Checklist-based critique\nRefactors\n- Explain risks and add tests\n\nAnti-Patterns\n- Vague asks, missing context" },
      { id: "lr_guide_product_content", type: "guide", title: "Product and Content Prompts: PRDs, Briefs, UX Copy", tags: ["product", "ux"], createdAt: now, description: "Non-code prompting at a high bar.", content: "PRDs\n- Goals, non-goals, metrics\nBriefs\n- Hypotheses, KPIs, risks\nUX Copy\n- Tone, inclusivity, i18n notes" },
      { id: "lr_guide_marketing_prompts", type: "guide", title: "Marketing and Growth Prompts", tags: ["marketing"], createdAt: now, description: "Lifecycle emails, landing pages, SEO.", content: "Lifecycle\n- Segmentation, subject tests\nLanding\n- Above-the-fold clarity\nSEO\n- FAQ and schema ideas" },
      { id: "lr_guide_ops_prompts", type: "guide", title: "Operations: Meetings, Postmortems, Onboarding", tags: ["operations"], createdAt: now, description: "Run teams with AI support.", content: "Meetings\n- Summaries and action items\nPostmortems\n- 5 whys, corrective actions\nOnboarding\n- 30/60/90 plans" },
      { id: "lr_guide_eval_playbook", type: "guide", title: "Evaluation Playbook: From Sandbox to CI", tags: ["evaluation"], createdAt: now, description: "Operationalize evals.", content: "Steps\n1) Define tasks and metrics\n2) Create seed datasets\n3) Pairwise judge prompts\n4) Automate in CI\n5) Monitor regression board" },
      { id: "lr_guide_safety_playbook", type: "guide", title: "Safety Playbook: Guardrails and Refusals", tags: ["safety"], createdAt: now, description: "Bake safety into prompts.", content: "Guardrails\n- Disallowed content list\n- Refusal phrasing\n- PII handling\n\nTesting\n- Red-team scenarios and expected safe outputs" },
      { id: "lr_guide_checklists", type: "guide", title: "Prompting Checklists and Anti-Patterns", tags: ["prompting", "quality"], createdAt: now, description: "Quick reference.", content: "Do\n- Define role, context, constraints\n- Provide examples\n- Specify output formats\nDon't\n- Be vague\n- Omit edge cases\n- Forget validation" },
      { id: "lr_guide_troubleshooting", type: "guide", title: "Troubleshooting: Hallucinations, Drift, and Latency", tags: ["engineering", "operations"], createdAt: now, description: "Diagnose and fix common failures.", content: "Symptoms\n- Fabrications, inconsistencies, slow responses\nFixes\n- Add sources, tighten constraints\n- Reduce temperature\n- Cache frequent outputs\n- Add timeouts and retries" },
      { id: "lr_guide_comprehensive_handbook", type: "guide", title: "The AI-First Prompting Handbook", tags: ["handbook"], createdAt: now, description: "End-to-end guide tying all sections together.", content: "Contents\n1) Foundations\n2) Structure\n3) Examples\n4) Reasoning\n5) Structured outputs\n6) Tool use\n7) RAG\n8) Evaluation\n9) Safety\n10) Production\n11) Workflows in app\n12) Checklists\nEach section includes patterns, examples, and pitfalls." },
    ];

      const toAdd = seeds.filter((r) => !existingById.has(r.id) && !existingByTitle.has((r as any).title?.toLowerCase?.() || ""));
      if (toAdd.length) {
        db.libraryAcademy = [...(db.libraryAcademy || []), ...toAdd];
        // Persist backfill immediately so subsequent reads are fast
        writeDB(db);
      }
    } catch {}

    return db;
  } catch (error) {
    console.warn('Error reading from file system, using memory fallback:', error);
    isServerless = true;
    if (!memoryDB) {
      memoryDB = initDB();
      const admin = memoryDB.users[0];
      admin.passwordHash = hashPassword("admin", admin.salt);
    }
    return JSON.parse(JSON.stringify(memoryDB));
  }
}

export function writeDB(db: DB) {
  if (isServerless) {
    // In serverless mode, just update memory
    memoryDB = JSON.parse(JSON.stringify(db)); // Deep copy
    return;
  }
  
  try {
    ensureDataDir();
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (error) {
    console.warn('Cannot write to file system, switching to memory mode:', error);
    isServerless = true;
    memoryDB = JSON.parse(JSON.stringify(db));
  }
}

export function hashPassword(password: string, salt: string) {
  return crypto.createHash("sha256").update(salt + password).digest("hex");
}

export function createId(prefix: string) {
  return `${prefix}_${crypto.randomBytes(10).toString("hex")}`;
}

export function createOtpCode() {
  const n = crypto.randomInt(0, 1_000_000);
  return n.toString().padStart(6, "0");
}
