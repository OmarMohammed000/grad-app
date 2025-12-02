import db from '../../models/index.js';

/**
 * Update user notification preferences
 * PUT /notifications/preferences
 */
export default async function updateNotificationPreferences(req, res) {
  try {
    const userId = req.user.userId;
    const { notificationsEnabled, preferences } = req.body;

    const userProfile = await db.UserProfile.findOne({
      where: { userId }
    });

    if (!userProfile) {
      return res.status(404).json({
        message: 'User profile not found'
      });
    }

    const updateData = {};

    if (typeof notificationsEnabled === 'boolean') {
      updateData.notificationsEnabled = notificationsEnabled;
    }

    if (preferences && typeof preferences === 'object') {
      // Merge with existing preferences
      updateData.notificationPreferences = {
        ...(userProfile.notificationPreferences || {}),
        ...preferences
      };
    }

    await userProfile.update(updateData);

    return res.json({
      message: 'Notification preferences updated successfully',
      notificationsEnabled: userProfile.notificationsEnabled,
      preferences: userProfile.notificationPreferences
    });

  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return res.status(500).json({
      message: 'An error occurred while updating preferences',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
