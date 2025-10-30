import { RequestHandler, Router, Request } from "express";
import { supabaseAdmin, withRetry } from "../supabase";
import { verifyToken } from "../utils/jwt";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import OpenAI from "openai";
import { Anthropic } from "@anthropic-ai/sdk";

const router = Router();

// Extend Express Request type to include `user`
declare global {
  namespace Express {
    interface Request {
      user?: {
        id?: string;
        plan?: "Free" | "Pro" | "Enterprise";
        promptRunsThisMonth?: number;
      };
    }
  }
}

// Types for AI models and responses
interface AIResponse {
  id: string;
  model: string;
  content: string;
  tokens?: number;
  responseTime: number;
  cost?: number;
  error?: string;
}

interface SandboxSession {
  id: string;
  userId: string;
  prompt: string;
  responses: AIResponse[];
  createdAt: string;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const claudeClient = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// Helper function to get user ID from JWT
function getUserId(req: any): string | null {
  const auth = req.headers.authorization as string | undefined;
  if (!auth) return null;
  const token = auth.split(" ")[1];
  const payload = verifyToken(token || "");
  return payload?.sub || null;
}

// OpenAI API integration
async function callOpenAI(prompt: string, model: string = "gpt-4"): Promise<AIResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  const startTime = Date.now();

  if (!apiKey) {
    console.warn("OpenAI API key not configured, using mock response.");
    return {
      id: `mock-${Date.now()}`,
      model: "mock-gpt",
      content: `Mock response for: "${prompt}"`,
      tokens: prompt.split(" ").length,
      responseTime: 10,
      cost: 0,
    };
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 2000,
        temperature: 0.7,
        stream: false,
      }),
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      console.warn("OpenAI API error, using mock response:", response.status, errorText);
      return {
        id: `mock-${Date.now()}`,
        model: "mock-gpt",
        content: `Mock response for: "${prompt}"`,
        tokens: prompt.split(" ").length,
        responseTime,
        cost: 0,
        error: `OpenAI API error: ${response.status} - ${errorText}`,
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "No response generated";
    const tokens = data.usage?.total_tokens || 0;

    // Approximate cost (GPT-4 pricing as of 2024)
    const inputTokens = data.usage?.prompt_tokens || 0;
    const outputTokens = data.usage?.completion_tokens || 0;
    const cost = (inputTokens * 0.00003) + (outputTokens * 0.00006);

    return {
      id: data.id || `openai-${Date.now()}`,
      model: `openai-${model}`,
      content,
      tokens,
      responseTime,
      cost: Math.round(cost * 10000) / 10000, // Round to 4 decimals
    };

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error("OpenAI call failed, using mock response:", error);

    return {
      id: `mock-${Date.now()}`,
      model: "mock-gpt",
      content: `Mock response for: "${prompt}"`,
      tokens: prompt.split(" ").length,
      responseTime,
      cost: 0,
      error: error instanceof Error ? error.message : "Unknown OpenAI error",
    };
  }
}

// Anthropic Claude API integration
async function callClaude(prompt: string, model: string = "claude-3-sonnet-20240229"): Promise<AIResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    throw new Error("Anthropic API key not configured");
  }

  const startTime = Date.now();
  
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 2000,
        temperature: 0.7,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      }),
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || "No response generated";
    const tokens = data.usage?.input_tokens + data.usage?.output_tokens || 0;
    
    // Calculate approximate cost (Claude-3 pricing as of 2024)
    const inputTokens = data.usage?.input_tokens || 0;
    const outputTokens = data.usage?.output_tokens || 0;
    const cost = (inputTokens * 0.000015) + (outputTokens * 0.000075); // $0.015/$0.075 per 1K tokens

    return {
      id: data.id || `claude-${Date.now()}`,
      model: `claude-${model}`,
      content,
      tokens,
      responseTime,
      cost: Math.round(cost * 10000) / 10000
    };

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error("Claude API error:", error);
    
    return {
      id: `claude-error-${Date.now()}`,
      model: `claude-${model}`,
      content: "",
      responseTime,
      error: error instanceof Error ? error.message : "Unknown Claude error"
    };
  }
}

