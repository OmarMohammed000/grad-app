import db from '../../models/index.js';

/**
 * Get user notifications
 * GET /notifications
 */
export default async function getNotifications(req, res) {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      userId: req.user.userId
    };

    if (unreadOnly === 'true') {
      where.isRead = false;
    }

    const { count, rows } = await db.Notification.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    return res.json({
      notifications: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({
      message: 'An error occurred while fetching notifications',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
