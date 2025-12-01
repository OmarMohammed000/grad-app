import db from '../../models/index.js';

/**
 * Unregister device push token
 * POST /notifications/unregister
 */
export default async function unregisterToken(req, res) {
  try {
    const { expoPushToken } = req.body;
    const userId = req.user.userId;

    if (!expoPushToken) {
      return res.status(400).json({ message: 'Push token is required' });
    }

    // Find user profile
    const userProfile = await db.UserProfile.findOne({ where: { userId } });

    if (!userProfile) {
      return res.status(404).json({ message: 'User profile not found' });
    }

    // Only remove if the token matches (to avoid removing a new token from another device if we supported multiple)
    // Since we only store one, we check if it matches the current one
    if (userProfile.pushToken === expoPushToken) {
      await userProfile.update({
        pushToken: null,
        pushTokenPlatform: null
      });
    }

    return res.json({
      message: 'Push token unregistered successfully'
    });

  } catch (error) {
    console.error('Error unregistering push token:', error);
    return res.status(500).json({
      message: 'An error occurred while unregistering push token',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
