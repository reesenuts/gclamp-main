import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
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

  useEffect(() => {
    let isMounted = true;
    const fetchUser = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (user && isMounted) {
          setCurrentUserId(user.id);
        }
      } catch (error) {
        console.error('Error fetching user for notifications:', error);
      }
    };
    fetchUser();
    return () => {
      isMounted = false;
    };
  }, []);

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
      if (!currentUserId) return;
      try {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, is_read: 1 } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
        await notificationService.markAsRead(currentUserId, notificationId);
      } catch (error) {
        console.error('Error marking notification as read:', error);
        fetchNotifications();
      }
    },
    [currentUserId, fetchNotifications]
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
      refetch: fetchNotifications,
    }),
    [notifications, unreadCount, loading, refreshing, refresh, markAsRead, markAllAsRead, fetchNotifications]
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

