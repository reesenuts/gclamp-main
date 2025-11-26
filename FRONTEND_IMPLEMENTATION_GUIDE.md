# Frontend Notification Implementation - Complete Guide

**Target:** React Native + Expo | **Backend:** MySQL + FCM V1 API | **AI-Optimized**

---

## 🎯 What You Need to Know

The backend automatically creates notifications when faculty posts content. Your job: fetch and display them.

### Backend Architecture
- **Storage:** MySQL database (not Firestore)
- **Push:** FCM V1 API with service account
- **Sync:** API-based (REST endpoints)
- **Cost:** $0 forever

### What Happens
```
Faculty creates post → MySQL notification created → FCM push sent → Your app displays it
```

---

## 📊 Data Schema

### Notification Object (from API)
```typescript
interface Notification {
  id: number;                              // Notification ID
  studno_fld: string;                      // Student ID
  type: 'post' | 'activity' | 'resource';
  title: string;                           // "New Post" | "New Activity" | "New Resource"
  message: string;                         // "New post in Math 101: Introduction to..."
  classcode_fld: string;                   // Class code
  post_id: number | null;                  // Post ID (if type='post')
  activity_id: number | null;              // Activity ID (if type='activity')
  resource_id: number | null;              // Resource ID (if type='resource')
  subjcode_fld: string | null;             // Subject code
  subjdesc_fld: string | null;             // Subject description
  is_read: 0 | 1;                          // 0 = unread, 1 = read
  created_at: string;                      // "2025-11-27 10:30:00"
}
```

### API Response Format
```typescript
interface ApiResponse<T> {
  status: {
    rem: 'success' | 'failed';
    msg: string;
    sys: string;
  };
  data: T;
  stamp: string;
}
```

---

## 🔌 API Endpoints

**Base URL:** `https://your-server.com/testapilamp/student/lamp.php`

### 1. Get Notifications
```http
POST /lamp.php/getnotifications
```

**Request:**
```json
{
  "payload": {
    "p_studno": "2021001",
    "p_limit": 50,
    "p_offset": 0
  }
}
```

**Response:**
```json
{
  "status": { "rem": "success", "msg": "Notifications retrieved" },
  "data": [
    {
      "id": 1,
      "studno_fld": "2021001",
      "type": "post",
      "title": "New Post",
      "message": "New post in Mathematics: Introduction to...",
      "classcode_fld": "MATH101-2025-1",
      "post_id": 123,
      "activity_id": null,
      "resource_id": null,
      "subjcode_fld": "MATH101",
      "subjdesc_fld": "Mathematics",
      "is_read": 0,
      "created_at": "2025-11-27 10:30:00"
    }
  ]
}
```

### 2. Mark as Read
```http
POST /lamp.php/marknotificationread
```

**Request:**
```json
{
  "payload": {
    "p_studno": "2021001",
    "p_notification_id": 1
  }
}
```

### 3. Mark All as Read
```http
POST /lamp.php/markallread
```

**Request:**
```json
{
  "payload": {
    "p_studno": "2021001"
  }
}
```

### 4. Get Unread Count
```http
POST /lamp.php/getunreadcount
```

**Request:**
```json
{
  "payload": {
    "p_studno": "2021001"
  }
}
```

**Response:**
```json
{
  "status": { "rem": "success" },
  "data": { "count": 5 }
}
```

### 5. Register Device for Push
```http
POST /lamp.php/registerdevice
```

**Request:**
```json
{
  "payload": {
    "p_studno": "2021001",
    "p_device_token": "fcm_token_from_firebase",
    "p_platform": "android"
  }
}
```

---

## 💻 Complete Implementation

### 1. Install Dependencies
```bash
npm install @react-native-firebase/app
npm install @react-native-firebase/messaging
```

### 2. API Service (`services/notificationApi.ts`)

