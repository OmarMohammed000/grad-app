import db from "../../models/index.js";

/**
 * Get single task by ID
 * GET /tasks/:id
 */
export default async function getTask(req, res) {
  try {
    const { id } = req.params;

    const task = await db.Task.findOne({
      where: {
        id,
        userId: req.user.userId // User-specific - can only view own tasks
      },
      include: [
        {
          model: db.Task,
          as: 'subtasks',
          include: [
            {
              model: db.TaskCompletion,
              as: 'completions',
              limit: 1,
              order: [['completedAt', 'DESC']]
            }
          ]
        },
        {
          model: db.Task,
          as: 'parentTask',
          attributes: ['id', 'title', 'status', 'priority', 'difficulty']
        },
        {
          model: db.TaskCompletion,
          as: 'completions',
          order: [['completedAt', 'DESC']],
          limit: 5 // Last 5 completions for recurring tasks
        }
      ]
    });

    if (!task) {
      return res.status(404).json({
        message: "Task not found"
      });
    }

    return res.status(200).json({ task });

  } catch (error) {
    console.error("Error fetching task:", error);
    return res.status(500).json({
      message: "An error occurred while fetching the task",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
