/**
 * Error Handling Utilities
 * Centralized error handling for API responses
 */

import { ApiError, ApiResponse } from '../types/api';

/**
 * Extract user-friendly error message from API response
 */
export const getErrorMessage = (error: any): string => {
  // Handle API response errors
  if (error?.response?.data?.status?.msg) {
    return error.response.data.status.msg;
  }

  // Handle ApiResponse structure
  if (error?.status?.msg) {
    return error.status.msg;
  }

  // Handle network errors
  if (error?.message) {
    if (error.message.includes('Network request failed')) {
      return 'Network error. Please check your connection.';
    }
    if (error.message.includes('timeout')) {
      return 'Request timeout. Please try again.';
    }
    return error.message;
  }

  // Default error message
  return 'An unexpected error occurred. Please try again.';
};

/**
 * Check if error is an authentication error
 */
export const isAuthError = (error: any): boolean => {
  const status = error?.response?.status || error?.status;
  return status === 401 || status === 403;
};

/**
 * Check if API response indicates success
 */
export const isSuccessResponse = <T>(response: ApiResponse<T>): boolean => {
  return response.status.rem === 'success' && response.data !== null;
};

/**
 * Create standardized error object
 */
export const createApiError = (error: any): ApiError => {
  return {
    message: getErrorMessage(error),
    status: error?.response?.status || error?.status,
    statusText: error?.response?.statusText || error?.statusText,
    data: error?.response?.data || error,
  };
};

