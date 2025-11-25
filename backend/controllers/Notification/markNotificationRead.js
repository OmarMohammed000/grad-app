import db from '../../models/index.js';

/**
 * Mark notification as read
 * PUT /notifications/:id/read
 */
export default async function markNotificationRead(req, res) {
  try {
    const { id } = req.params;

    const notification = await db.Notification.findOne({
      where: {
        id,
        userId: req.user.userId
      }
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.isRead = true;
    await notification.save();

    return res.json({
      message: 'Notification marked as read',
      notification
    });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({
      message: 'An error occurred while updating notification',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
