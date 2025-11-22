/**
 * Authentication Service
 * Handles user authentication, login, logout, and token management
 */

import * as SecureStore from 'expo-secure-store';
import { LoginCredentials, User } from '../types/api';
import { getErrorMessage } from '../utils/errorHandler';
import { apiClient } from './api/client';

const USER_KEY = 'auth_user';

class AuthService {
  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<User> {
    try {
      const response = await apiClient.request<User>('userlogin', {
        username: credentials.username,
        password: credentials.password,
      }, {
        panel: credentials.panel,
        device: credentials.device,
      });

      if (response.status.rem === 'success' && response.data) {
        const user = response.data;

        // Store token
        await apiClient.setToken(user.key.token, user.key.expires);

        // Store user data
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));

        return user;
      }

      throw new Error(response.status.msg || 'Login failed');
    } catch (error: any) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    await apiClient.clearAuth();
  }

  /**
   * Get current user from storage
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const userStr = await SecureStore.getItemAsync(USER_KEY);
      if (userStr) {
        return JSON.parse(userStr) as User;
      }
      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    return apiClient.isAuthenticated();
  }

  /**
   * Update stored user data
   */
  async updateUser(user: User): Promise<void> {
    try {
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Error updating user:', error);
    }
  }

  /**
   * Clear all authentication data
   */
  async clearAll(): Promise<void> {
    await apiClient.clearAuth();
  }
}

export const authService = new AuthService();
export default authService;

