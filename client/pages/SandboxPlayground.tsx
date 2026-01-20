// SandboxPlayground.tsx
import React, { useMemo, useState, useEffect } from "react";
import {
  Card, CardContent, CardHeader, CardTitle
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Play, Copy, RotateCcw, ChevronDown, ChevronUp, Zap,
  Clock, DollarSign, Target, Star, History, Bookmark,
  Share, Lightbulb, AlertTriangle, CheckCircle
} from "lucide-react";

import { apiSandboxRun } from "@/lib/api";
import { sandboxApi } from "@/lib/sandboxApi";
import { useAuth } from "@/context/AuthContext";

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
/* ❌ Header, Sidebar, Auth, Boot loading REMOVED (on purpose) */


const modelOptions = [
  { id: "GPT-4", name: "GPT-4", cost: "$0.03/1K tokens", speed: "Moderate" },
  // { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", cost: "$0.002/1K tokens", speed: "Fast" },
  // { id: "claude-3", name: "Claude 3 Sonnet", cost: "$0.015/1K tokens", speed: "Moderate" },
  // { id: "llama-2", name: "Llama 2 70B", cost: "$0.001/1K tokens", speed: "Fast" },
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
type SandboxPlaygroundProps = {
  lessonId: string;
};


export default function ({ lessonId }: SandboxPlaygroundProps) {
  // 🔥 ALL state, effects, handlers copied exactly
  // (same as in sandbox.tsx)

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

    useEffect(() => {
      setCurrentExecution(null);
      setComparisonResults([]);
      setPromptOptimizationScore(0);
    }, [lessonId]);
    
    
    useEffect(() => { const t = setTimeout(() => setBootLoading(false), 700); return () => clearTimeout(t); }, []);
    const [systemMessage, setSystemMessage] = useState("You are a helpful AI assistant specialized in software development. Provide clear, practical advice with code examples when relevant.");
    const [userPrompt, setUserPrompt] = useState("");
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
    const selectedModel = "GPT-4";
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
    {/* useEffect(() => {
      const loadModels = async () => {
        try {
          const { models } = await sandboxApi.getModels();
          setAvailableModels(models.length > 0 ? models : modelOptions);
          // Default to first available model
          if (models.length > 0) {
            if (!selectedModels.includes(models[0].id)) {
              setSelectedModels([models[0].id]);
            }
            setSelectedModel(models[0].id);
          } else if (modelOptions.length > 0) {
            setSelectedModel(modelOptions[0].id);
          }
        } catch (error) {
          console.error('Failed to load models:', error);
          // Fallback to default models
          setAvailableModels(modelOptions);
          if (modelOptions.length > 0) {
            setSelectedModel(modelOptions[0].id);
          }
        }
      };
      loadModels();
    }, []); */}
  
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
      // Multi-model comparison - Commented out (too advanced for target audience)
      // if (compareMode && selectedModels.length > 1) {
      //   // ----------------- 🧠 Multi-model comparison -----------------
      //   const comparisonResult = await sandboxApi.comparePrompt({
      //     prompt: userPrompt.trim(),
      //     models: selectedModels,
      //   });
      //
      //   setComparisonResults(comparisonResult.responses);
      //   setTotalCost(comparisonResult.comparison?.totalCost || 0);
      //
      //   // Calculate prompt optimization score
      //   const avgScore =
      //     comparisonResult.responses.reduce(
      //       (sum, r) => sum + (r.feedback?.score || 75),
      //       0
      //     ) / comparisonResult.responses.length;
      //   setPromptOptimizationScore(Math.round(avgScore));
      //
      // } else {
      {
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
        // Calculate sub-scores
        const clarity = evalData.categories?.clarity ?? 0;
        const context = evalData.categories?.context ?? 0;
        const constraints = evalData.categories?.constraints ?? 0;
        const effectiveness = evalData.categories?.effectiveness ??
          Math.round(
            ((evalData.categories?.clarity ?? 0) +
              (evalData.categories?.context ?? 0)) / 2
          );
        
        // Calculate overall score as mean of sub-scores (not sum)
        const subScores = [clarity, context, constraints, effectiveness].filter(s => s > 0);
        const overallScore = subScores.length > 0 
          ? Math.round(subScores.reduce((sum, s) => sum + s, 0) / subScores.length)
          : (evalData.score ?? res.feedback?.score ?? 0);
        
        const newExecution: PromptExecution = {
          id: res.id || "unknown-id",
          timestamp: res?.timings?.end ? new Date(res.timings.end) : new Date(),
          model: selectedModel,
          prompt: userPrompt,
          optimizedPrompt: evalData.optimizedPrompt || userPrompt,
          response: evalData.optimizedPrompt || userPrompt,
          tokens: res.tokens?.total || 0,
          cost: res.cost || 0,
          score: overallScore,
          feedback: {
            clarity: clarity,
            context: context,
            constraints: constraints,
            effectiveness: effectiveness,
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
        setPromptOptimizationScore(overallScore);
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

  return (
    <main className="flex-1 flex flex-col lg:flex-row overflow-y-auto">
             {/* Prompt Editor */}
             <div className="flex-[3] flex flex-col">
               {/* Controls */}
               <div className="border-b border-border/40 p-4">
                 <div className="flex items-center justify-between mb-4">
                   <h1 className="text-2xl font-bold">Prompt Sandbox</h1>
                   {/* History, Save, Share buttons - Commented out (dead links) */}
                   {/* <div className="flex items-center space-x-2">
                     <Button
                       variant="outline"
                       size="sm"
                       className="bg-black text-white border-white hover:bg-black hover:text-white"
                     >
                       <History className="h-4 w-4 mr-2 text-white" />
                       History
                     </Button>
                     <Button
                       variant="outline"
                       size="sm"
                       className="bg-black text-white border-white hover:bg-black hover:text-white"
                     >
                       <Bookmark className="h-4 w-4 mr-2 text-white" />
                       Save
                     </Button>
                     <Button
                       variant="outline"
                       size="sm"
                       className="bg-black text-white border-white hover:bg-black hover:text-white"
                     >
                       <Share className="h-4 w-4 mr-2 text-white" />
                       Share
                     </Button>
                   </div> */}
                 </div>
   
                 {/* Model Settings */}
              {/* Model Settings */}
<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
  <div className="space-y-2">
    <Label>Model</Label>

    <div className="p-3 border rounded-md bg-muted/40 text-white">
      <div className="font-medium">GPT-4</div>
      <div className="text-xs text-muted-foreground">$0.03 / 1K tokens</div>
    </div>
  </div>
</div>

   
                 {/* Advanced Settings */}
                <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
  {/* <CollapsibleTrigger asChild>
    <Button
      variant="outline"
      size="sm"
      className="bg-black text-white border-white hover:bg-black hover:text-white"
    >
      {showAdvanced ? (
        <ChevronUp className="h-4 w-4 mr-2 text-white" />
      ) : (
        <ChevronDown className="h-4 w-4 mr-2 text-white" />
      )}
      Advanced Settings
    </Button>
  </CollapsibleTrigger> */}

  <CollapsibleContent className="mt-4">
    <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/30">

      {/* System Message (disabled – not saveable) */}
      {/*
      <div className="space-y-2">
        <Label>System Message</Label>
        <Textarea
          value={systemMessage}
          onChange={(e) => setSystemMessage(e.target.value)}
          placeholder="Set the AI's role and behavior..."
          className="min-h-[100px]"
        />
      </div>
      */}

      {/* Multi-model Comparison (disabled – too advanced) */}
      {/*
      <div className="flex items-center justify-between p-3 border rounded-lg">
        <div>
          <div className="font-medium">Multi-Model Comparison</div>
          <div className="text-sm text-muted-foreground">
            Compare responses across different AI models
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => setCompareMode(!compareMode)}
          className={
            compareMode
              ? "bg-[#BBFEFF] text-black hover:bg-[#BBFEFF]"
              : "bg-black text-white border-white hover:bg-black hover:text-white"
          }
          variant={compareMode ? "default" : "outline"}
        >
          {compareMode ? "Enabled" : "Enable"}
        </Button>
      </div>
      */}

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
                 {selectedTemplate?.variables.map((variable) => (
                   <div key={variable} className="mb-2">
                     <Label>{variable}</Label>
                     <Input
                       value={templateVariables[variable]}
                       onChange={(e) =>
                         setTemplateVariables((prev) => ({ ...prev, [variable]: e.target.value }))
                       }
                       placeholder={`Enter ${variable}`}
                     />
                   </div>
                 ))}
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
                     placeholder="Enter your prompt here and check your prompt score after running it."
                     className="min-h-[500px] font-mono"
                   />
                 </div>
               </div>
                  <div className="flex items-end flex-col w-full">
                     <Button 
                       onClick={handleRunPrompt}
                       disabled={isLoading || !userPrompt.trim() || remainingRuns === 0}
                       className="w-full bg-[#bdeeff] hover:bg-[#bdeeff] text-black font-medium"
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
                     {/* ----------------- Remaining Runs Display ----------------- */}
                     <div className="mt-2 text-sm text-gray-500 w-full text-right">
                       🌟 Remaining runs this month: {remainingRuns !== undefined ? remainingRuns : 100}
                     </div>
                   </div>
             </div>
   
             {/* Results Panel */}
             <div className="flex-[2] lg:border-l border-border/40 flex flex-col">
               {currentExecution ? (
                 <div className="flex-1 flex flex-col">
                   {/* Header with stats */}
                   <div className="border-b border-border/40 p-4">
                     <div className="flex items-center justify-between mb-4">
                       <h2 className="font-semibold">Results</h2>
                       <div className="flex items-center space-x-2">
                         {currentExecution ? (
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
                       {/* Multi-model comparison view - Commented out (too advanced for target audience) */}
                       {/* {comparisonResults.length > 1 ? (
                         // Multi-model comparison view code...
                       ) : */}
                       {/* Single model view */}
                       {currentExecution && (
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
                                 <div className="mt-4">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setCurrentExecution(null);
                                        setPromptOptimizationScore(0);
                                      }}
                                    >
                                      Clear Response
                                    </Button>
                                  </div>
                               </CardContent>
                             </Card>
                           )}
                         </>
                       )}
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
   
             {showUpgradeModal && (
               <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                 <div className="bg-white rounded-lg p-6 w-96">
                   <h2 className="text-lg font-bold mb-4">Upgrade Required</h2>
                   <p className="mb-6">
                     You have reached your plan limit. Upgrade to Pro or Enterprise to continue using the Sandbox without limits.
                   </p>
                   <div className="flex justify-end space-x-2">
                     <Button variant="outline" onClick={() => setShowUpgradeModal(false)}>Cancel</Button>
                     <Button onClick={() => { /* redirect to billing page */ window.location.href="/billing"; }}>
                       Upgrade Now
                     </Button>
                   </div>
                 </div>
               </div>
             )}
   
           </main>
  );
}
