import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import SandboxPlayground from "./SandboxPlayground";
import {
  Home,
  BookOpen,
  Code,
  Library,
  Users,
  Award,
  Settings,
  Play,
  Copy,
  Save,
  Share,
  RotateCcw,
  Zap,
  Clock,
  DollarSign,
  Target,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  Star,
  History,
  Bookmark
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import React, {useMemo } from "react";
import { Link } from "react-router-dom";
import LoggedInHeader from "@/components/LoggedInHeader";
import { useState, useEffect } from "react";
import { apiSandboxRun } from "@/lib/api";
import { sandboxApi } from "@/lib/sandboxApi";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/context/AuthContext";

const sidebarItems = [
  { icon: Home, label: "Dashboard", href: "/dashboard" },
  { icon: BookOpen, label: "Learning Path", href: "/learning" },
  { icon: Code, label: "Sandbox", href: "/sandbox", active: true },
  { icon: Library, label: "Library", href: "/library" },
  { icon: Users, label: "Community", href: "/community" },
  { icon: Award, label: "Certificates", href: "/certificates" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

const promptTemplates = [
  {
    id: "code-review",
    title: "Code Review",
    description: "Review code for best practices and improvements",
    prompt: "Please review the following {{language}} code for:\n1. Best practices\n2. Performance optimizations\n3. Security concerns\n4. Readability improvements\n\nCode:\n{{code}}\n\nProvide specific suggestions with examples.",
    variables: ["language", "code"],
    category: "Coding", 
  },
  {
    id: "bug-fix",
    title: "Bug Analysis",
    description: "Analyze and suggest fixes for bugs",
    prompt: "I have a bug in my {{language}} code. Here's the error message:\n{{error}}\n\nHere's the relevant code:\n{{code}}\n\nPlease:\n1. Explain what's causing the bug\n2. Provide a fix with explanation\n3. Suggest how to prevent similar issues",
    variables: ["language", "error", "code"],
    category: "Debugging",
  },
  {
    id: "test-generation",
    title: "Test Generation",
    description: "Generate unit tests for your code",
    prompt: "Generate comprehensive unit tests for the following {{language}} function:\n\n{{code}}\n\nInclude:\n- Happy path tests\n- Edge cases\n- Error conditions\n- Use {{testing_framework}} framework",
    variables: ["language", "code", "testing_framework"],
     category: "Testing",
  },
];

  const categories = ["All", "Text Processing", "Social Media", "Marketing", "Education"];

const modelOptions = [
  { id: "gpt-4", name: "GPT-4", cost: "$0.03/1K tokens", speed: "Moderate" },
  { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", cost: "$0.002/1K tokens", speed: "Fast" },
  { id: "claude-3", name: "Claude 3 Sonnet", cost: "$0.015/1K tokens", speed: "Moderate" },
  { id: "llama-2", name: "Llama 2 70B", cost: "$0.001/1K tokens", speed: "Fast" },
];

interface PromptExecution {
  id: string;
  timestamp: Date;
  model: string;
  prompt: string;
  optimizedPrompt: string;
  response: string;
  tokens: number;
  cost: number;
  score: number;
  feedback: {
    clarity: number;
    context: number;
    constraints: number;
    effectiveness: number;
    suggestions: string[];
  };
}

interface AIResponse {
  id: string;
  prompt: string;
  content: string;
  tokens?: { total: number };
  cost?: number;
  timings?: {
    start: number;
    end: number;
  };
  feedback?: {
    score?: number;
    clarity?: number;
    constraints?: number;
    specificity?: number;
    notes?: string;
  };
}

/* const sampleExecutions: PromptExecution[] = [
  {
    id: "exec-1",
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    model: "GPT-4",
    prompt: "Review this React component for best practices:\n\nfunction UserCard({ user }) {\n  return (\n    <div className=\"user-card\">\n      <img src={user.avatar} />\n      <h3>{user.name}</h3>\n      <p>{user.email}</p>\n    </div>\n  );\n}",
    response: "Here's my review of your React component:\n\n**Issues Found:**\n1. Missing alt text for accessibility\n2. No prop validation\n3. No error handling for missing user data\n\n**Improved Version:**\n```jsx\nfunction UserCard({ user }) {\n  if (!user) return null;\n  \n  return (\n    <div className=\"user-card\">\n      <img \n        src={user.avatar} \n        alt={`Avatar for ${user.name || 'user'}`}\n        onError={(e) => {\n          e.target.src = '/default-avatar.png';\n        }}\n      />\n      <h3>{user.name || 'Anonymous'}</h3>\n      <p>{user.email || 'No email provided'}</p>\n    </div>\n  );\n}\n```",
    tokens: 245,
    cost: 0.0074,
    score: 87,
    feedback: {
      clarity: 90,
      context: 85,
      constraints: 80,
      effectiveness: 92,
      suggestions: [
        "Great job including specific code examples",
        "Consider adding component structure requirements",
        "Could specify React version or framework"
      ]
    }
  },
]; */

export default function Sandbox() {
  const { user, loading: authLoading } = useAuth();
  const [bootLoading, setBootLoading] = useState(true);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        window.location.replace("/login");
      }
    }
  }, [user, authLoading]);
  
  useEffect(() => { const t = setTimeout(() => setBootLoading(false), 700); return () => clearTimeout(t); }, []);
  const [systemMessage, setSystemMessage] = useState("You are a helpful AI assistant specialized in software development. Provide clear, practical advice with code examples when relevant.");
  const [userPrompt, setUserPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState("gpt-4");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1000);
  const [isLoading, setIsLoading] = useState(false);
  const [currentExecution, setCurrentExecution] = useState<PromptExecution | null>(null);
  const [executions, setExecutions] = useState<PromptExecution[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<typeof promptTemplates[0] | null>(null);
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [remainingRuns, setRemainingRuns] = useState<number | string>(100);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  // Enhanced multi-model states
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedModels, setSelectedModels] = useState<string[]>(["gpt-4"]);
  const [comparisonResults, setComparisonResults] = useState<any[]>([]);
  const [totalCost, setTotalCost] = useState(0);
  const [promptOptimizationScore, setPromptOptimizationScore] = useState(0);

  // Load prompt from community if available
  useEffect(() => {
    const savedPrompt = sessionStorage.getItem('sandboxPrompt');
    if (savedPrompt) {
      setUserPrompt(savedPrompt);
      sessionStorage.removeItem('sandboxPrompt'); // Clean up after loading

      // Show a notification that the prompt was loaded
      setTimeout(() => {
        alert("Prompt loaded from community! You can modify it and run to see results.");
      }, 500);
    }
  }, []);

  // Load available AI models
  useEffect(() => {
    const loadModels = async () => {
      try {
        const { models } = await sandboxApi.getModels();
        setAvailableModels(models);
        if (models.length > 0 && !selectedModels.includes(models[0].id)) {
          setSelectedModels([models[0].id]);
          setSelectedModel(models[0].id);
        }
      } catch (error) {
        console.error('Failed to load models:', error);
        // Fallback to default models
        setAvailableModels(modelOptions);
      }
    };
    loadModels();
  }, []);

  useEffect(() => {
  const fetchRemainingRuns = async () => {
    try {
      const res = await fetch("/api/sandbox/remaining-runs"); // backend endpoint
      const data = await res.json();
      setRemainingRuns(data.remainingRuns); // now frontend matches backend
    } catch (err) {
      console.error("Failed to fetch remaining runs:", err);
    }
  };

  fetchRemainingRuns();
}, []);

const filteredTemplates = useMemo(() => {
  let list = promptTemplates;

  // Filter by category
  if (categoryFilter !== "all") {
    list = list.filter((t) => t.category === categoryFilter);
  }

  // Filter by search query
  if (query.trim()) {
    const q = query.toLowerCase();
    list = list.filter((t) => t.title.toLowerCase().includes(q));
  }

  // Sort
  list = list.sort((a, b) =>
    sort === "newest"
      ? b.id.localeCompare(a.id)  // using id as createdAt placeholder
      : a.title.localeCompare(b.title)
  );

  return list;
}, [promptTemplates, categoryFilter, query, sort]);


  const handleRunPrompt = async () => {
  if (!userPrompt.trim()) {
    alert("Please enter a prompt before running");
    return;
  }

  setIsLoading(true);

  try {
    if (compareMode && selectedModels.length > 1) {
      // ----------------- 🧠 Multi-model comparison -----------------
      const comparisonResult = await sandboxApi.comparePrompt({
        prompt: userPrompt.trim(),
        models: selectedModels,
      });

      setComparisonResults(comparisonResult.responses);
      setTotalCost(comparisonResult.comparison?.totalCost || 0);

      // Calculate prompt optimization score
      const avgScore =
        comparisonResult.responses.reduce(
          (sum, r) => sum + (r.feedback?.score || 75),
          0
        ) / comparisonResult.responses.length;
      setPromptOptimizationScore(Math.round(avgScore));

    } else {
      // ----------------- 1️⃣ Run the prompt normally -----------------
      const res: AIResponse = await apiSandboxRun({
        prompt: userPrompt,
        temperature,
        maxTokens,
        system: systemMessage,
      });
      console.log("Sandbox API response:", res);

      // ----------------- 2️⃣ Evaluate the prompt quality -----------------
      let evalData: any = {};
      try {
        const evalRes = await fetch("/api/sandbox/evaluate-prompt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: userPrompt }),
        });

        // ✅ Parse response directly as JSON
        evalData = await evalRes.json();
        console.log("EvalData from backend:", evalData); // debug

        // 🧩 STEP 5 — Check if user exceeded plan limit
        if (evalData.upgradePrompt) {
          alert(
            "You have reached your monthly prompt limit! Please upgrade to Pro or Enterprise to continue."
          );
          setRemainingRuns(evalData.remainingRuns ?? 0);
          setIsLoading(false);
          return;
        }

        // Update remaining runs from backend first
        setRemainingRuns(evalData.remainingRuns ?? 0);

      } catch (err) {
        console.error("Prompt evaluation failed:", err);
        // fallback: keep current remainingRuns
        setRemainingRuns(remainingRuns ?? 0);
      }

      // ----------------- 3️⃣ Merge evaluation into execution -----------------
      const newExecution: PromptExecution = {
        id: res.id || "unknown-id",
        timestamp: res?.timings?.end ? new Date(res.timings.end) : new Date(),
        model: selectedModel,
        prompt: userPrompt,
        optimizedPrompt: evalData.optimizedPrompt || userPrompt,
        response: evalData.optimizedPrompt || userPrompt,
        tokens: res.tokens?.total || 0,
        cost: res.cost || 0,
        score: evalData.score ?? res.feedback?.score ?? 0,
        feedback: {
          clarity: evalData.categories?.clarity ?? 0,
          context: evalData.categories?.context ?? 0,
          constraints: evalData.categories?.constraints ?? 0,
          effectiveness:
            evalData.categories?.effectiveness ??
            Math.round(
              ((evalData.categories?.clarity ?? 0) +
                (evalData.categories?.context ?? 0)) / 2
            ),
          suggestions:
            Array.isArray(evalData.suggestions) && evalData.suggestions.length > 0
              ? Array.from(
                  new Set(
                    evalData.suggestions.map((s: string) => s.trim()).filter(Boolean)
                  )
                )
              : ["No suggestions returned"],
        },
      };

      // ----------------- 4️⃣ Update UI -----------------
      setCurrentExecution(newExecution);
      setExecutions((prev) => [newExecution, ...prev]);
      setTotalCost(res.cost || 0);
      setPromptOptimizationScore(newExecution.score);
    }

  } catch (err: any) {
    console.error(err);
    alert(err.message || "Run failed");
  } finally {
    setIsLoading(false);
  }
};

  const handleTemplateSelect = (template: typeof promptTemplates[0]) => {
    setSelectedTemplate(template);
    setUserPrompt(template.prompt);
    const vars: Record<string, string> = {};
    template.variables.forEach(variable => {
      vars[variable] = "";
    });
    setTemplateVariables(vars);
  };

  const applyTemplateVariables = () => {
    if (!selectedTemplate) return;

    // Check if all required variables are filled
    const missingVariables = selectedTemplate.variables.filter(
      variable => !templateVariables[variable] || templateVariables[variable].trim() === ""
    );

    if (missingVariables.length > 0) {
      alert(`Please fill in all variables: ${missingVariables.join(', ')}`);
      return;
    }

    let finalPrompt = selectedTemplate.prompt;
    Object.entries(templateVariables).forEach(([key, value]) => {
      finalPrompt = finalPrompt.replace(new RegExp(`{{${key}}}`, 'g'), value.trim());
    });
    setUserPrompt(finalPrompt);

    // Auto-scroll to prompt area after applying template
    setTimeout(() => {
      const promptTextarea = document.querySelector('textarea[placeholder*="Enter your prompt"]') as HTMLTextAreaElement;
      if (promptTextarea) {
        promptTextarea.focus();
        promptTextarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  if (bootLoading) {
    return (
      <div className="min-h-screen bg-background">
        <LoggedInHeader />
        <div className="h-[calc(100vh-4rem)] flex overflow-hidden">
          <Sidebar />
         {/* <SandboxPlayground lessonId={lessonId}/> */}
         <main className="flex-1 flex overflow-y-auto">
            <div className="flex-1 flex flex-col">
              <div className="border-b border-border/40 p-4">
                <div className="flex items-center justify-between mb-4">
                  <Skeleton className="h-7 w-48" />
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-9 w-20" />
                    <Skeleton className="h-9 w-20" />
                    <Skeleton className="h-9 w-20" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
                <Skeleton className="h-40 w-full" />
              </div>
            </div>
            <aside className="w-[380px] border-l border-border/40 p-4 space-y-3 hidden lg:block">
              <Skeleton className="h-6 w-40" />
              {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-3 space-y-2">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-48" />
                  </CardContent>
                </Card>
              ))}
            </aside>
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
        <Sidebar />
        {/* <SandboxPlayground lessonId={lessonId}/> */}  
      </div>
    </div>
  );
}

