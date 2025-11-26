/**
 * FCM Setup Utility
 * Configures Expo Notifications for Firebase Cloud Messaging
 * 
 * NOTE: Push notifications require a development build (not Expo Go)
 * See: https://docs.expo.dev/develop/development-builds/introduction/
 */

import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { notificationService } from '../services/notification.service';
import { authService } from '../services';

// Check if running in Expo Go
// In Expo Go, appOwnership is 'expo', in development builds it's 'standalone' or null
const isExpoGo = Constants.appOwnership === 'expo';

/**
 * Setup FCM and register device for push notifications
 * 
 * Note: This will gracefully skip in Expo Go since push notifications
 * are not supported. The notification list will still work via API calls.
 */
export const setupFCM = async (): Promise<void> => {
  // Skip push notification setup in Expo Go
  if (isExpoGo) {
    console.log('Push notifications not available in Expo Go. Use a development build for push notifications.');
    console.log('Notification list will still work via API calls.');
    return;
  }

  try {
    // Configure notification handler (only if not in Expo Go)
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    // Get current user
    const user = await authService.getCurrentUser();
    if (!user) {
      console.log('No user logged in, skipping FCM setup');
      return;
    }

    // Request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Notification permission denied');
      return;
    }

    // Get device token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: 'gclamp-mobile', // Your Firebase project ID
    });

    const deviceToken = tokenData.data;

    // Register device with backend
    await notificationService.registerDevice(
      user.id,
      deviceToken,
      Platform.OS
    );

    console.log('Device registered for push notifications:', deviceToken);

    // Set up notification listeners
    setupNotificationListeners();
  } catch (error: any) {
    // Handle specific Expo Go error gracefully
    if (
      error?.message?.includes('Expo Go') ||
      error?.message?.includes('development build') ||
      error?.message?.includes('was removed from Expo Go')
    ) {
      console.log('Push notifications require a development build. Skipping FCM setup.');
      console.log('Notification list will still work via API calls.');
      return;
    }
    console.error('FCM setup error:', error);
  }
};

/**
 * Setup notification event listeners
 * Only sets up listeners if not in Expo Go
 */
const setupNotificationListeners = () => {
  if (isExpoGo) {
    return; // Skip in Expo Go
  }

  // Foreground notifications
  Notifications.addNotificationReceivedListener((notification) => {
    console.log('Foreground notification received:', notification);
    // You can show an in-app alert or update UI here
  });

  // Notification tapped (app opened from notification)
  Notifications.addNotificationResponseReceivedListener((response) => {
    console.log('Notification tapped:', response);
    const data = response.notification.request.content.data;
    
    // Handle navigation based on notification data
    // This will be handled in the app's root layout or navigation
    if (data?.type && data?.classcode_fld) {
      // Navigate to appropriate screen
      // Navigation logic will be handled in the app router
    }
  });
};

/**
 * Get the last notification that opened the app
 */
export const getInitialNotification = async () => {
  const response = await Notifications.getLastNotificationResponseAsync();
  return response;
};

