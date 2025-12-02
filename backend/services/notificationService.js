import { Expo } from 'expo-server-sdk';
import db from '../models/index.js';

// Initialize Expo SDK
const expo = new Expo();

// Notification types
export const NotificationTypes = {
  TASK_DEADLINE_NEARING: 'task_deadline_nearing',
  HABIT_STREAK_EXPIRING: 'habit_streak_expiring',
  CHALLENGE_TASK_CREATED: 'challenge_task_created',
  CHALLENGE_TASK_DEADLINE: 'challenge_task_deadline',
  CHALLENGE_ENDING_SOON: 'challenge_ending_soon',
  CHALLENGE_INVITATION: 'challenge_invitation',
  CHALLENGE_COMPLETED: 'challenge_completed',
  INACTIVE_USER_REMINDER: 'inactive_user_reminder',
};

/**
 * Notification Service
 * Handles push notifications and in-app notifications
 */
class NotificationService {
  /**
   * Create an in-app notification record
   * @param {string} userId - User ID
   * @param {object} notificationData - Notification data
   * @returns {Promise<object>} Created notification
   */
  async createNotification(userId, notificationData) {
    try {
      const {
        type,
        title,
        message,
        metadata = {},
        relatedEntityType = null,
        relatedEntityId = null,
        scheduledFor = null,
      } = notificationData;

      const notification = await db.Notification.create({
        userId,
        type,
        title,
        message,
        metadata,
        relatedEntityType,
        relatedEntityId,
        scheduledFor,
        sentAt: scheduledFor ? null : new Date(),
        isRead: false,
      });

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Send push notification to a user
   * @param {string} userId - User ID
   * @param {object} notificationData - Notification data
   * @returns {Promise<boolean>} Success status
   */
  async sendPushNotification(userId, notificationData) {
    try {
      // Get user's push token
      const userProfile = await db.UserProfile.findOne({
        where: { userId },
        attributes: ['pushToken', 'pushTokenPlatform', 'notificationsEnabled', 'notificationPreferences'],
      });

      if (!userProfile || !userProfile.pushToken) {
        console.log(`No push token found for user ${userId}`);
        return false;
      }

      if (!userProfile.notificationsEnabled) {
        console.log(`Notifications disabled for user ${userId}`);
        return false;
      }

      // Check notification preferences
      if (!this.checkNotificationPreference(userProfile.notificationPreferences, notificationData.type)) {
        console.log(`Notification type ${notificationData.type} disabled for user ${userId}`);
        return false;
      }

      const pushToken = userProfile.pushToken;

      // Check if token is valid Expo push token
      if (!Expo.isExpoPushToken(pushToken)) {
        console.error(`Invalid Expo push token for user ${userId}: ${pushToken}`);
        return false;
      }

      const { title, message, data = {} } = notificationData;

      // Construct push notification message
      const messages = [
        {
          to: pushToken,
          sound: 'default',
          title,
          body: message,
          data,
          priority: 'high',
        },
      ];

      // Send push notification
      const chunks = expo.chunkPushNotifications(messages);
      const tickets = [];

      for (const chunk of chunks) {
        try {
          const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          console.error('Error sending push notification chunk:', error);
        }
      }

      // Check for errors in tickets
      for (const ticket of tickets) {
        if (ticket.status === 'error') {
          console.error(`Error sending push notification: ${ticket.message}`);
          if (ticket.details && ticket.details.error === 'DeviceNotRegistered') {
            // Token is invalid, clear it
            await userProfile.update({ pushToken: null, pushTokenPlatform: null });
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Error sending push notification:', error);
      return false;
    }
  }

  /**
   * Create in-app notification and send push notification
   * @param {string} userId - User ID
   * @param {object} notificationData - Notification data
   * @returns {Promise<object>} Created notification
   */
  async notifyUser(userId, notificationData) {
    try {
      // Create in-app notification
      const notification = await this.createNotification(userId, notificationData);

      // Send push notification (async, don't wait)
      this.sendPushNotification(userId, notificationData).catch((error) => {
        console.error('Error sending push notification:', error);
      });

      return notification;
    } catch (error) {
      console.error('Error notifying user:', error);
      throw error;
    }
  }

  /**
   * Send notification to multiple users
   * @param {string[]} userIds - Array of user IDs
   * @param {object} notificationData - Notification data
   * @returns {Promise<object[]>} Created notifications
   */
  async notifyUsers(userIds, notificationData) {
    try {
      const notifications = await Promise.allSettled(
        userIds.map((userId) => this.notifyUser(userId, notificationData))
      );

      return notifications
        .filter((result) => result.status === 'fulfilled')
        .map((result) => result.value);
    } catch (error) {
      console.error('Error notifying users:', error);
      throw error;
    }
  }

  /**
   * Check if notification type is enabled in user preferences
   * @param {object} preferences - User notification preferences
   * @param {string} notificationType - Notification type
   * @returns {boolean} Whether notification is allowed
   */
  checkNotificationPreference(preferences, notificationType) {
    if (!preferences) {
      return true; // Default to enabled if no preferences set
    }

    // Map notification types to preference keys
    const preferenceMap = {
      [NotificationTypes.TASK_DEADLINE_NEARING]: 'taskDeadlines',
      [NotificationTypes.HABIT_STREAK_EXPIRING]: 'habitStreaks',
      [NotificationTypes.CHALLENGE_TASK_CREATED]: 'challengeUpdates',
      [NotificationTypes.CHALLENGE_TASK_DEADLINE]: 'challengeUpdates',
      [NotificationTypes.CHALLENGE_ENDING_SOON]: 'challengeUpdates',
      [NotificationTypes.CHALLENGE_INVITATION]: 'challengeInvitations',
      [NotificationTypes.CHALLENGE_COMPLETED]: 'challengeUpdates',
      [NotificationTypes.INACTIVE_USER_REMINDER]: 'inactiveReminders',
    };

    const preferenceKey = preferenceMap[notificationType];
    if (!preferenceKey) {
      return true; // Unknown type, default to enabled
    }

    return preferences[preferenceKey] !== false;
  }

  /**
   * Get advance warning hours from user preferences
   * @param {string} userId - User ID
   * @returns {Promise<number>} Advance warning hours (default: 24)
   */
  async getDeadlineAdvanceHours(userId) {
    try {
      const userProfile = await db.UserProfile.findOne({
        where: { userId },
        attributes: ['notificationPreferences'],
      });

      if (!userProfile || !userProfile.notificationPreferences) {
        return 24; // Default to 24 hours
      }

      return userProfile.notificationPreferences.deadlineAdvanceHours || 24;
    } catch (error) {
      console.error('Error getting deadline advance hours:', error);
      return 24;
    }
  }
}

export default new NotificationService();
