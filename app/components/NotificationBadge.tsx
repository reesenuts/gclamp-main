/**
 * Notification Badge Component
 * Displays unread notification count
 */

import { View, Text } from 'react-native';
import { useNotifications } from '../hooks/useNotifications';

export const NotificationBadge = () => {
  const { unreadCount } = useNotifications();

  if (unreadCount === 0) return null;

  return (
    <View className="absolute -right-1 -top-1 bg-red-500 rounded-full min-w-[20px] h-5 justify-center items-center px-1.5">
      <Text className="text-white text-xs font-bold">
        {unreadCount > 99 ? '99+' : unreadCount.toString()}
      </Text>
    </View>
  );
};

