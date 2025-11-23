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
   * Download file as binary
   */
  async downloadFileBinary(filepath: string): Promise<{ data: string; mimeType: string }> {
    // Check token expiration
    if (this.token && this.isTokenExpired()) {
      await this.clearAuth();
      throw createApiError({
        message: 'Session expired. Please login again.',
        status: 401,
      });
    }

    const body: ApiRequest = {
      payload: { filepath },
    };

    const url = `${API_CONFIG.BASE_URL}?request=download`;

    const headers: Record<string, string> = {};
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      // Request binary data as arraybuffer (React Native compatible)
      const response = await this.client.post(url, body, {
        headers,
        responseType: 'arraybuffer',
      });

      // Convert arraybuffer to base64 for React Native
      const arrayBuffer = response.data as ArrayBuffer;
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64data = btoa(binary);

      // Try to determine MIME type from file extension
      const ext = filepath.split('.').pop()?.toLowerCase() || '';
      const mimeTypes: Record<string, string> = {
        pdf: 'application/pdf',
        doc: 'application/msword',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ppt: 'application/vnd.ms-powerpoint',
        pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        xls: 'application/vnd.ms-excel',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        txt: 'text/plain',
      };
      const mimeType = mimeTypes[ext] || 'application/octet-stream';

      return { data: base64data, mimeType };
    } catch (error) {
      throw createApiError(error);
    }
  }

  /**
   * Upload file(s)
   * Based on Postman guide: upload/{acadyear}/{sem}/{userid}
   * Uses form-data with file[] field name
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

    // Add files - React Native FormData format
    // Based on Postman guide: Key should be 'file[]' (with brackets)
    // In React Native, FormData works differently - we need to use indexed keys
    // PHP expects $_FILES['file']['tmp_name'][0], $_FILES['file']['tmp_name'][1], etc.
    // Try using 'file[0]', 'file[1]' format which React Native handles better
    files.forEach((file, index) => {
      const fileUri = file.uri;
      const fileName = file.name;
      const fileType = file.type || 'application/octet-stream';
      
      // Log file details for debugging
      console.log(`Adding file ${index + 1} to FormData:`, {
        uri: fileUri,
        name: fileName,
        type: fileType,
      });
      
      // React Native FormData format
      // The file object must be a plain object with uri, name, and type
      // Try using indexed format 'file[0]', 'file[1]' which React Native handles better
      const fileObject = {
        uri: fileUri,
        name: fileName,
        type: fileType,
      };
      
      // React Native FormData: Use 'file[]' as key (matches Postman guide exactly)
      // The file object must be: { uri, name, type }
      // When multiple files are appended with 'file[]', PHP should receive them as array
      formData.append('file[]', fileObject as any);
    });
    
    // Log FormData contents (for debugging - FormData doesn't serialize well)
    console.log('FormData created with', files.length, 'file(s)');

    // Add additional parameters
    Object.keys(additionalParams).forEach((key) => {
      formData.append(key, additionalParams[key]);
    });

    // Build URL - endpoint format: upload/{acadyear}/{sem}/{userid}
    // Based on Postman guide, the URL is: http://gclamp/testapilamp/student/upload/2024-2025/1/STUDENT123
    // This suggests it might be a direct endpoint, not through lamp.php router
    // However, the routes show it goes through lamp.php with ?request=upload/...
    // For multipart/form-data, PHP automatically populates $_FILES regardless of routing
    // Try using the router approach first (as that's what the code shows)
    const url = `${API_CONFIG.BASE_URL}?request=${endpoint}`;
    
    console.log('Upload URL:', url);
    console.log('Endpoint:', endpoint);
    
    // Don't set Content-Type manually - axios will set it with boundary automatically
    // This is critical for multipart/form-data uploads
    const headers: Record<string, string> = {};

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      console.log('Upload request:', {
        url,
        fileCount: files.length,
        fileNames: files.map(f => f.name),
        endpoint,
        hasAuth: !!this.token,
      });

      // Use fetch instead of axios for file uploads in React Native
      // fetch handles FormData natively and correctly in React Native
      // axios might have issues with React Native FormData polyfill
      const fetchHeaders: HeadersInit = {};
      
      if (this.token) {
        fetchHeaders['Authorization'] = `Bearer ${this.token}`;
      }
      
      // Don't set Content-Type - fetch will set it automatically with boundary
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        headers: fetchHeaders,
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }
      
      const responseData: ApiResponse = await response.json();
      
      console.log('Upload response received:', {
        status: responseData.status?.rem,
        message: responseData.status?.msg,
        hasFilepath: !!responseData.data?.filepath,
        filepath: responseData.data?.filepath,
        fullData: responseData.data,
      });
      
      return responseData;
    } catch (error) {
      console.error('Upload error details:', {
        message: (error as any)?.message,
        error,
        url,
      });
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

