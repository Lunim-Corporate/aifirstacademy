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
import { Link } from "react-router-dom";
import LoggedInHeader from "@/components/LoggedInHeader";
import { useState, useEffect } from "react";
import { apiSandboxRun } from "@/lib/api";
import { sandboxApi } from "@/lib/sandboxApi";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

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
  },
  {
    id: "bug-fix",
    title: "Bug Analysis",
    description: "Analyze and suggest fixes for bugs",
    prompt: "I have a bug in my {{language}} code. Here's the error message:\n{{error}}\n\nHere's the relevant code:\n{{code}}\n\nPlease:\n1. Explain what's causing the bug\n2. Provide a fix with explanation\n3. Suggest how to prevent similar issues",
    variables: ["language", "error", "code"],
  },
  {
    id: "test-generation",
    title: "Test Generation",
    description: "Generate unit tests for your code",
    prompt: "Generate comprehensive unit tests for the following {{language}} function:\n\n{{code}}\n\nInclude:\n- Happy path tests\n- Edge cases\n- Error conditions\n- Use {{testing_framework}} framework",
    variables: ["language", "code", "testing_framework"],
  },
];

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

const sampleExecutions: PromptExecution[] = [
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
];

export default function Sandbox() {
  const [bootLoading, setBootLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setBootLoading(false), 700); return () => clearTimeout(t); }, []);
  const [systemMessage, setSystemMessage] = useState("You are a helpful AI assistant specialized in software development. Provide clear, practical advice with code examples when relevant.");
  const [userPrompt, setUserPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState("gpt-4");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1000);
  const [isLoading, setIsLoading] = useState(false);
  const [currentExecution, setCurrentExecution] = useState<PromptExecution | null>(null);
  const [executions, setExecutions] = useState<PromptExecution[]>(sampleExecutions);
  const [selectedTemplate, setSelectedTemplate] = useState<typeof promptTemplates[0] | null>(null);
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  
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

  const handleRunPrompt = async () => {
  if (!userPrompt.trim()) {
    alert("Please enter a prompt before running");
    return;
  }

  setIsLoading(true);
  try {
    if (compareMode && selectedModels.length > 1) {
      // Multi-model comparison
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

        const text = await evalRes.text();
        try {
          evalData = JSON.parse(text);
        } catch (err) {
          console.error("Prompt evaluation not valid JSON:", text);
          evalData = {};
        }
      } catch (err) {
        console.error("Prompt evaluation failed:", err);
      }

      // ----------------- 3️⃣ Merge evaluation into execution -----------------
      const newExecution: PromptExecution = {
        id: res.id || "unknown-id",
        timestamp: res?.timings?.end
          ? new Date(res.timings.end)
          : new Date(),
        model: selectedModel,
        prompt: res.prompt || userPrompt,
        response: res.content || "No response",
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
                (evalData.categories?.context ?? 0)) /
                2
            ),
          suggestions:
            Array.isArray(evalData.suggestions) &&
            evalData.suggestions.length > 0
              ? evalData.suggestions
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
          <aside className="w-64 bg-muted/30 border-r border-border/40 h-full overflow-y-auto">
            <nav className="p-4 space-y-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-3 px-3 py-2 rounded-lg">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-28" />
                </div>
              ))}
            </nav>
          </aside>
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
        {/* Sidebar */}
        <aside className="w-64 bg-muted/30 border-r border-border/40 h-full overflow-y-auto">
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

          {/* Templates */}
          <div className="p-4 border-t border-border/40">
            <h3 className="font-semibold mb-3">Quick Templates</h3>
            <div className="space-y-2">
              {promptTemplates.map((template) => (
                <Card 
                  key={template.id} 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleTemplateSelect(template)}
                >
                  <CardContent className="p-3">
                    <h4 className="font-medium text-sm">{template.title}</h4>
                    <p className="text-xs text-muted-foreground">{template.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex overflow-y-auto">
          {/* Prompt Editor */}
          <div className="flex-1 flex flex-col">
            {/* Controls */}
            <div className="border-b border-border/40 p-4">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold">Prompt Sandbox</h1>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <History className="h-4 w-4 mr-2" />
                    History
                  </Button>
                  <Button variant="outline" size="sm">
                    <Bookmark className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button variant="outline" size="sm">
                    <Share className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>

              {/* Model Settings */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="space-y-2">
                  <Label>Model</Label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {modelOptions.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          <div>
                            <div className="font-medium">{model.name}</div>
                            <div className="text-xs text-muted-foreground">{model.cost}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Temperature: {temperature}</Label>
                  <Slider
                    value={[temperature]}
                    onValueChange={(value) => setTemperature(value[0])}
                    max={1}
                    min={0}
                    step={0.1}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Max Tokens</Label>
                  <Input
                    type="number"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(Number(e.target.value))}
                    min={1}
                    max={4000}
                  />
                </div>

                <div className="flex items-end">
                  <Button 
                    onClick={handleRunPrompt}
                    disabled={isLoading || !userPrompt.trim()}
                    className="w-full bg-gradient-to-r from-primary-600 to-brand-600 hover:from-primary-700 hover:to-brand-700"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                        Running...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Run Prompt
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Advanced Settings */}
              <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" size="sm">
                    {showAdvanced ? <ChevronUp className="h-4 w-4 mr-2" /> : <ChevronDown className="h-4 w-4 mr-2" />}
                    Advanced Settings
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4">
                  <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/30">
                    <div className="space-y-2">
                      <Label>System Message</Label>
                      <Textarea
                        value={systemMessage}
                        onChange={(e) => setSystemMessage(e.target.value)}
                        placeholder="Set the AI's role and behavior..."
                        className="min-h-[100px]"
                      />
                    </div>
                    
                    {/* Multi-model Comparison Toggle */}
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">Multi-Model Comparison</div>
                        <div className="text-sm text-muted-foreground">
                          Compare responses across different AI models
                        </div>
                      </div>
                      <Button
                        variant={compareMode ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCompareMode(!compareMode)}
                      >
                        {compareMode ? "Enabled" : "Enable"}
                      </Button>
                    </div>
                    
                    {/* Model Selection for Comparison */}
                    {compareMode && (
                      <div className="space-y-3">
                        <Label>Select Models to Compare</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {availableModels.map((model) => (
                            <div key={model.id} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`model-${model.id}`}
                                checked={selectedModels.includes(model.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedModels(prev => [...prev, model.id]);
                                  } else {
                                    setSelectedModels(prev => prev.filter(id => id !== model.id));
                                  }
                                }}
                                className="rounded border-border"
                              />
                              <label htmlFor={`model-${model.id}`} className="text-sm cursor-pointer">
                                {model.name}
                                <div className="text-xs text-muted-foreground">
                                  {model.cost || `$${model.costPer1kTokens?.input || 0}/1K tokens`}
                                </div>
                              </label>
                            </div>
                          ))}
                        </div>
                        
                        {/* Cost Estimation */}
                        {selectedModels.length > 1 && (
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <div className="text-sm">
                              <span className="font-medium">Estimated Cost:</span>
                              <span className="ml-2 text-brand-600">
                                ${(selectedModels.length * 0.015).toFixed(4)} for ~1K tokens
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {selectedModels.length} models selected • Varies by actual usage
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Prompt Optimization Score */}
                    {promptOptimizationScore > 0 && (
                      <div className="space-y-2">
                        <Label>Prompt Quality Score</Label>
                        <div className="flex items-center space-x-3">
                          <Progress value={promptOptimizationScore} className="flex-1" />
                          <Badge variant={promptOptimizationScore >= 80 ? "default" : "outline"}>
                            {promptOptimizationScore}/100
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Based on clarity, specificity, and expected effectiveness
                        </div>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* Template Variables */}
            {selectedTemplate && (
              <div className="border-b border-border/40 p-4 bg-muted/20">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Template: {selectedTemplate.title}</h3>
                  <Button size="sm" onClick={applyTemplateVariables}>
                    Apply Variables
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedTemplate.variables.map((variable) => (
                    <div key={variable} className="space-y-1">
                      <Label className="text-sm">{variable}</Label>
                      <Input
                        value={templateVariables[variable] || ""}
                        onChange={(e) => setTemplateVariables(prev => ({
                          ...prev,
                          [variable]: e.target.value
                        }))}
                        placeholder={`Enter ${variable}...`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Prompt Editor */}
            <div className="flex-1 p-4">
              <div className="space-y-2 h-full">
                <div className="flex items-center justify-between">
                  <Label>Your Prompt</Label>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Textarea
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  placeholder="Enter your prompt here... Try asking the AI to help with code, explain concepts, or solve problems."
                  className="min-h-[300px] font-mono"
                />
              </div>
            </div>
          </div>

          {/* Results Panel */}
          <div className="w-1/2 border-l border-border/40 flex flex-col">
            {(currentExecution || comparisonResults.length > 0) ? (
              <div className="flex-1 flex flex-col">
                {/* Header with stats */}
                <div className="border-b border-border/40 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold">
                      {comparisonResults.length > 1 ? "Model Comparison" : "Results"}
                    </h2>
                    <div className="flex items-center space-x-2">
                      {comparisonResults.length > 1 ? (
                        <>
                          <Badge variant="outline">
                            <Target className="h-3 w-3 mr-1" />
                            {comparisonResults.length} models
                          </Badge>
                          <Badge variant="outline">
                            <DollarSign className="h-3 w-3 mr-1" />
                            ${totalCost.toFixed(4)}
                          </Badge>
                          {promptOptimizationScore > 0 && (
                            <Badge className={`${
                              promptOptimizationScore >= 80 ? "bg-success" :
                              promptOptimizationScore >= 60 ? "bg-warning" :
                              "bg-destructive"
                            } text-white`}>
                              <Star className="h-3 w-3 mr-1" />
                              {promptOptimizationScore}/100
                            </Badge>
                          )}
                        </>
                      ) : currentExecution ? (
                        <>
                          <Badge variant="outline">
                            <Clock className="h-3 w-3 mr-1" />
                            {currentExecution.tokens} tokens
                          </Badge>
                          <Badge variant="outline">
                            <DollarSign className="h-3 w-3 mr-1" />
                            ${currentExecution.cost.toFixed(4)}
                          </Badge>
                          <Badge className={`${
                            currentExecution.score >= 80 ? "bg-success" :
                            currentExecution.score >= 60 ? "bg-warning" :
                            "bg-destructive"
                          } text-white`}>
                            <Star className="h-3 w-3 mr-1" />
                            {currentExecution.score}/100
                          </Badge>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Results Content */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {comparisonResults.length > 1 ? (
                      // Multi-model comparison view
                      <>
                        {comparisonResults.map((result, index) => (
                          <Card key={result.id || index} className="border-l-4 border-l-brand-500">
                            <CardHeader>
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-base flex items-center">
                                  <Badge variant="secondary" className="mr-2">
                                    {result.model}
                                  </Badge>
                                  {result.error ? (
                                    <Badge variant="destructive">Error</Badge>
                                  ) : (
                                    <Badge variant="outline">
                                      {result.responseTime}ms
                                    </Badge>
                                  )}
                                </CardTitle>
                                <div className="flex items-center space-x-2">
                                  {result.tokens && (
                                    <Badge variant="outline" className="px-2 py-1 text-sm">
                                      {result.tokens} tokens
                                    </Badge>
                                  )}
                                  {result.cost && (
                                    <Badge variant="outline" className="px-2 py-1 text-sm">
                                      ${result.cost.toFixed(4)}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              {result.error ? (
                                <div className="text-destructive text-sm">
                                  <AlertTriangle className="h-4 w-4 inline mr-2" />
                                  {result.error}
                                </div>
                              ) : (
                                <pre className="whitespace-pre-wrap text-sm max-h-64 overflow-y-auto">
                                  {result.content}
                                </pre>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                        
                        {/* Comparison Summary */}
                        <Card className="bg-muted/30">
                          <CardHeader>
                            <CardTitle className="text-base">Comparison Summary</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="font-medium">Best Response Time:</span>
                                <div className="text-brand-600">
                                  {Math.min(...comparisonResults.map(r => r.responseTime || 0))}ms
                                </div>
                              </div>
                              <div>
                                <span className="font-medium">Total Cost:</span>
                                <div className="text-brand-600">${totalCost.toFixed(4)}</div>
                              </div>
                              <div>
                                <span className="font-medium">Success Rate:</span>
                                <div className="text-brand-600">
                                  {Math.round((comparisonResults.filter(r => !r.error).length / comparisonResults.length) * 100)}%
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </>
                    ) : currentExecution ? (
                      // Single model view
                      <>
                        <Card>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base">AI Response</CardTitle>
                              <Badge variant="secondary">{currentExecution.model}</Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <pre className="whitespace-pre-wrap text-sm">{currentExecution.response}</pre>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">Prompt Effectiveness</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {Object.entries(currentExecution.feedback).filter(([key]) => key !== "suggestions").map(([key, value]) => {
                              const numValue = typeof value === 'number' ? value : 0;
                              return (
                                <div key={key} className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium capitalize">{key}</span>
                                    <span className="text-sm">{numValue}/100</span>
                                  </div>
                                  <div className="w-full bg-muted rounded-full h-2">
                                    <div
                                      className={`h-2 rounded-full ${
                                        numValue >= 80 ? "bg-success" :
                                        numValue >= 60 ? "bg-warning" :
                                        "bg-destructive"
                                      }`}
                                      style={{ width: `${numValue}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </CardContent>
                        </Card>

                        {currentExecution.feedback.suggestions.length > 0 && (
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-base flex items-center">
                                <Lightbulb className="h-4 w-4 mr-2" />
                                Improvement Suggestions
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ul className="space-y-2">
                                {currentExecution.feedback.suggestions.map((suggestion, index) => (
                                  <li key={index} className="flex items-start space-x-2">
                                    <CheckCircle className="h-4 w-4 text-brand-600 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm">{suggestion}</span>
                                  </li>
                                ))}
                              </ul>
                            </CardContent>
                          </Card>
                        )}
                      </>
                    ) : null}
                  </div>
                </ScrollArea>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center p-8">
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                    <Zap className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Ready to test your prompts</h3>
                    <p className="text-muted-foreground text-sm">
                      Write a prompt and click "Run Prompt" to see AI responses and get feedback
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
