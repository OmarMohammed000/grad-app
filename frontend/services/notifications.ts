import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import api from './api';
import Toast from 'react-native-toast-message';

// Type declaration for browser Notification API (web only)
declare global {
  interface Window {
    Notification: typeof Notification;
  }
}

// Configure how notifications are handled when app is in foreground (mobile only)

export interface NotificationData {
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: boolean;
  badge?: number;
}

export class NotificationService {
  private static expoPushToken: string | null = null;

  /**
   * Request notification permissions
   * Returns true if granted, false otherwise
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      // Web platform uses browser Notification API
      if (Platform.OS === 'web') {
        if (!('Notification' in window)) {
          Toast.show({
            type: 'error',
            text1: 'Not Supported',
            text2: 'Your browser does not support notifications.',
          });
          return false;
        }

        // Check existing permission
        if (Notification.permission === 'granted') {
          return true;
        }

        // Request permission
        const permission = await Notification.requestPermission();

        if (permission === 'granted') {
          return true;
        } else {
          Toast.show({
            type: 'info',
            text1: 'Notifications Disabled',
            text2: 'Please allow notifications in your browser settings.',
          });
          return false;
        }
      }

      // Mobile platform uses expo-notifications
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        Toast.show({
          type: 'info',
          text1: 'Notifications Disabled',
          text2: 'Please enable notifications in your device settings.',
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Get Expo Push Token for this device
   * This token is used to send push notifications to this device
   * Note: Web push tokens require Web Push API setup (service worker, etc.)
   */
  static async getExpoPushToken(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        // Web push requires Web Push API and service worker setup
        // For now, return null as web push is more complex
        console.warn('Web push tokens require additional setup (service worker, etc.)');
        return null;
      }

      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      // Get or generate push token
      if (this.expoPushToken) {
        return this.expoPushToken;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-expo-project-id', // Replace with your Expo project ID
      });

      this.expoPushToken = tokenData.data;
      return this.expoPushToken;
    } catch (error) {
      console.error('Error getting Expo push token:', error);
      return null;
    }
  }

  /**
   * Register device token with backend
   * Call this after login or when token changes
   */
  static async registerDeviceToken(userId: string): Promise<boolean> {
    try {
      const token = await this.getExpoPushToken();
      if (!token) {
        return false;
      }

      // Send token to backend to store for this user
      await api.post('/notifications/register', {
        userId,
        expoPushToken: token,
        platform: Platform.OS,
      });

      return true;
    } catch (error: any) {
      console.error('Error registering device token:', error);
      return false;
    }
  }

  /**
   * Unregister device token (on logout)
   */
  static async unregisterDeviceToken(): Promise<void> {
    try {
      const token = await this.getExpoPushToken();
      if (!token) {
        return;
      }

      await api.post('/notifications/unregister', {
        expoPushToken: token,
      });

      this.expoPushToken = null;
    } catch (error) {
      console.error('Error unregistering device token:', error);
    }
  }

  /**
   * Schedule a local notification
   * Useful for reminders, task deadlines, etc.
   */
  static async scheduleLocalNotification(
    notification: NotificationData,
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Notification permissions not granted');
      }

      // Web platform uses browser Notification API
      if (Platform.OS === 'web') {
        // Calculate delay in milliseconds
        let delay = 0;
        if (trigger) {
          if ('seconds' in trigger) {
            delay = trigger.seconds * 1000;
          } else if ('date' in trigger && trigger.date) {
            delay = new Date(trigger.date).getTime() - Date.now();
          }
        }

        // Create notification with delay
        const showNotification = () => {
          const browserNotification = new Notification(notification.title, {
            body: notification.body,
            icon: '/favicon.png', // You can customize this
            badge: '/favicon.png',
            tag: notification.data?.id || `notification-${Date.now()}`,
            data: notification.data || {},
          });

          // Handle click
          browserNotification.onclick = () => {
            window.focus();
            browserNotification.close();
          };

          return browserNotification;
        };

        if (delay > 0) {
          // Schedule for later
          setTimeout(showNotification, delay);
          return `web-notification-${Date.now()}-${delay}`;
        } else {
          // Show immediately
          showNotification();
          return `web-notification-${Date.now()}`;
        }
      }

      // Mobile platform uses expo-notifications
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          sound: notification.sound !== false,
          badge: notification.badge,
        },
        trigger: trigger || null, // null = show immediately
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw error;
    }
  }

  /**
   * Cancel a scheduled notification
   * Note: On web, scheduled notifications cannot be cancelled once set with setTimeout
   */
  static async cancelNotification(notificationId: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // Web notifications scheduled with setTimeout cannot be cancelled
        // This is a limitation of the browser Notification API
        console.warn('Cannot cancel scheduled web notifications');
        return;
      }
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  /**
   * Cancel all scheduled notifications
   * Note: On web, scheduled notifications cannot be cancelled once set with setTimeout
   */
  static async cancelAllNotifications(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // Web notifications scheduled with setTimeout cannot be cancelled
        console.warn('Cannot cancel scheduled web notifications');
        return;
      }
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }

  /**
   * Get all scheduled notifications
   * Note: On web, this is not supported as we use setTimeout
   */
  static async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      if (Platform.OS === 'web') {
        // Web notifications scheduled with setTimeout cannot be queried
        console.warn('Cannot get scheduled web notifications');
        return [];
      }
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Set notification badge count (iOS only)
   */
  static async setBadgeCount(count: number): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        await Notifications.setBadgeCountAsync(count);
      }
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  }

  /**
   * Clear notification badge
   */
  static async clearBadge(): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(0);
    } catch (error) {
      console.error('Error clearing badge:', error);
    }
  }

  /**
   * Add notification received listener
   * Called when a notification is received (foreground or background)
   */
  static addNotificationReceivedListener(
    listener: (notification: Notifications.Notification) => void
  ) {
    return Notifications.addNotificationReceivedListener(listener);
  }

  /**
   * Add notification response listener
   * Called when user taps on a notification
   */
  static addNotificationResponseReceivedListener(
    listener: (response: Notifications.NotificationResponse) => void
  ) {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }

  /**
   * Remove notification listener
   */
  static removeNotificationSubscription(
    subscription: { remove: () => void }
  ): void {
    subscription.remove();
  }
}

export default NotificationService;

