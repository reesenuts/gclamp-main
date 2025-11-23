/**
 * API Client
 * Centralized HTTP client for API requests with JWT authentication
 */

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import API_CONFIG from '../../config/api';
import { ApiRequest, ApiResponse } from '../../types/api';
import { createApiError, isAuthError } from '../../utils/errorHandler';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';
const TOKEN_EXPIRY_KEY = 'token_expires';

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;
  private tokenExpires: number | null = null;
  private refreshPromise: Promise<string | null> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: API_CONFIG.HEADERS,
    });

    // Request interceptor - Add auth token
    this.client.interceptors.request.use(
      async (config) => {
        // Load token if not already loaded
        if (!this.token) {
          await this.loadToken();
        }

        // Add Authorization header if token exists
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - Handle errors and token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiResponse>) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // Check if this is a "No Records" response - treat as success with empty data
        const errorData = error.response?.data;
        const errorMsg = errorData?.status?.msg || '';
        const isNoRecords = errorMsg.includes('No Records') || 
                           errorMsg.includes('no records') || 
                           errorMsg.includes('No records');
        
        if (isNoRecords && error.response?.status === 404) {
          // Return a success response with null data instead of rejecting
          return {
            data: {
              status: {
                rem: 'success' as const,
                msg: errorMsg,
                sys: errorData?.status?.sys || '',
              },
              data: null,
              stamp: errorData?.stamp || new Date().toISOString(),
            },
            status: 200,
            statusText: 'OK',
            headers: error.response.headers,
            config: error.config,
          } as any;
        }

        // Handle 401 Unauthorized - Token expired or invalid
        if (isAuthError(error) && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // Attempt to refresh token
            const newToken = await this.refreshToken();
            if (newToken && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed - clear auth and let error propagate
            await this.clearAuth();
          }
        }

        return Promise.reject(createApiError(error));
      }
    );

    // Initialize - load token from storage
    this.loadToken();
  }

  /**
   * Load token from secure storage
   */
  private async loadToken(): Promise<void> {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const expiresStr = await SecureStore.getItemAsync(TOKEN_EXPIRY_KEY);

      if (token) {
        this.token = token;
        this.tokenExpires = expiresStr ? parseInt(expiresStr, 10) : null;
      }
    } catch (error) {
      console.error('Error loading token:', error);
    }
  }

  /**
   * Set authentication token
   */
  async setToken(token: string, expires: number): Promise<void> {
    try {
      this.token = token;
      this.tokenExpires = expires;
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      await SecureStore.setItemAsync(TOKEN_EXPIRY_KEY, expires.toString());
    } catch (error) {
      console.error('Error saving token:', error);
    }
  }

  /**
   * Clear authentication data
   */
  async clearAuth(): Promise<void> {
    try {
      this.token = null;
      this.tokenExpires = null;
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(TOKEN_EXPIRY_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
    } catch (error) {
      console.error('Error clearing auth:', error);
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(): boolean {
    if (!this.tokenExpires) return true;
    // Add 5 minute buffer before actual expiration
    return Date.now() / 1000 >= this.tokenExpires - 300;
  }

  /**
   * Refresh token (re-login if needed)
   * Note: API doesn't have refresh endpoint, so we'll need to handle this
   * by storing user credentials or prompting re-login
   */
  private async refreshToken(): Promise<string | null> {
    // Prevent multiple simultaneous refresh attempts
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        // Check if we have stored user credentials for auto re-login
        // For now, return null to trigger re-login
        // You can implement credential storage if needed (with user consent)
        return null;
      } catch (error) {
        console.error('Token refresh failed:', error);
        return null;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  /**
   * Make API request
   */
  async request<T = any>(
    endpoint: string,
    payload: Record<string, any> = {},
    options: {
      panel?: string;
      device?: string;
      log?: any;
      options?: { ay?: string; sem?: string; userid?: string };
      classcode?: string;
      filepath?: string;
    } = {}
  ): Promise<ApiResponse<T>> {
    // Check token expiration before request
    if (this.token && this.isTokenExpired()) {
      await this.clearAuth();
      throw createApiError({
        message: 'Session expired. Please login again.',
        status: 401,
      });
    }

    // Build request body
    const body: ApiRequest = {
      payload,
      ...(options.panel && { panel: options.panel }),
      ...(options.device && { device: options.device }),
      ...(options.log && { log: options.log }),
      ...(options.options && { options: options.options }),
      ...(options.classcode && { classcode: options.classcode }),
      ...(options.filepath && { filepath: options.filepath }),
    };

    // Use query parameter for endpoint routing
    // The API expects: lamp.php?request=endpoint
    const url = `${API_CONFIG.BASE_URL}?request=${endpoint}`;

    // Debug logging (remove in production)
    if (__DEV__) {
      console.log('API Request:', {
        url,
        method: 'POST',
        body: JSON.stringify(body, null, 2),
      });
    }

    try {
      const response = await this.client.post<ApiResponse<T>>(url, body);
      return response.data;
    } catch (error) {
      if (__DEV__) {
        console.error('API Error:', error);
      }
      throw createApiError(error);
    }
  }

  /**
   * Upload file(s)
   */
  async uploadFile(
    endpoint: string,
    files: Array<{ uri: string; name: string; type: string }>,
    additionalParams: Record<string, string> = {}
  ): Promise<ApiResponse> {
    // Check token expiration
    if (this.token && this.isTokenExpired()) {
      await this.clearAuth();
      throw createApiError({
        message: 'Session expired. Please login again.',
        status: 401,
      });
    }

    const formData = new FormData();

    // Add files
    files.forEach((file) => {
      formData.append('file[]', {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as any);
    });

    // Add additional parameters
    Object.keys(additionalParams).forEach((key) => {
      formData.append(key, additionalParams[key]);
    });

    const url = `${API_CONFIG.BASE_URL}?request=${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'multipart/form-data',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await this.client.post<ApiResponse>(url, formData, {
        headers,
      });
      return response.data;
    } catch (error) {
      throw createApiError(error);
    }
  }

  /**
   * Get current token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.token && !this.isTokenExpired();
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;

