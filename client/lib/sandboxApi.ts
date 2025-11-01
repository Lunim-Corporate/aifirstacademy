// API utilities for sandbox functionality
import { APIResponse, APIError } from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';
// When empty string, fetch() will use same-origin base; set VITE_API_URL in prod if calling a different host

// Helper function to make authenticated API requests
async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('auth_token');
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new APIError(errorData.message || 'Request failed', response.status);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError('Network error or server unavailable', 500);
  }
}

// Types for sandbox API responses
export interface AIModelInfo {
  id: string;
  name: string;
  provider: string;
  description: string;
  capabilities: string[];
  maxTokens: number;
  costPer1kTokens: { input: number; output: number };
  responseTimeMs: number;
  available: boolean;
}

export interface AIResponse {
  id: string;
  model: string;
  content: string;
  tokens?: number;
  responseTime: number;
  cost?: number;
  error?: string;

  // Optional properties for sandbox runs
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
   categories?: {
    clarity?: number;
    context?: number;
    constraints?: number;
    effectiveness?: number;
  };
  suggestions?: string[];
}


export interface PromptTemplate {
  id: string;
  title: string;
  template: string;
  description: string;
  variables: string[];
  category: string;
  difficulty: string;
}

export interface SandboxSession {
  id: string;
  prompt: string;
  responses: AIResponse[];
  timestamp: string;
  totalCost: number;
}

export interface PromptTestRequest {
  prompt: string;
  model: string;
}

export interface PromptCompareRequest {
  prompt: string;
  models?: string[]; // Optional - if not provided, will use all available models
}

export interface ComparisonResult {
  responses: AIResponse[];
  comparison: {
    totalCost: number;
    totalTime: number;
    modelsCompared: number;
  };
}

// Sandbox API functions
export const sandboxApi = {
  // Get available AI models and their information
  async getModels(): Promise<{ models: AIModelInfo[] }> {
    return apiCall<{ models: AIModelInfo[] }>('/api/sandbox/models');
  },

  // Test a prompt with a single model
  async testPrompt(data: PromptTestRequest): Promise<{ response: AIResponse }> {
    return apiCall<{ response: AIResponse }>('/api/sandbox/test', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Compare a prompt across multiple models
  async comparePrompt(data: PromptCompareRequest): Promise<ComparisonResult> {
    return apiCall<ComparisonResult>('/api/sandbox/compare', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Get prompt templates organized by role and category
  async getTemplates(): Promise<{ templates: Record<string, Record<string, PromptTemplate[]>> }> {
    return apiCall<{ templates: Record<string, Record<string, PromptTemplate[]>> }>('/api/sandbox/templates');
  },

  // Get user's sandbox session history
  async getHistory(): Promise<{ sessions: SandboxSession[] }> {
    return apiCall<{ sessions: SandboxSession[] }>('/api/sandbox/history');
  },

  // Save a prompt template (for future implementation)
  async saveTemplate(template: Omit<PromptTemplate, 'id'>): Promise<{ template: PromptTemplate }> {
    return apiCall<{ template: PromptTemplate }>('/api/sandbox/templates', {
      method: 'POST',
      body: JSON.stringify(template),
    });
  },

  // Delete a sandbox session (for future implementation)
  async deleteSession(sessionId: string): Promise<void> {
    return apiCall<void>(`/api/sandbox/history/${sessionId}`, {
      method: 'DELETE',
    });
  },

  // Get user's sandbox usage statistics
  async getUsageStats(): Promise<{ 
    totalPrompts: number;
    totalCost: number;
    favoriteModel: string;
    promptsThisMonth: number;
    costThisMonth: number;
  }> {
    return apiCall<{ 
      totalPrompts: number;
      totalCost: number;
      favoriteModel: string;
      promptsThisMonth: number;
      costThisMonth: number;
    }>('/api/sandbox/stats');
  }
};

// Error handling utilities
export class SandboxError extends Error {
  constructor(
    message: string,
    public code: string = 'SANDBOX_ERROR',
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'SandboxError';
  }
}

export const handleSandboxError = (error: unknown): string => {
  if (error instanceof SandboxError) {
    return error.message;
  }
  
  if (error instanceof APIError) {
    switch (error.statusCode) {
      case 429:
        return 'Rate limit exceeded. Please wait a moment before trying again.';
      case 401:
        return 'Authentication required. Please log in again.';
      case 403:
        return 'Insufficient permissions to access AI sandbox.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return error.message || 'An error occurred while processing your request.';
    }
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unknown error occurred.';
};

// Rate limiting utilities
export const rateLimitInfo = {
  // Check if user is approaching rate limits (for UI warnings)
  checkRateLimit: async (): Promise<{ remaining: number; resetTime: string; isApproaching: boolean }> => {
    try {
      const response = await apiCall<{ remaining: number; resetTime: string }>('/api/sandbox/rate-limit');
      return {
        ...response,
        isApproaching: response.remaining < 5, // Warn when less than 5 requests remaining
      };
    } catch (error) {
      // If rate limit check fails, assume we're fine
      return { remaining: 100, resetTime: '', isApproaching: false };
    }
  }
};

// Usage tracking utilities
export const usageTracker = {
  // Track a completed prompt for analytics
  trackPromptUsage: async (data: {
    model: string;
    promptLength: number;
    responseTokens: number;
    cost: number;
    responseTime: number;
  }): Promise<void> => {
    try {
      await apiCall('/api/sandbox/track-usage', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      // Usage tracking is non-critical, so we don't throw errors
      console.warn('Failed to track usage:', error);
    }
  }
};

// Template management utilities
export const templateUtils = {
  // Parse template variables from template string
  parseVariables: (template: string): string[] => {
    const variableRegex = /\{([^}]+)\}/g;
    const variables: string[] = [];
    let match;
    
    while ((match = variableRegex.exec(template)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }
    
    return variables;
  },

  // Replace variables in template with actual values
  fillTemplate: (template: string, variables: Record<string, string>): string => {
    let filled = template;
    
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      filled = filled.replace(regex, value);
    });
    
    return filled;
  },

  // Validate that all variables in template are provided
  validateTemplate: (template: string, variables: Record<string, string>): { valid: boolean; missing: string[] } => {
    const requiredVariables = templateUtils.parseVariables(template);
    const missing = requiredVariables.filter(variable => !variables[variable] || variables[variable].trim() === '');
    
    return {
      valid: missing.length === 0,
      missing
    };
  }
};

export default sandboxApi;
