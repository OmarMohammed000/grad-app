import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import NotificationService from '@/services/notifications';
import Toast from 'react-native-toast-message';
import * as Notifications from 'expo-notifications';

/**
 * Test component for notifications
 * Useful for testing notifications on web and mobile
 */
export function NotificationTestButton() {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');

  const checkPermissions = async () => {
    try {
      const hasPermission = await NotificationService.requestPermissions();
      setPermissionStatus(hasPermission ? 'granted' : 'denied');

      if (hasPermission) {
        Toast.show({
          type: 'success',
          text1: 'Permissions Granted',
          text2: 'You can now receive notifications!',
        });
      } else {
        Toast.show({
          type: 'info',
          text1: 'Permissions Denied',
          text2: Platform.OS === 'web'
            ? 'Please allow notifications in your browser settings.'
            : 'Please enable notifications in your device settings.',
        });
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to check notification permissions.',
      });
    }
  };

  const testImmediateNotification = async () => {
    setLoading(true);
    try {
      const hasPermission = await NotificationService.requestPermissions();
      if (!hasPermission) {
        Toast.show({
          type: 'error',
          text1: 'Permission Required',
          text2: 'Please grant notification permissions first.'
        });
        setLoading(false);
        return;
      }

      await NotificationService.scheduleLocalNotification({
        title: 'Test Notification',
        body: 'This is a test notification! 🎉',
        data: { test: true },
        sound: true,
      });

      Toast.show({
        type: 'success',
        text1: 'Notification Sent',
        text2: 'Check your notifications!',
      });
    } catch (error: any) {
      console.error('Error sending notification:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to send notification.',
      });
    } finally {
      setLoading(false);
    }
  };

  const testScheduledNotification = async () => {
    setLoading(true);
    try {
      const hasPermission = await NotificationService.requestPermissions();
      if (!hasPermission) {
        Toast.show({
          type: 'error',
          text1: 'Permission Required',
          text2: 'Please grant notification permissions first.'
        });
        setLoading(false);
        return;
      }

      // Schedule notification for 5 seconds from now
      await NotificationService.scheduleLocalNotification(
        {
          title: 'Scheduled Notification',
          body: 'This notification was scheduled 5 seconds ago! ⏰',
          data: { test: true, scheduled: true },
          sound: true,
        },
        {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 5,
          repeats: false,
        }
      );

      Toast.show({
        type: 'success',
        text1: 'Notification Scheduled',
        text2: 'You will receive a notification in 5 seconds!',
      });
    } catch (error: any) {
      console.error('Error scheduling notification:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to schedule notification.',
      });
    } finally {
      setLoading(false);
    }
  };

  const testMultipleNotifications = async () => {
    setLoading(true);
    try {
      const hasPermission = await NotificationService.requestPermissions();
      if (!hasPermission) {
        Toast.show({
          type: 'error',
          text1: 'Permission Required',
          text2: 'Please grant notification permissions first.'
        });
        setLoading(false);
        return;
      }

      // Send 3 notifications with slight delays
      for (let i = 1; i <= 3; i++) {
        await NotificationService.scheduleLocalNotification(
          {
            title: `Notification ${i}`,
            body: `This is notification number ${i} of 3! 🔔`,
            data: { test: true, number: i },
            sound: true,
          },
          {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: i * 2,
            repeats: false,
          }
        );
      }

      Toast.show({
        type: 'success',
        text1: 'Notifications Scheduled',
        text2: 'You will receive 3 notifications!',
      });
    } catch (error: any) {
      console.error('Error sending multiple notifications:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to send notifications.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.card }, theme.shadows.sm]}>
      <View style={styles.header}>
        <Ionicons name="notifications-outline" size={24} color={theme.colors.primary} />
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Notification Testing
        </Text>
      </View>

      <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
        {Platform.OS === 'web'
          ? 'Test notifications in your browser. Make sure to allow notifications when prompted.'
          : 'Test notifications on your device.'}
      </Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={checkPermissions}
          disabled={loading}
        >
          <Ionicons name="shield-checkmark-outline" size={20} color="#ffffff" />
          <Text style={styles.buttonText}>Check Permissions</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.success }]}
          onPress={testImmediateNotification}
          disabled={loading}
        >
          <Ionicons name="send-outline" size={20} color="#ffffff" />
          <Text style={styles.buttonText}>Send Now</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.warning }]}
          onPress={testScheduledNotification}
          disabled={loading}
        >
          <Ionicons name="time-outline" size={20} color="#ffffff" />
          <Text style={styles.buttonText}>Schedule (5s)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.secondary }]}
          onPress={testMultipleNotifications}
          disabled={loading}
        >
          <Ionicons name="notifications" size={20} color="#ffffff" />
          <Text style={styles.buttonText}>Send 3 (2s, 4s, 6s)</Text>
        </TouchableOpacity>
      </View>

      {Platform.OS === 'web' && (
        <View style={[styles.webInfo, { backgroundColor: theme.colors.backgroundSecondary }]}>
          <Ionicons name="information-circle-outline" size={16} color={theme.colors.textSecondary} />
          <Text style={[styles.webInfoText, { color: theme.colors.textSecondary }]}>
            Web notifications require HTTPS (or localhost). Check your browser's notification settings if they don't appear.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 16,
    margin: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  description: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  webInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  webInfoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
});

