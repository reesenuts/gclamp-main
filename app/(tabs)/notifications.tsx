import { router, useFocusEffect } from "expo-router";
import { Books, FolderSimple, Newspaper } from "phosphor-react-native";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useNotifications } from "../hooks/useNotifications";
import { Notification } from "../services/notification.service";
import { authService, generalService, lampService } from "../services";
import { SettingsResponse, StudentClass } from "../types/api";

type ClassInfo = {
  code: string;
  name: string;
  instructor: string;
  schedule: string;
  time: string;
  room: string;
};

const formatDaySchedule = (dayFld: string): string => {
  if (!dayFld) return '';
  const dayMap: Record<string, string> = {
    Mon: 'M',
    Tue: 'T',
    Wed: 'W',
    Thu: 'Th',
    Fri: 'F',
    Sat: 'Sat',
    Sun: 'Sun',
  };
  return dayFld
    .split(',')
    .map((day) => dayMap[day.trim()] || day.trim())
    .join('');
};

const formatTimeRange = (start?: string, end?: string): string => {
  if (!start && !end) return '';
  if (!start) return end || '';
  if (!end) return start;
  return `${start} - ${end}`;
};

const transformClassToInfo = (cls: StudentClass, _index: number): ClassInfo => {
  return {
    code: cls.subjcode_fld || '',
    name: cls.subjdesc_fld || '',
    instructor: cls.faculty_fld?.trim() || '',
    schedule: formatDaySchedule(cls.day_fld || ''),
    time: formatTimeRange(cls.starttime_fld, cls.endtime_fld),
    room: cls.room_fld || '',
  };
};

