/**
 * Notification Hook
 * Manages notification state and operations
 */

import { useNotificationContext } from '../contexts/NotificationContext';

export const useNotifications = () => {
  return useNotificationContext();
};

