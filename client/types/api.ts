// API types and utilities for client-side usage
// These types are used throughout the client application

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Re-export commonly used types from shared API
export type {
  AuthUser,
  AuthResponse,
  MeResponse,
  SandboxRunRequest,
  SandboxRunResponse,
  LibraryResource,
  CommunityPrompt,
  Discussion,
  Challenge,
  NotificationItem,
  DashboardResponse,
  Track,
  LessonContent,
  UserLessonProgress
} from '@shared/api';
