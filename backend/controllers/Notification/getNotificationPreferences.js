import db from '../../models/index.js';

/**
 * Get user notification preferences
 * GET /notifications/preferences
 */
export default async function getNotificationPreferences(req, res) {
  try {
    const userId = req.user.userId;

    const userProfile = await db.UserProfile.findOne({
      where: { userId },
      attributes: ['notificationPreferences', 'notificationsEnabled']
    });

    if (!userProfile) {
      return res.status(404).json({
        message: 'User profile not found'
      });
    }

    const defaultPreferences = {
      taskDeadlines: true,
      habitStreaks: true,
      challengeUpdates: true,
      challengeInvitations: true,
      inactiveReminders: true,
      deadlineAdvanceHours: 24
    };

    return res.json({
      notificationsEnabled: userProfile.notificationsEnabled,
      preferences: userProfile.notificationPreferences || defaultPreferences
    });

  } catch (error) {
    console.error('Error getting notification preferences:', error);
    return res.status(500).json({
      message: 'An error occurred while fetching preferences',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