// Rate limiter (IPv6-safe)
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
 keyGenerator: (req) => ipKeyGenerator(req as any), // TS-safe cast
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for AI API calls (more restrictive than general API)
const aiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 AI calls per minute per user
  keyGenerator: (req) => {
    const userId = getUserId(req);
    // Use userId if available, otherwise fallback to IP with proper IPv6 handling
    return userId || ipKeyGenerator(req as any);
  },
  message: {
    error: 'Too many AI requests. Please wait before trying again.',
    code: 'AI_RATE_LIMITED',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Route handler
const runHandler: RequestHandler<{},{},{prompt:string, model?:string, provider?:"openai"|"claude"}> = async (req, res) => {
  try {
    const { prompt, model, provider } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Missing prompt" });
    }

    let aiResponse: AIResponse;

    if (provider === "claude") {
      aiResponse = await callClaude(prompt, model);
    } else {
      // default to OpenAI
      aiResponse = await callOpenAI(prompt, model);
    }

    // Optionally: save to sandbox_sessions here

    res.json(aiResponse);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Unknown error" });
  }
};

// Test single prompt with one AI model
export const testPrompt: RequestHandler = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { prompt, model } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ error: 'Prompt is required and must be a non-empty string' });
    }

    if (prompt.length > 8000) {
      return res.status(400).json({ error: 'Prompt too long. Maximum 8000 characters allowed.' });
    }

    if (!model || !['openai-gpt-4', 'claude-3-sonnet'].includes(model)) {
      return res.status(400).json({ error: 'Invalid model. Must be "openai-gpt-4" or "claude-3-sonnet"' });
    }

    let response: AIResponse;

    if (model === 'openai-gpt-4') {
      response = await callOpenAI(prompt.trim(), 'gpt-4');
    } else {
      response = await callClaude(prompt.trim(), 'claude-3-sonnet-20240229');
    }

    // Save to sandbox session history
    try {
      const sessionData = {
        id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: userId,
        prompt: prompt.trim(),
        model_used: response.model,
        response_content: response.content,
        response_time_ms: response.responseTime,
        tokens_used: response.tokens || 0,
        cost_usd: response.cost || 0,
        error_message: response.error || null,
        created_at: new Date().toISOString()
      };

      // We'll create a table for this, but for now, just log
      console.log('Sandbox session:', sessionData);
      
      // TODO: Save to database when sandbox_sessions table is ready
      // await supabaseAdmin.from('sandbox_sessions').insert(sessionData);
      
    } catch (saveError) {
      console.error('Failed to save sandbox session:', saveError);
      // Don't fail the request if saving fails
    }

    res.json({
      success: true,
      prompt: prompt.trim(),
      response: response
    });

  } catch (error) {
    console.error('Test prompt error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Compare prompt across multiple AI models
export const comparePrompt: RequestHandler = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ error: 'Prompt is required and must be a non-empty string' });
    }

    if (prompt.length > 8000) {
      return res.status(400).json({ error: 'Prompt too long. Maximum 8000 characters allowed.' });
    }

    // Call both models concurrently
    const [openaiResponse, claudeResponse] = await Promise.allSettled([
      callOpenAI(prompt.trim(), 'gpt-4'),
      callClaude(prompt.trim(), 'claude-3-sonnet-20240229')
    ]);

    const responses: AIResponse[] = [];

    if (openaiResponse.status === 'fulfilled') {
      responses.push(openaiResponse.value);
    } else {
      responses.push({
        id: `openai-error-${Date.now()}`,
        model: 'openai-gpt-4',
        content: `Example mock answer for: "${prompt}"`,
        responseTime: 0,
        error: 'OpenAI request failed'
      });
    }

    if (claudeResponse.status === 'fulfilled') {
      responses.push(claudeResponse.value);
    } else {
      responses.push({
        id: `claude-error-${Date.now()}`,
        model: 'claude-3-sonnet-20240229',
        content: `Example mock answer for: "${prompt}"`,
        responseTime: 0,
        error: 'Claude request failed'
      });
    }

    // Save comparison session
    try {
      const sessionData = {
        id: `comparison_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: userId,
        prompt: prompt.trim(),
        responses: JSON.stringify(responses),
        total_cost: responses.reduce((sum, r) => sum + (r.cost || 0), 0),
        created_at: new Date().toISOString()
      };

      console.log('Comparison session:', sessionData);
      
      // TODO: Save to database when sandbox_sessions table is ready
      
    } catch (saveError) {
      console.error('Failed to save comparison session:', saveError);
    }

    res.json({
      success: true,
      prompt: prompt.trim(),
      responses: responses,
      comparison: {
        totalCost: responses.reduce((sum, r) => sum + (r.cost || 0), 0),
        totalTime: Math.max(...responses.map(r => r.responseTime)),
        modelsCompared: responses.length
      }
    });

  } catch (error) {
    console.error('Compare prompt error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get user's sandbox session history
export const getSandboxHistory: RequestHandler = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // For now, return mock data since we don't have the database table yet
    // TODO: Replace with actual database query when sandbox_sessions table is ready
    
    const mockHistory = [
      {
        id: 'session_1',
        prompt: 'Write a Python function to calculate factorial',
        model_used: 'openai-gpt-4',
        response_content: 'def factorial(n):\n    if n == 0 or n == 1:\n        return 1\n    return n * factorial(n - 1)',
        response_time_ms: 1250,
        tokens_used: 45,
        cost_usd: 0.0014,
        created_at: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
      },
      {
        id: 'session_2',
        prompt: 'Explain quantum computing in simple terms',
        model_used: 'claude-3-sonnet',
        response_content: 'Quantum computing is like having a very special type of computer that can explore many possible solutions to a problem simultaneously...',
        response_time_ms: 2100,
        tokens_used: 78,
        cost_usd: 0.0023,
        created_at: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
      }
    ];

    res.json({
      success: true,
      history: mockHistory,
      pagination: {
        page: 1,
        totalPages: 1,
        totalSessions: mockHistory.length
      }
    });

  } catch (error) {
    console.error('Get sandbox history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get prompt templates for different use cases
export const getPromptTemplates: RequestHandler = async (req, res) => {
  try {
    const { category, role } = req.query;

    // Comprehensive prompt templates organized by role and category
    const templates = {
      engineer: {
        'code-generation': [
          {
            id: 'eng-code-1',
            title: 'Context-Rich Code Generation',
            template: 'I\'m building a {language} {project_type} for {use_case}. I need a {function_type} that {specific_requirement}. Requirements:\n\n- {requirement_1}\n- {requirement_2}\n- {requirement_3}\n\nPlease generate clean, well-commented code following {coding_standard} conventions.',
            description: 'Provides comprehensive context for generating high-quality, production-ready code.',
            variables: ['language', 'project_type', 'use_case', 'function_type', 'specific_requirement', 'requirement_1', 'requirement_2', 'requirement_3', 'coding_standard'],
            category: 'code-generation',
            difficulty: 'intermediate'
          },
          {
            id: 'eng-code-2',
            title: 'Algorithm Design Framework',
            template: 'Design an algorithm for {problem_description}.\n\nConstraints:\n- Time complexity: {time_complexity}\n- Space complexity: {space_complexity}\n- Input size: {input_size}\n- Edge cases to consider: {edge_cases}\n\nProvide the algorithm in {language} with explanation of approach and complexity analysis.',
            description: 'Structured approach for algorithm design with complexity considerations.',
            variables: ['problem_description', 'time_complexity', 'space_complexity', 'input_size', 'edge_cases', 'language'],
            category: 'code-generation',
            difficulty: 'advanced'
          }
        ],
        'debugging': [
          {
            id: 'eng-debug-1',
            title: 'Systematic Debugging Analysis',
            template: 'I\'m encountering a {error_type} in my {language} code. Here\'s the problematic code:\n\n```{language}\n{code_snippet}\n```\n\nError message: {error_message}\nExpected behavior: {expected_behavior}\nActual behavior: {actual_behavior}\n\nPlease analyze the issue and provide:\n1. Root cause explanation\n2. Step-by-step fix\n3. Prevention strategies',
            description: 'Comprehensive debugging framework for systematic problem resolution.',
            variables: ['error_type', 'language', 'code_snippet', 'error_message', 'expected_behavior', 'actual_behavior'],
            category: 'debugging',
            difficulty: 'intermediate'
          }
        ]
      },
      marketer: {
        'content-creation': [
          {
            id: 'mkt-content-1',
            title: 'Brand-Aligned Content Creation',
            template: 'Create {content_type} for {brand_name} targeting {target_audience}.\n\nBrand voice: {brand_voice_attributes}\nKey message: {key_message}\nCall-to-action: {cta}\nTone: {tone}\nLength: {content_length}\n\nEnsure the content aligns with our brand guidelines and drives engagement.',
            description: 'Framework for creating consistent, brand-aligned marketing content.',
            variables: ['content_type', 'brand_name', 'target_audience', 'brand_voice_attributes', 'key_message', 'cta', 'tone', 'content_length'],
            category: 'content-creation',
            difficulty: 'beginner'
          },
          {
            id: 'mkt-content-2',
            title: 'High-Converting Sales Copy',
            template: 'Write {copy_type} for {product_service} that converts {target_audience} into customers.\n\nProduct benefits:\n- {benefit_1}\n- {benefit_2}\n- {benefit_3}\n\nPain points addressed:\n- {pain_point_1}\n- {pain_point_2}\n\nObjections to overcome:\n- {objection_1}\n- {objection_2}\n\nInclude social proof and create urgency with {urgency_mechanism}.',
            description: 'Conversion-focused copywriting framework with psychological triggers.',
            variables: ['copy_type', 'product_service', 'target_audience', 'benefit_1', 'benefit_2', 'benefit_3', 'pain_point_1', 'pain_point_2', 'objection_1', 'objection_2', 'urgency_mechanism'],
            category: 'content-creation',
            difficulty: 'advanced'
          }
        ],
        'analysis': [
          {
            id: 'mkt-analysis-1',
            title: 'Campaign Performance Analysis',
            template: 'Analyze the performance of my {campaign_type} campaign for {product_service}.\n\nCampaign metrics:\n- Impressions: {impressions}\n- Clicks: {clicks}\n- Conversions: {conversions}\n- Cost: {cost}\n- Revenue: {revenue}\n\nTarget audience: {target_audience}\nChannels used: {channels}\nCampaign duration: {duration}\n\nProvide insights on performance, identify optimization opportunities, and recommend next steps.',
            description: 'Comprehensive framework for marketing campaign analysis and optimization.',
            variables: ['campaign_type', 'product_service', 'impressions', 'clicks', 'conversions', 'cost', 'revenue', 'target_audience', 'channels', 'duration'],
            category: 'analysis',
            difficulty: 'intermediate'
          }
        ]
      },
      designer: {
        'creative-brief': [
          {
            id: 'des-brief-1',
            title: 'Comprehensive Design Brief',
            template: 'Create a design brief for {project_type} for {client_brand}.\n\nProject objectives:\n- {objective_1}\n- {objective_2}\n- {objective_3}\n\nTarget audience: {target_audience}\nBrand personality: {brand_personality}\nDesign style preferences: {style_preferences}\nConstraints: {constraints}\nDeliverables needed: {deliverables}\n\nProvide detailed design direction, mood board suggestions, and success metrics.',
            description: 'Structured approach to creating comprehensive design briefs.',
            variables: ['project_type', 'client_brand', 'objective_1', 'objective_2', 'objective_3', 'target_audience', 'brand_personality', 'style_preferences', 'constraints', 'deliverables'],
            category: 'creative-brief',
            difficulty: 'intermediate'
          }
        ]
      },
      manager: {
        'team-communication': [
          {
            id: 'mgr-comm-1',
            title: 'Strategic Team Update',
            template: 'Draft a team update for {team_name} covering {update_period}.\n\nKey achievements:\n- {achievement_1}\n- {achievement_2}\n- {achievement_3}\n\nChallenges faced:\n- {challenge_1}\n- {challenge_2}\n\nUpcoming priorities:\n- {priority_1}\n- {priority_2}\n- {priority_3}\n\nTeam recognition: {recognition_notes}\n\nTone: {tone} and ensure clear action items for next {time_period}.',
            description: 'Framework for effective team communication and updates.',
            variables: ['team_name', 'update_period', 'achievement_1', 'achievement_2', 'achievement_3', 'challenge_1', 'challenge_2', 'priority_1', 'priority_2', 'priority_3', 'recognition_notes', 'tone', 'time_period'],
            category: 'team-communication',
            difficulty: 'intermediate'
          }
        ]
      },
      researcher: {
        'literature-review': [
          {
            id: 'res-lit-1',
            title: 'Systematic Literature Review',
            template: 'Conduct a literature review on {research_topic} focusing on {specific_aspect}.\n\nResearch questions:\n- {research_question_1}\n- {research_question_2}\n\nKey databases to search: {databases}\nInclusion criteria: {inclusion_criteria}\nExclusion criteria: {exclusion_criteria}\nTime period: {time_period}\n\nProvide a structured analysis of current research, identify gaps, and suggest future research directions.',
            description: 'Framework for systematic literature review and research synthesis.',
            variables: ['research_topic', 'specific_aspect', 'research_question_1', 'research_question_2', 'databases', 'inclusion_criteria', 'exclusion_criteria', 'time_period'],
            category: 'literature-review',
            difficulty: 'advanced'
          }
        ]
      }
    };

    // Filter templates based on query parameters
    let filteredTemplates = templates;

    if (role && typeof role === 'string' && templates[role as keyof typeof templates]) {
      filteredTemplates = { [role]: templates[role as keyof typeof templates] } as any;
    }

    if (category && typeof category === 'string') {
      const filtered: any = {};
      Object.keys(filteredTemplates).forEach(roleKey => {
        const roleTemplates = (filteredTemplates as any)[roleKey];
        if (roleTemplates[category]) {
          if (!filtered[roleKey]) filtered[roleKey] = {};
          filtered[roleKey][category] = roleTemplates[category];
        }
      });
      filteredTemplates = filtered;
    }

    res.json({
      success: true,
      templates: filteredTemplates,
      totalTemplates: Object.values(filteredTemplates).reduce((sum: number, roleTemplates: any) => {
        const nestedSum = Object.values(roleTemplates).reduce((roleSum: number, categoryTemplates: any) => {
          return roleSum + (Array.isArray(categoryTemplates) ? categoryTemplates.length : 0);
        }, 0);
        return (sum as number) + (nestedSum as number);
      }, 0)
    });

  } catch (error) {
    console.error('Get prompt templates error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get AI model status and capabilities
export const getAIModels: RequestHandler = async (req, res) => {
  try {
    const models = [
      {
        id: 'openai-gpt-4',
        name: 'GPT-4',
        provider: 'OpenAI',
        description: 'Most capable GPT model, excellent for complex reasoning, code generation, and creative tasks.',
        capabilities: ['text-generation', 'code-generation', 'analysis', 'creative-writing'],
        maxTokens: 8192,
        costPer1kTokens: {
          input: 0.03,
          output: 0.06
        },
        responseTimeMs: 1000,
        available: !!process.env.OPENAI_API_KEY
      },
      {
        id: 'claude-3-sonnet',
        name: 'Claude-3 Sonnet',
        provider: 'Anthropic',
        description: 'Balanced model with strong reasoning capabilities, excellent for analysis and safety-conscious responses.',
        capabilities: ['text-generation', 'analysis', 'reasoning', 'safety-focused'],
        maxTokens: 200000,
        costPer1kTokens: {
          input: 0.015,
          output: 0.075
        },
        responseTimeMs: 1500,
        available: !!process.env.ANTHROPIC_API_KEY
      }
    ];

    res.json({
      success: true,
      models: models,
      totalModels: models.length,
      availableModels: models.filter(m => m.available).length
    });

  } catch (error) {
    console.error('Get AI models error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Evaluate a user prompt for clarity, structure, and effectiveness
export const evaluatePrompt: RequestHandler = async (req, res) => {
  try {
    const { prompt, context = "" } = req.body ?? {};
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Prompt text required" });
    }

    // 🧩 Step 1: Get user info (replace with real DB later)
    const user = req.user || { id: "demo_user", plan: "Free", promptRunsThisMonth: 0 };
    const userPlan = user.plan || "Free";
    const usage = user.promptRunsThisMonth || 0;

    // Define plan limits
    const PLAN_LIMITS: Record<string, number> = {
      Free: 100,
      Pro: 1000,
      Enterprise: Infinity,
    };
    const limit = PLAN_LIMITS[userPlan];

    // Calculate remaining runs
    const remainingRuns = limit === Infinity ? "Unlimited" : Math.max(limit - usage, 0);
    const upgradePrompt = limit !== Infinity && usage >= limit;

    // If limit reached, return immediately
    if (upgradePrompt) {
      return res.status(403).json({
        error: "You’ve reached your monthly prompt limit.",
        upgradePrompt: true,
        remainingRuns: 0,
        plan: userPlan,
      });
    }

    const start = Date.now();

    // Messages for OpenAI chat completion
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `You are an expert prompt optimizer. 
- Evaluate the user’s prompt and provide scores and feedback.
- Generate an improved, fully usable version of the prompt, ready for AI use.
- Respond ONLY in JSON with keys: 
  score (0–100), categories (clarity/context/constraints/effectiveness, each 0–25), 
  suggestions (array of short actionable tips), 
  feedback (short paragraph), 
  optimizedPrompt (the fully reworked prompt).`,
      },
      {
        role: "user",
        content: `Context: ${context}\n\nOriginal Prompt:\n"""${prompt}"""\n\nReturn valid JSON only.`,
      },
    ];

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.3,
      max_tokens: 300,
    });

    const end = Date.now();

    // Extract AI content
    const content = completion.choices?.[0]?.message?.content?.trim() || "";

    // Safely parse JSON
    let parsed: any = {};
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch (err) {
      console.error("JSON parse error:", err, content);
      return res.status(200).json({
        parseError: true,
        raw: content,
        remainingRuns,
        upgradePrompt,
        plan: userPlan,
        timings: { start, end, latencyMs: end - start },
      });
    }

    // Ensure all expected fields exist
    parsed.categories = parsed.categories || {};
    parsed.suggestions = parsed.suggestions || [];
    parsed.optimizedPrompt = parsed.optimizedPrompt || "";
    parsed.score = parsed.score ?? 0;

    // 🧩 Step 2: Increment counter (replace with real DB save later)
    user.promptRunsThisMonth = usage + 1;
    const updatedRemainingRuns =
      limit === Infinity ? "Unlimited" : Math.max(limit - user.promptRunsThisMonth, 0);
    const updatedUpgradePrompt = limit !== Infinity && user.promptRunsThisMonth >= limit;

    // 🧩 Step 3: Return full response
    return res.status(200).json({
      ...parsed,
      remainingRuns: updatedRemainingRuns,
      upgradePrompt: updatedUpgradePrompt,
      plan: userPlan,
      timings: { start, end, latencyMs: end - start },
    });
  } catch (err: any) {
    console.error("evaluatePrompt error:", err?.message ?? err);
    return res.status(500).json({ error: "Evaluation failed", detail: err?.message ?? err });
  }
};



// Apply rate limiting to AI endpoints
router.use('/test', aiRateLimit);
router.use('/compare', aiRateLimit);

// Route definitions
router.post('/test', testPrompt);
router.post('/compare', aiRateLimit, comparePrompt); // apply stricter AI rate limiting
router.post("/run", aiRateLimit, runHandler); // stricter AI limiter
router.post("/evaluate-prompt", evaluatePrompt);
router.get('/history', getSandboxHistory);
router.get('/templates', getPromptTemplates);
router.get('/models', getAIModels);
router.get("/status", limiter, (req, res) => { // general route
  res.json({ status: "ok" });
});

export default router;