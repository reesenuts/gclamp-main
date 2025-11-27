/**
 * Notification Service
 * Handles notification-related API calls
 */

import { ApiResponse } from '../types/api';
import { apiClient } from './api/client';

export interface Notification {
  id: number;
  studno_fld: string;
  type: 'post' | 'activity' | 'resource';
  title: string;
  message: string;
  classcode_fld: string;
  post_id: number | null;
  activity_id: number | null;
  resource_id: number | null;
  subjcode_fld: string | null;
  subjdesc_fld: string | null;
  is_read: 0 | 1;
  created_at: string;
}

class NotificationService {
  /**
   * Get notifications for a student
   */
  async getNotifications(
    studno: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Notification[]> {
    const response = await apiClient.request<Notification[]>('getnotifications', {
      p_studno: studno,
      p_limit: limit,
      p_offset: offset,
    });

    if (response.status.rem !== 'success' || !response.data) {
      return [];
    }

    return Array.isArray(response.data) ? response.data : [];
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(studno: string, notificationId: number): Promise<void> {
    await apiClient.request('marknotificationread', {
      p_studno: studno,
      p_notification_id: notificationId,
    });
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(studno: string): Promise<void> {
    await apiClient.request('markallread', {
      p_studno: studno,
    });
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(studno: string): Promise<number> {
    const response = await apiClient.request<{ count: number }>('getunreadcount', {
      p_studno: studno,
    });

    if (response.status.rem !== 'success' || !response.data) {
      return 0;
    }

    return response.data.count || 0;
  }

  /**
   * Register device for push notifications
   */
  async registerDevice(
    studno: string,
    deviceToken: string,
    platform: string
  ): Promise<void> {
    await apiClient.request('registerdevice', {
      p_studno: studno,
      p_device_token: deviceToken,
      p_platform: platform,
    });
  }

  /**
   * Delete a single notification
   */
  async deleteNotification(studno: string, notificationId: number): Promise<void> {
    await apiClient.request('deletenotification', {
      p_studno: studno,
      p_notification_id: notificationId,
    });
  }

  /**
   * Delete all notifications for a student
   */
  async deleteAllNotifications(studno: string): Promise<void> {
    await apiClient.request('deleteallnotifications', {
      p_studno: studno,
    });
  }
}

export const notificationService = new NotificationService();
export default notificationService;

