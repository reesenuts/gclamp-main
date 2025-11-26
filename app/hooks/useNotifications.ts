/**
 * Notification Hook
 * Manages notification state and operations
 */

import { useCallback, useEffect, useState } from 'react';
import { authService } from '../services';
import { Notification, notificationService } from '../services/notification.service';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Get current user ID
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (user) {
          setCurrentUserId(user.id);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    fetchUser();
  }, []);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!currentUserId) return;

    setLoading(true);
    try {
      const data = await notificationService.getNotifications(currentUserId);
      // Remove duplicates by ID before setting state
      const uniqueNotifications = Array.from(
        new Map(data.map((n) => [n.id, n])).values()
      );
      setNotifications(uniqueNotifications);
      const unread = uniqueNotifications.filter((n) => n.is_read === 0).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  // Refresh notifications
  const refresh = useCallback(async () => {
    if (!currentUserId) return;

    setRefreshing(true);
    try {
      const data = await notificationService.getNotifications(currentUserId);
      // Remove duplicates by ID before setting state
      const uniqueNotifications = Array.from(
        new Map(data.map((n) => [n.id, n])).values()
      );
      setNotifications(uniqueNotifications);
      const unread = uniqueNotifications.filter((n) => n.is_read === 0).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    } finally {
      setRefreshing(false);
    }
  }, [currentUserId]);

  // Mark notification as read
  const markAsRead = useCallback(
    async (notificationId: number) => {
      if (!currentUserId) return;

      try {
        // Optimistically update UI first
        setNotifications((prev) => {
          // Check if notification already exists and is being updated
          const exists = prev.find((n) => n.id === notificationId);
          if (!exists) return prev; // Don't add if it doesn't exist
          
          // Update the notification without duplicating
          return prev.map((n) => (n.id === notificationId ? { ...n, is_read: 1 } : n));
        });
        setUnreadCount((prev) => Math.max(0, prev - 1));

        // Then update on backend
        await notificationService.markAsRead(currentUserId, notificationId);
      } catch (error) {
        console.error('Error marking as read:', error);
        // Revert on error - refetch to get correct state
        if (currentUserId) {
          fetchNotifications();
        }
      }
    },
    [currentUserId, fetchNotifications]
  );

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!currentUserId) return;

    try {
      await notificationService.markAllAsRead(currentUserId);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, [currentUserId]);

  // Fetch notifications when user ID is available
  useEffect(() => {
    if (currentUserId) {
      fetchNotifications();
    }
  }, [currentUserId, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    refreshing,
    refresh,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
};