```typescript
const API_BASE = 'https://your-server.com/testapilamp/student/lamp.php';

export const notificationApi = {
  getNotifications: async (studno: string, limit = 50, offset = 0) => {
    const response = await fetch(`${API_BASE}/getnotifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payload: { p_studno: studno, p_limit: limit, p_offset: offset }
      })
    });
    const data = await response.json();
    return data.data || [];
  },

  markAsRead: async (studno: string, notificationId: number) => {
    await fetch(`${API_BASE}/marknotificationread`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payload: { p_studno: studno, p_notification_id: notificationId }
      })
    });
  },

  markAllAsRead: async (studno: string) => {
    await fetch(`${API_BASE}/markallread`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload: { p_studno: studno } })
    });
  },

  getUnreadCount: async (studno: string) => {
    const response = await fetch(`${API_BASE}/getunreadcount`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload: { p_studno: studno } })
    });
    const data = await response.json();
    return data.data?.count || 0;
  },

  registerDevice: async (studno: string, deviceToken: string, platform: string) => {
    await fetch(`${API_BASE}/registerdevice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payload: { p_studno: studno, p_device_token: deviceToken, p_platform: platform }
      })
    });
  }
};
```

### 3. Notification Hook (`hooks/useNotifications.ts`)

```typescript
import { useState, useEffect, useCallback } from 'react';
import { notificationApi } from '../services/notificationApi';

export const useNotifications = (studno: string) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!studno) return;
    
    setLoading(true);
    try {
      const data = await notificationApi.getNotifications(studno);
      setNotifications(data);
      setUnreadCount(data.filter((n: any) => n.is_read === 0).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [studno]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      await notificationApi.markAsRead(studno, notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: 1 } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }, [studno]);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationApi.markAllAsRead(studno);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, [studno]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    refreshing,
    refresh,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications
  };
};
```

### 4. FCM Setup (`utils/fcmSetup.ts`)

```typescript
import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import { notificationApi } from '../services/notificationApi';

export const setupFCM = async (studno: string) => {
  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      console.log('FCM permission denied');
      return;
    }

    const token = await messaging().getToken();
    await notificationApi.registerDevice(studno, token, Platform.OS);

    // Foreground notifications
    messaging().onMessage(async remoteMessage => {
      console.log('Foreground notification:', remoteMessage);
      // Refresh notification list or show in-app alert
    });

    // Background notifications
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('Background notification:', remoteMessage);
    });

    // App opened from notification
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('App opened from notification:', remoteMessage);
      // Navigate to content
    });

    // App opened from quit state
    messaging().getInitialNotification().then(remoteMessage => {
      if (remoteMessage) {
        console.log('App opened from quit state:', remoteMessage);
      }
    });

  } catch (error) {
    console.error('FCM setup error:', error);
  }
};
```

### 5. Notification Screen (`screens/NotificationScreen.tsx`)

```typescript
import React from 'react';
import {
  View, FlatList, Text, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator
} from 'react-native';
import { useNotifications } from '../hooks/useNotifications';

const NotificationScreen = ({ navigation, route }) => {
  const { studno } = route.params;
  const { notifications, unreadCount, loading, refreshing, refresh, markAsRead, markAllAsRead } = 
    useNotifications(studno);

  const handlePress = async (notification: any) => {
    await markAsRead(notification.id);

    switch (notification.type) {
      case 'post':
        navigation.navigate('ClassFeed', {
          classcode: notification.classcode_fld,
          postId: notification.post_id
        });
        break;
      case 'activity':
        navigation.navigate('ActivityDetail', {
          classcode: notification.classcode_fld,
          activityId: notification.activity_id
        });
        break;
      case 'resource':
        navigation.navigate('Resources', {
          classcode: notification.classcode_fld,
          resourceId: notification.resource_id
        });
        break;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'post': return '📝';
      case 'activity': return '📋';
      case 'resource': return '📁';
      default: return '🔔';
    }
  };

  if (loading && notifications.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {unreadCount > 0 && (
        <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>
          <Text style={styles.markAllText}>Mark all as read ({unreadCount})</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, item.is_read === 0 && styles.unreadCard]}
            onPress={() => handlePress(item)}
          >
            <Text style={styles.icon}>{getIcon(item.type)}</Text>
            <View style={styles.content}>
              <Text style={[styles.title, item.is_read === 0 && styles.unreadText]}>
                {item.title}
              </Text>
              <Text style={styles.subject}>{item.subjdesc_fld}</Text>
              <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
              <Text style={styles.time}>{formatTime(item.created_at)}</Text>
            </View>
            {item.is_read === 0 && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyText}>No Notifications</Text>
            <Text style={styles.emptySubtext}>You're all caught up!</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  markAllButton: { padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0', alignItems: 'center' },
  markAllText: { color: '#007AFF', fontWeight: '600', fontSize: 16 },
  card: { flexDirection: 'row', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  unreadCard: { backgroundColor: '#f0f8ff' },
  icon: { fontSize: 24, marginRight: 12 },
  content: { flex: 1 },
  title: { fontSize: 16, color: '#333', marginBottom: 4 },
  unreadText: { fontWeight: 'bold' },
  subject: { fontSize: 14, color: '#666', marginBottom: 4 },
  message: { fontSize: 14, color: '#888', marginBottom: 4 },
  time: { fontSize: 12, color: '#aaa' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#007AFF', marginLeft: 8, alignSelf: 'center' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  emptyIcon: { fontSize: 60, marginBottom: 20 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#888' }
});

export default NotificationScreen;
```

### 6. Badge Component (`components/NotificationBadge.tsx`)

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNotifications } from '../hooks/useNotifications';

export const NotificationBadge = ({ studno }: { studno: string }) => {
  const { unreadCount } = useNotifications(studno);

  if (unreadCount === 0) return null;

  return (
    <View style={styles.badge}>
      <Text style={styles.text}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute', right: -6, top: -3,
    backgroundColor: '#FF3B30', borderRadius: 10,
    minWidth: 20, height: 20,
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 5
  },
  text: { color: 'white', fontSize: 12, fontWeight: 'bold' }
});
```

---

## 🚀 Usage

### On App Start/Login
```typescript
import { setupFCM } from './utils/fcmSetup';

