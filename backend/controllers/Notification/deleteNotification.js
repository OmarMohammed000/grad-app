import db from '../../models/index.js';

/**
 * Delete a notification
 * DELETE /notifications/:id
 */
export default async function deleteNotification(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const notification = await db.Notification.findOne({
      where: { id, userId }
    });

    if (!notification) {
      return res.status(404).json({
        message: 'Notification not found'
      });
    }

    await notification.destroy();

    return res.json({
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting notification:', error);
    return res.status(500).json({
      message: 'An error occurred while deleting notification',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
