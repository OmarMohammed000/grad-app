import db from '../../models/index.js';

/**
 * Register device push token
 * POST /notifications/register
 */
export default async function registerToken(req, res) {
  try {
    const { userId, expoPushToken, platform } = req.body;

    if (!userId || !expoPushToken) {
      return res.status(400).json({ message: 'User ID and push token are required' });
    }

    // Ensure the user making the request matches the userId provided
    if (req.user.userId !== userId) {
      return res.status(403).json({ message: 'Unauthorized to register token for this user' });
    }

    // Find user profile
    const userProfile = await db.UserProfile.findOne({ where: { userId } });

    if (!userProfile) {
      return res.status(404).json({ message: 'User profile not found' });
    }

    // Update push token
    await userProfile.update({
      pushToken: expoPushToken,
      pushTokenPlatform: platform || 'unknown',
      notificationsEnabled: true // Auto-enable notifications when registering token
    });

    return res.json({
      message: 'Push token registered successfully',
      notificationsEnabled: true
    });

  } catch (error) {
    console.error('Error registering push token:', error);
    return res.status(500).json({
      message: 'An error occurred while registering push token',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
