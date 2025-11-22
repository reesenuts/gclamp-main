/**
 * API Type Definitions
 * Based on API Documentation
 */

// Standard API Response Structure
export interface ApiResponse<T = any> {
  status: {
    rem: 'success' | 'failed';
    msg: string;
    sys: string;
  };
  data: T | null;
  stamp: string; // ISO 8601 datetime
}

// Request Structure
export interface ApiRequest {
  payload: Record<string, any>;
  panel?: string;
  device?: string;
  log?: LogObject;
  options?: {
    ay?: string;
    sem?: string;
    userid?: string;
  };
  classcode?: string;
  filepath?: string;
}

// Log Object (for operations that require logging)
export interface LogObject {
  username: string;
  fullname: string;
  dept: string;
  program: string;
  panel: string;
  device: string;
}

// User Object (Login Response)
export interface User {
  id: string; // Student number
  fullname: string;
  key: {
    token: string; // JWT token
    expires: number; // Unix timestamp
  };
  role: string;
  emailadd: string;
  dept: string;
  program: string;
  status: string;
  issurvey: number; // 0 or 1
  ispwordreset: number; // 0 or 1
  image: string; // Profile image path
}

// Login Credentials
export interface LoginCredentials {
  username: string;
  password: string;
  panel?: string;
  device?: string;
}

// Token Storage
export interface TokenData {
  token: string;
  expires: number;
  user?: User;
}

// API Error
export interface ApiError {
  message: string;
  status?: number;
  statusText?: string;
  data?: ApiResponse<any>;
}

