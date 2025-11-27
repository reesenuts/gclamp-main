import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { authService } from '../services';
import { Notification, notificationService } from '../services/notification.service';
import { subscribeNotificationUpdates } from '../utils/notificationEvents';

type NotificationContextValue = {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  refreshing: boolean;
  refresh: () => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: number) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
  refetch: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

const dedupeNotifications = (items: Notification[]): Notification[] => {
  const map = new Map<number, Notification>();
  items.forEach((item) => {
    map.set(item.id, item);
  });
  return Array.from(map.values()).sort((a, b) => {
    const aDate = new Date(a.created_at).getTime();
    const bDate = new Date(b.created_at).getTime();
    return bDate - aDate;
  });
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const previousUserIdRef = useRef<string | null>(null);

  // Check for user changes and update accordingly
  const checkUserChange = useCallback(async () => {
    try {
      const user = await authService.getCurrentUser();
      const newUserId = user?.id || null;
      
      // If user has changed, clear state and update
      if (previousUserIdRef.current !== newUserId) {
        // Clear notification state when user changes
        setNotifications([]);
        setUnreadCount(0);
        previousUserIdRef.current = newUserId;
        setCurrentUserId(newUserId);
      } else if (currentUserId !== newUserId) {
        // Update currentUserId if it's different (handles initial load)
        setCurrentUserId(newUserId);
      }
    } catch (error) {
      console.error('Error checking user for notifications:', error);
      // If user check fails, clear state
      if (previousUserIdRef.current !== null) {
        setNotifications([]);
        setUnreadCount(0);
        previousUserIdRef.current = null;
        setCurrentUserId(null);
      }
    }
  }, [currentUserId]);

  // Initial user fetch
  useEffect(() => {
    checkUserChange();
  }, [checkUserChange]);

  // Periodically check for user changes (every 2 seconds) to catch account switches
  // This ensures that when you switch accounts, the notification state is cleared and updated
  useEffect(() => {
    const interval = setInterval(() => {
      checkUserChange();
    }, 2000);

    return () => clearInterval(interval);
  }, [checkUserChange]);

  const setNotificationState = useCallback((items: Notification[]) => {
    const unique = dedupeNotifications(items);
    setNotifications(unique);
    const unread = unique.filter((n) => n.is_read === 0).length;
    setUnreadCount(unread);
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!currentUserId) return;

    setLoading(true);
    try {
      const data = await notificationService.getNotifications(currentUserId);
      setNotificationState(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, setNotificationState]);

  const refresh = useCallback(async () => {
    if (!currentUserId) return;
    setRefreshing(true);
    try {
      const data = await notificationService.getNotifications(currentUserId);
      setNotificationState(data);
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    } finally {
      setRefreshing(false);
    }
  }, [currentUserId, setNotificationState]);

  const markAsRead = useCallback(
    async (notificationId: number) => {
      // Always get fresh user ID to ensure we're using the correct user
      const user = await authService.getCurrentUser();
      if (!user) {
        console.error('Cannot mark notification as read: No user logged in');
        return;
      }
      
      const userId = user.id;
      
      try {
        // Optimistically update UI
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, is_read: 1 } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
        
        // Backend will validate that the notification belongs to this user
        await notificationService.markAsRead(userId, notificationId);
      } catch (error) {
        console.error('Error marking notification as read:', error);
        // Revert optimistic update on error
        fetchNotifications();
      }
    },
    [fetchNotifications]
  );

  const markAllAsRead = useCallback(async () => {
    if (!currentUserId) return;
    try {
      await notificationService.markAllAsRead(currentUserId);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [currentUserId]);

  const deleteNotification = useCallback(
    async (notificationId: number) => {
      if (!currentUserId) return;
      try {
        // Optimistically remove from UI
        setNotifications((prev) => {
          const filtered = prev.filter((n) => n.id !== notificationId);
          const unread = filtered.filter((n) => n.is_read === 0).length;
          setUnreadCount(unread);
          return filtered;
        });
        await notificationService.deleteNotification(currentUserId, notificationId);
      } catch (error) {
        console.error('Error deleting notification:', error);
        // Revert on error by refetching
        fetchNotifications();
      }
    },
    [currentUserId, fetchNotifications]
  );

  const deleteAllNotifications = useCallback(async () => {
    if (!currentUserId) return;
    try {
      // Optimistically clear UI
      setNotifications([]);
      setUnreadCount(0);
      await notificationService.deleteAllNotifications(currentUserId);
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      // Revert on error by refetching
      fetchNotifications();
    }
  }, [currentUserId, fetchNotifications]);

  useEffect(() => {
    if (currentUserId) {
      fetchNotifications();
    }
  }, [currentUserId, fetchNotifications]);

  useEffect(() => {
    const unsubscribe = subscribeNotificationUpdates(() => {
      refresh();
    });
    return () => {
      unsubscribe();
    };
  }, [refresh]);

  const value = useMemo<NotificationContextValue>(
    () => ({
      notifications,
      unreadCount,
      loading,
      refreshing,
      refresh,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      deleteAllNotifications,
      refetch: fetchNotifications,
    }),
    [notifications, unreadCount, loading, refreshing, refresh, markAsRead, markAllAsRead, deleteNotification, deleteAllNotifications, fetchNotifications]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotificationContext = (): NotificationContextValue => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};