useEffect(() => {
  if (loggedInStudentId) {
    setupFCM(loggedInStudentId);
  }
}, [loggedInStudentId]);
```

### In Tab Navigator
```typescript
<Tab.Screen
  name="Notifications"
  component={NotificationScreen}
  options={{
    tabBarIcon: ({ color, size }) => (
      <View>
        <Icon name="bell" size={size} color={color} />
        <NotificationBadge studno={currentStudentId} />
      </View>
    )
  }}
/>
```

---

## ✅ Implementation Checklist

### Setup
- [ ] Install Firebase packages
- [ ] Configure Firebase project (google-services.json / GoogleService-Info.plist)
- [ ] Update API_BASE in notificationApi.ts
- [ ] Create all service/hook/screen/component files

### Testing
- [ ] Login → Device token registered
- [ ] Fetch notifications → List appears
- [ ] Pull to refresh → Latest data loaded
- [ ] Tap notification → Navigate to content
- [ ] Mark as read → Badge decrements
- [ ] FCM push received (when app closed)
- [ ] Check on another device → Read status synced

---

## 🔍 Key Points

### Data Sync
- **MySQL-based** - NOT Firestore (call API to sync)
- **Cross-device** - Read on phone, synced on tablet (via API)
- **Persistent** - Survives app reinstall (MySQL backend)

### Navigation Map
```typescript
{
  'post': ['ClassFeed', { classcode, postId }],
  'activity': ['ActivityDetail', { classcode, activityId }],
  'resource': ['Resources', { classcode, resourceId }]
}
```

### API Response Structure
All endpoints return:
```typescript
{
  status: { rem: 'success' | 'failed', msg: string, sys: string },
  data: any,
  stamp: string
}
```

---

## 🚨 Troubleshooting

| Issue | Solution |
|-------|----------|
| No notifications | Check API_BASE URL, verify studno format |
| Not updating | Call `refresh()` or `refetch()` |
| Badge not showing | Verify unreadCount > 0, check is_read === 0 |
| FCM not working | Check device token registered, permissions granted |
| Navigation fails | Verify screen names match your navigation setup |

---

## 💡 Backend Info (For Context)

**Backend automatically creates notifications when:**
- Faculty creates post via `addclasspost`
- Faculty creates activity via `addclassactivity`
- Faculty creates resource via `addclassresource`

**Backend handles:**
- Saving to MySQL
- Sending FCM push (V1 API)
- Fetching students in class
- Creating individual notifications

**You only need to:**
- Fetch via API
- Display in list
- Mark as read
- Handle navigation

---

**Version:** 1.0 (MySQL + FCM V1)  
**Backend:** Ready & Working ✅  
**Cost:** $0 Forever  
**Your Job:** Implement the 6 files above

