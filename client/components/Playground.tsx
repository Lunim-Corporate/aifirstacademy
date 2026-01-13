import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Play,
  Copy,
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
  Bookmark,
  Code
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { apiSandboxRun } from "@/lib/api";
import { sandboxApi } from "@/lib/sandboxApi";

interface PlaygroundProps {
  initialPrompt?: string;
  onClose?: () => void;
}

const modelOptions = [
  { id: "gpt-4", name: "GPT-4", cost: "$0.03/1K tokens", speed: "Moderate" },
  { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", cost: "$0.002/1K tokens", speed: "Fast" },
  { id: "claude-3", name: "Claude 3 Sonnet", cost: "$0.015/1K tokens", speed: "Moderate" },
  { id: "llama-2", name: "Llama 2 70B", cost: "$0.001/1K tokens", speed: "Fast" },
];

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

export default function Playground({ initialPrompt = "", onClose }: PlaygroundProps) {
  const [systemMessage, setSystemMessage] = useState("You are a helpful AI assistant specialized in software development. Provide clear, practical advice with code examples when relevant.");
  const [userPrompt, setUserPrompt] = useState(initialPrompt);
  const [selectedModel, setSelectedModel] = useState("gpt-4");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1000);
  const [isLoading, setIsLoading] = useState(false);
  const [currentExecution, setCurrentExecution] = useState<PromptExecution | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const [totalCost, setTotalCost] = useState(0);
  const [promptOptimizationScore, setPromptOptimizationScore] = useState(0);

  // Load available AI models
  useEffect(() => {
    const loadModels = async () => {
      try {
        const { models } = await sandboxApi.getModels();
        setAvailableModels(models.length > 0 ? models : modelOptions);
        // Default to first available model
        if (models.length > 0) {
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
  }, []);

  const handleRunPrompt = async () => {
    if (!userPrompt.trim()) {
      alert("Please enter a prompt before running");
      return;
    }

    setIsLoading(true);

    try {
      // Run the prompt normally
      const res: AIResponse = await apiSandboxRun({
        prompt: userPrompt,
        temperature,
        maxTokens,
        system: systemMessage,
      });
      console.log("Playground API response:", res);

      // Calculate overall effectiveness score as mean of sub-scores (not sum)
      const clarity = res.feedback?.clarity ?? 0;
      const context = res.feedback?.context ?? 0;
      const constraints = res.feedback?.constraints ?? 0;
      const effectiveness = res.feedback?.effectiveness ?? 0;
      
      // Calculate mean of sub-scores
      const subScores = [clarity, context, constraints, effectiveness].filter(s => s > 0);
      const overallScore = subScores.length > 0 
        ? Math.round(subScores.reduce((sum, s) => sum + s, 0) / subScores.length)
        : (res.feedback?.score ?? 0);

      // Create execution object
      const newExecution: PromptExecution = {
        id: res.id || "unknown-id",
        timestamp: res?.timings?.end ? new Date(res.timings.end) : new Date(),
        model: selectedModel,
        prompt: userPrompt,
        optimizedPrompt: userPrompt,
        response: res.content || "",
        tokens: res.tokens?.total || 0,
        cost: res.cost || 0,
        score: overallScore,
        feedback: {
          clarity: clarity,
          context: context,
          constraints: constraints,
          effectiveness: effectiveness,
          suggestions: res.feedback?.notes ? [res.feedback.notes] : ["No suggestions returned"],
        },
      };

      // Update UI
      setCurrentExecution(newExecution);
      setTotalCost(res.cost || 0);
      setPromptOptimizationScore(overallScore);

    } catch (err: any) {
      console.error(err);
      alert(err.message || "Run failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="flex items-center">
            <Code className="h-5 w-5 mr-2" />
            Playground
          </CardTitle>
          <CardDescription>Test your prompts and get immediate feedback</CardDescription>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Controls */}
        <div className="space-y-4">
          {/* Model Settings */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Model</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="text-white [&>span]:text-white">
                  <SelectValue placeholder="Select a model" className="text-white" />
                </SelectTrigger>
                <SelectContent>
                  {availableModels.map((model) => (
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
            </div>
          </div>

          {/* Advanced Settings */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="bg-black text-white border-white hover:bg-black hover:text-white">
                {showAdvanced ? (
                  <ChevronUp className="h-4 w-4 mr-2 text-white" />
                ) : (
                  <ChevronDown className="h-4 w-4 mr-2 text-white" />
                )}
                Advanced Settings
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/30">
                {/* System Message - Commented out (not saveable, so removed per requirements) */}
                {/* <div className="space-y-2">
                  <Label>System Message</Label>
                  <Textarea
                    value={systemMessage}
                    onChange={(e) => setSystemMessage(e.target.value)}
                    placeholder="Set the AI's role and behavior..."
                    className="min-h-[100px]"
                  />
                </div> */}
                
                {/* Prompt Optimization Score */}
                {promptOptimizationScore > 0 && (
                  <div className="space-y-2">
                    <Label>Prompt Quality Score</Label>
                    <div className="flex items-center space-x-3">
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div 
                          className="bg-brand-500 h-2 rounded-full" 
                          style={{ width: `${promptOptimizationScore}%` }}
                        />
                      </div>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Prompt Editor */}
          <div className="space-y-2">
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
              className="min-h-[200px] font-mono"
            />
          </div>

          {/* Results Panel */}
          <div className="space-y-2">
            <Label>Results</Label>
            <div className="border rounded-lg h-[200px] overflow-hidden">
              {currentExecution ? (
                <ScrollArea className="h-full p-3">
                  <pre className="whitespace-pre-wrap text-sm">{currentExecution.response}</pre>
                </ScrollArea>
              ) : (
                <div className="h-full flex items-center justify-center text-center p-4">
                  <div className="space-y-2">
                    <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center mx-auto">
                      <Zap className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm">
                        Run a prompt to see AI responses and get feedback
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Detailed Results */}
        {currentExecution && (
          <Card className="border-l-4 border-l-brand-500">
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>Analysis</span>
                <Badge variant="secondary">{currentExecution.model}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">Tokens:</span>
                  <div className="text-brand-600">{currentExecution.tokens}</div>
                </div>
                <div>
                  <span className="font-medium">Cost:</span>
                  <div className="text-brand-600">${currentExecution.cost.toFixed(4)}</div>
                </div>
                <div>
                  <span className="font-medium">Score:</span>
                  <div className="text-brand-600">{currentExecution.score}/100</div>
                </div>
                <div>
                  <span className="font-medium">Time:</span>
                  <div className="text-brand-600">
                    {currentExecution.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>

              {currentExecution.feedback.suggestions.length > 0 && (
                <div>
                  <h4 className="font-medium flex items-center mb-2">
                    <Lightbulb className="h-4 w-4 mr-2" />
                    Improvement Suggestions
                  </h4>
                  <ul className="space-y-1">
                    {currentExecution.feedback.suggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start space-x-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-brand-600 mt-0.5 flex-shrink-0" />
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}