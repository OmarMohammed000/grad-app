import db from '../../models/index.js';

/**
 * Mark all notifications as read for the user
 * POST /notifications/mark-all-read
 */
export default async function markAllNotificationsRead(req, res) {
  try {
    const userId = req.user.userId;

    const [updatedCount] = await db.Notification.update(
      { isRead: true },
      {
        where: {
          userId,
          isRead: false
        }
      }
    );

    return res.json({
      message: 'All notifications marked as read',
      updatedCount
    });

  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return res.status(500).json({
      message: 'An error occurred while marking all notifications as read',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
