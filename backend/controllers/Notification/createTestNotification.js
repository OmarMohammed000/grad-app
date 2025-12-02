import db from '../../models/index.js';
import notificationService, { NotificationTypes } from '../../services/notificationService.js';

/**
 * Create test notification (for development/testing only)
 * POST /notifications/test
 */
export default async function createTestNotification(req, res) {
  try {
    const { type, userId, sendPush = true } = req.body;

    // Use authenticated user if no userId provided
    const targetUserId = userId || req.user.userId;

    // Validate notification type
    const validTypes = Object.values(NotificationTypes);
    if (type && !validTypes.includes(type)) {
      return res.status(400).json({
        message: 'Invalid notification type',
        validTypes
      });
    }

    const notificationType = type || NotificationTypes.TASK_DEADLINE_NEARING;

    // Sample notification data based on type
    const notificationTemplates = {
      [NotificationTypes.TASK_DEADLINE_NEARING]: {
        title: '⏰ Task Deadline Soon',
        message: 'Your test task is due in 24 hours!',
        relatedEntityType: 'task',
        metadata: { taskTitle: 'Test Task', hoursUntilDue: 24 }
      },
      [NotificationTypes.HABIT_STREAK_EXPIRING]: {
        title: '🔥 Streak Warning',
        message: 'Complete your habit today to maintain your 5-day streak!',
        relatedEntityType: 'habit',
        metadata: { habitTitle: 'Test Habit', currentStreak: 5 }
      },
      [NotificationTypes.CHALLENGE_TASK_CREATED]: {
        title: '✨ New Challenge Task',
        message: 'A new task "Test Challenge Task" has been added!',
        relatedEntityType: 'challenge_task',
        metadata: { taskTitle: 'Test Challenge Task', challengeTitle: 'Test Challenge' }
      },
      [NotificationTypes.CHALLENGE_TASK_DEADLINE]: {
        title: '⚡ Challenge Task Due Soon',
        message: 'Challenge task due in 48 hours!',
        relatedEntityType: 'challenge_task',
        metadata: { taskTitle: 'Test Challenge Task', hoursUntilDue: 48 }
      },
      [NotificationTypes.CHALLENGE_ENDING_SOON]: {
        title: '🏁 Challenge Ending',
        message: 'Your challenge ends in 2 days!',
        relatedEntityType: 'challenge',
        metadata: { challengeTitle: 'Test Challenge', daysRemaining: 2 }
      },
      [NotificationTypes.CHALLENGE_INVITATION]: {
        title: '🎯 Challenge Invitation',
        message: 'You\'ve been invited to join "Epic Challenge"!',
        relatedEntityType: 'challenge',
        metadata: { challengeTitle: 'Epic Challenge', inviterName: 'Test User' }
      },
      [NotificationTypes.CHALLENGE_COMPLETED]: {
        title: '🎉 Challenge Completed',
        message: 'Congratulations! You completed "Test Challenge"!',
        relatedEntityType: 'challenge',
        metadata: { challengeTitle: 'Test Challenge', xpEarned: 500 }
      },
      [NotificationTypes.INACTIVE_USER_REMINDER]: {
        title: '👋 We Miss You',
        message: 'Come back and continue your productivity journey!',
        metadata: { daysInactive: 7 }
      }
    };

    const template = notificationTemplates[notificationType] || notificationTemplates[NotificationTypes.TASK_DEADLINE_NEARING];

    // Create in-app notification
    const notification = await notificationService.createNotification(targetUserId, {
      type: notificationType,
      title: template.title,
      message: template.message,
      relatedEntityType: template.relatedEntityType,
      metadata: template.metadata
    });

    let pushResult = null;

    // Optionally send push notification
    if (sendPush) {
      try {
        pushResult = await notificationService.sendPushNotification(targetUserId, {
          type: notificationType,
          title: template.title,
          message: template.message,
          data: {
            notificationId: notification.id,
            type: notificationType,
            ...template.metadata
          }
        });
      } catch (pushError) {
        console.error('Error sending push notification:', pushError);
        pushResult = { error: pushError.message };
      }
    }

    return res.status(201).json({
      message: 'Test notification created successfully',
      notification,
      pushSent: sendPush,
      pushResult,
      info: {
        inAppNotification: 'Created and stored in database',
        pushNotification: sendPush 
          ? (pushResult === true ? 'Sent to device' : 'Failed or no device token')
          : 'Not requested'
      }
    });

  } catch (error) {
    console.error('Error creating test notification:', error);
    return res.status(500).json({
      message: 'An error occurred while creating test notification',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
