import db from "../../models/index.js";
import { Op } from 'sequelize';

/**
 * Get all tasks for current user
 * GET /tasks
 * Query params: status, priority, difficulty, tags, dueDate, parentTaskId, page, limit, sortBy, sortOrder
 */
export default async function getTasks(req, res) {
  try {
    const {
      status,
      priority,
      difficulty,
      tags,
      dueDate,
      parentTaskId,
      search,
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause - ALWAYS filter by current user
    const where = {
      userId: req.user.userId // User-specific filter
    };

    // Status filter
    if (status) {
      const statuses = status.split(',');
      where.status = { [Op.in]: statuses };
    }

    // Priority filter
    if (priority) {
      const priorities = priority.split(',');
      where.priority = { [Op.in]: priorities };
    }

    // Difficulty filter
    if (difficulty) {
      const difficulties = difficulty.split(',');
      where.difficulty = { [Op.in]: difficulties };
    }

    // Tags filter (contains any of the provided tags)
    if (tags) {
      const tagArray = tags.split(',');
      where.tags = { [Op.overlap]: tagArray };
    }

    // Due date filter
    if (dueDate) {
      if (dueDate === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        where.dueDate = { [Op.between]: [today, tomorrow] };
      } else if (dueDate === 'week') {
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        where.dueDate = { [Op.between]: [today, nextWeek] };
      } else if (dueDate === 'overdue') {
        where.dueDate = { [Op.lt]: new Date() };
        where.status = { [Op.ne]: 'completed' };
      }
    }

    // Parent task filter (for subtasks or top-level tasks)
    if (parentTaskId === 'null') {
      where.parentTaskId = null;
    } else if (parentTaskId) {
      where.parentTaskId = parentTaskId;
    }

    // Search by title or description
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Valid sort fields
    const validSortFields = ['createdAt', 'updatedAt', 'dueDate', 'priority', 'status', 'title', 'orderIndex'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const { count, rows } = await db.Task.findAndCountAll({
      where,
      include: [
        {
          model: db.Task,
          as: 'subtasks',
          attributes: ['id', 'title', 'status', 'priority', 'difficulty']
        },
        {
          model: db.Task,
          as: 'parentTask',
          attributes: ['id', 'title', 'status']
        }
      ],
      limit: parseInt(limit),
      offset: offset,
      order: [[sortField, sortOrder.toUpperCase()]],
      distinct: true
    });

    return res.status(200).json({
      tasks: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });

  } catch (error) {
    console.error("Error fetching tasks:", error);
    return res.status(500).json({
      message: "An error occurred while fetching tasks",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
