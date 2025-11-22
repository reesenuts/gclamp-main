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

// Settings Response
export interface SettingsResponse {
  setting: {
    acadyear_fld?: string;
    sem_fld?: string;
    [key: string]: any;
  };
  acadyear: Array<{
    acadyear_fld: string;
    sem_fld: string;
    [key: string]: any;
  }>;
  enlistment?: any;
  evaluation?: any;
}

// Student Class Response
export interface StudentClass {
  classcode_fld: string;
  subjcode_fld: string;
  subjdesc_fld: string;
  day_fld: string;
  starttime_fld: string;
  endtime_fld: string;
  room_fld: string;
  block_fld: string;
  ay_fld: string;
  sem_fld: string;
  email_fld: string;
  empcode_fld: string;
  faculty_fld: string;
  [key: string]: any;
}

// Todo List Item (from API)
export interface TodoListItem {
  actcode_fld: string;
  classcode_fld: string;
  subjcode_fld?: string;
  subjdesc_fld?: string;
  title_fld: string;
  desc_fld?: string;
  totalscore_fld: number;
  deadline_fld: string;
  datetime_fld: string;
  datesched_fld?: string;
  type_fld?: string;
  recipient_fld?: string;
  // Submission related fields
  submitcode_fld?: string;
  issubmitted_fld?: number;
  isscored_fld?: number;
  score_fld?: number;
  datetime_submitted?: string;
  [key: string]: any;
}

