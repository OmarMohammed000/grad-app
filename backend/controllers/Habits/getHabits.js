import db from '../../models/index.js';
import { Op } from 'sequelize';

const { Habit } = db;

export const getHabits = async (req, res) => {
  try {
    const {
      difficulty,
      frequency,
      isActive,
      tags,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      order = 'DESC'
    } = req.query;

    // Build filters
    const where = { userId: req.user.userId };

    if (difficulty) {
      where.difficulty = difficulty;
    }

    if (frequency) {
      where.frequency = frequency;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (tags) {
      const tagArray = tags.split(',').map(t => t.trim());
      where.tags = { [Op.overlap]: tagArray };
    }

    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Get habits (simplified query without GROUP BY for better reliability)
    const { count, rows: habits } = await Habit.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [[sortBy, order.toUpperCase()]],
      distinct: true
    });

    res.json({
      habits,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get habits error:', error);
    res.status(500).json({ message: error.message });
  }
};