// Format timestamp to relative time
const formatTimestamp = (dateString: string): string => {
  if (!dateString) return 'Just now';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else if (hours > 0) {
      return `${hours}h ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return 'Just now';
    }
  } catch {
    return dateString;
  }
};

// Get icon for notification type
const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'activity':
      return Books;
    case 'resource':
      return FolderSimple;
    case 'post':
      return Newspaper;
    default:
      return Newspaper;
  }
};

// Get icon color for notification type
const getNotificationIconColor = (type: Notification['type']) => {
  switch (type) {
    case 'activity':
      return '#4285F4';
    case 'resource':
      return '#10B981';
    case 'post':
      return '#3B82F6';
    default:
      return '#999999';
  }
};

export default function Notifications() {
  const {
    notifications,
    unreadCount,
    loading,
    refreshing,
    refresh,
    markAsRead,
    markAllAsRead,
  } = useNotifications();
  const [classInfoMap, setClassInfoMap] = useState<Record<string, ClassInfo>>({});
  const [loadingClasses, setLoadingClasses] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchClassInfo = async () => {
      try {
        setLoadingClasses(true);
        const user = await authService.getCurrentUser();
        if (!user) {
          return;
        }

        const settingsResponse = await generalService.getSettings();
        if (settingsResponse.status.rem !== 'success' || !settingsResponse.data) {
          return;
        }

        const settings = settingsResponse.data as SettingsResponse;
        const academicYear = settings.setting?.acadyear_fld || '';
        const semester = settings.setting?.sem_fld || '';

        if (!academicYear || !semester) {
          return;
        }

        const classesResponse = await lampService.getStudentClasses({
          p_id: user.id,
          p_ay: academicYear,
          p_sem: String(semester),
        });

        if (classesResponse.status.rem !== 'success' || !classesResponse.data) {
          return;
        }

        const classes = Array.isArray(classesResponse.data)
          ? (classesResponse.data as StudentClass[])
          : [];

        const map: Record<string, ClassInfo> = {};
        classes.forEach((cls, index) => {
          const classcode = cls.classcode_fld || cls.recno_fld?.toString();
          if (!classcode) return;
          map[classcode] = transformClassToInfo(cls, index);
        });

        if (isMounted) {
          setClassInfoMap(map);
        }
      } catch (error) {
        console.error('Error loading class info for notifications:', error);
      } finally {
        if (isMounted) {
          setLoadingClasses(false);
        }
      }
    };

    fetchClassInfo();
    return () => {
      isMounted = false;
    };
  }, []);

  // Refresh on focus (but debounce to avoid conflicts with markAsRead)
  useFocusEffect(
    useCallback(() => {
      // Small delay to avoid race conditions with markAsRead
      const timeoutId = setTimeout(() => {
        refresh();
      }, 300);
      return () => clearTimeout(timeoutId);
    }, [refresh])
  );

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (notification.is_read === 0) {
      await markAsRead(notification.id);
    }

    // Navigate based on notification type
    const { type, classcode_fld, post_id, activity_id, resource_id, subjcode_fld, subjdesc_fld } = notification;

    switch (type) {
      case 'post':
        if (post_id && classcode_fld) {
          const classInfo = classInfoMap[classcode_fld];
          router.push({
            pathname: '/components/classes/class-details' as any,
            params: {
              code: classInfo?.code || subjcode_fld || '',
              classcode: classcode_fld,
              name: classInfo?.name || subjdesc_fld || '',
              instructor: classInfo?.instructor || '',
              schedule: classInfo?.schedule || '',
              time: classInfo?.time || '',
              room: classInfo?.room || '',
              color: '#3b82f6',
              initialTab: 'feed',
              highlightPostId: post_id.toString(),
            },
          });
        }
        break;

      case 'activity':
        if (activity_id && classcode_fld) {
          const classInfo = classInfoMap[classcode_fld];
          router.push({
            pathname: '/components/classes/activities/activity-detail' as any,
            params: {
              activityId: activity_id.toString(),
              classcode: classcode_fld,
              courseCode: classInfo?.code || subjcode_fld || '',
              courseName: classInfo?.name || subjdesc_fld || '',
            },
          });
        }
        break;

      case 'resource':
        if (classcode_fld) {
          const classInfo = classInfoMap[classcode_fld];
          router.push({
            pathname: '/components/classes/class-details' as any,
            params: {
              code: classInfo?.code || subjcode_fld || '',
              classcode: classcode_fld,
              name: classInfo?.name || subjdesc_fld || '',
              instructor: classInfo?.instructor || '',
              schedule: classInfo?.schedule || '',
              time: classInfo?.time || '',
              room: classInfo?.room || '',
              color: '#3b82f6',
              initialTab: 'resources',
            },
          });
        }
        break;
    }
  };

  // Group notifications by read status and time
  const groupNotifications = () => {
    const unread = notifications.filter((n) => n.is_read === 0);
    const read = notifications.filter((n) => n.is_read === 1);

    // Group read notifications by time
    // Today = notifications from today (minutes/hours ago, or same day)
    const today = read.filter((n) => {
      const timestamp = formatTimestamp(n.created_at).toLowerCase();
      return timestamp.includes('m ago') || timestamp.includes('h ago') || timestamp === 'just now';
    });

    // Earlier = all other read notifications (days ago or date strings)
    const earlier = read.filter((n) => {
      const timestamp = formatTimestamp(n.created_at).toLowerCase();
      return !timestamp.includes('m ago') && 
             !timestamp.includes('h ago') && 
             timestamp !== 'just now';
    });

    return {
      new: unread,
      today,
      earlier,
    };
  };

  const groupedNotifications = groupNotifications();

  // Render notification item
  const renderNotificationItem = (notification: Notification) => {
    const Icon = getNotificationIcon(notification.type);
    const iconColor = getNotificationIconColor(notification.type);
    const isUnread = notification.is_read === 0;

    return (
      <Pressable
        key={notification.id}
        onPress={() => handleNotificationClick(notification)}
        className={`flex-row items-start py-3 px-6 border-b border-crystalBell active:opacity-80 ${
          isUnread ? 'bg-seljukBlue/5' : ''
        }`}
      >
        {/* Icon */}
        <View
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: `${iconColor}15` }}
        >
          <Icon size={20} color={iconColor} weight="fill" />
        </View>

        {/* Content */}
        <View className="flex-1 mr-3">
          <View className="flex-row items-center">
            <Text className="text-twilightZone font-semibold text-base flex-1">
              {notification.subjdesc_fld || notification.title}
            </Text>
            {isUnread && (
              <View className="w-2 h-2 rounded-full bg-seljukBlue ml-2" />
            )}
          </View>
          <Text className="text-millionGrey text-sm mb-1" numberOfLines={3}>
            {notification.message}
          </Text>
          <Text className="text-millionGrey text-xs">
            {formatTimestamp(notification.created_at)}
          </Text>
        </View>
      </Pressable>
    );
  };

  if (loading && notifications.length === 0) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#4285F4" />
        <Text className="text-millionGrey mt-4">Loading notifications...</Text>
      </View>
    );
  }

  if (loadingClasses && Object.keys(classInfoMap).length === 0) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#4285F4" />
        <Text className="text-millionGrey mt-4">Loading classes...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Mark all as read button */}
      {unreadCount > 0 && (
        <Pressable
          onPress={markAllAsRead}
          className="px-6 py-3 bg-white border-b border-crystalBell active:opacity-80"
        >
          <Text className="text-seljukBlue font-semibold text-base text-center">
            Mark all as read ({unreadCount})
          </Text>
        </Pressable>
      )}

      {/* Notifications list */}
      {notifications.length > 0 ? (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} />
          }
        >
          <View className="pb-6">
            {/* New section */}
            {groupedNotifications.new.length > 0 && (
              <>
                <View className="px-6 py-2">
                  <Text className="text-twilightZone text-xl font-bold">New</Text>
                </View>
                {groupedNotifications.new.map(renderNotificationItem)}
              </>
            )}

            {/* Today section */}
            {groupedNotifications.today.length > 0 && (
              <>
                <View className="px-6 py-2">
                  <Text className="text-twilightZone text-xl font-bold mt-2">Today</Text>
                </View>
                {groupedNotifications.today.map(renderNotificationItem)}
              </>
            )}

            {/* Earlier section */}
            {groupedNotifications.earlier.length > 0 && (
              <>
                <View className="px-6 py-2">
                  <Text className="text-twilightZone text-xl font-bold mt-2">Earlier</Text>
                </View>
                {groupedNotifications.earlier.map(renderNotificationItem)}
              </>
            )}
          </View>
        </ScrollView>
      ) : (
        <View className="flex-1 items-center justify-center">
          <Text className="text-millionGrey text-base">No notifications</Text>
          <Text className="text-millionGrey text-sm mt-2">You're all caught up!</Text>
        </View>
      )}
    </View>
  );
}
