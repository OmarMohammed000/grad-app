import db from "../../models/index.js";
import { getDefaultXP } from "../../services/xpService.js";

/**
 * Create a new task (user-specific)
 * POST /tasks
 */
export default async function createTask(req, res) {
  try {
    const {
      title,
      description,
      priority = 'medium',
      difficulty = 'medium',
      xpReward,
      tags = [],
      dueDate,
      reminderTime,
      estimatedDuration,
      location,
      isRecurring = false,
      recurringPattern,
      parentTaskId,
      orderIndex
    } = req.body;

    // Validation
    if (!title || title.trim().length === 0) {
      return res.status(400).json({ message: "Title is required" });
    }

    if (title.length > 255) {
      return res.status(400).json({ message: "Title must be 255 characters or less" });
    }

    // Validate enums
    const validPriorities = ['low', 'medium', 'high', 'critical'];
    const validDifficulties = ['easy', 'medium', 'hard', 'extreme'];

    if (!validPriorities.includes(priority)) {
      return res.status(400).json({ message: "Invalid priority" });
    }

    if (!validDifficulties.includes(difficulty)) {
      return res.status(400).json({ message: "Invalid difficulty" });
    }

    // If parent task exists, verify it belongs to this user
    if (parentTaskId) {
      const parentTask = await db.Task.findOne({
        where: {
          id: parentTaskId,
          userId: req.user.userId
        }
      });

      if (!parentTask) {
        return res.status(404).json({ message: "Parent task not found or doesn't belong to you" });
      }
    }

    // Calculate default XP if not provided
    const finalXpReward = xpReward || getDefaultXP('task', difficulty);

    // Create task for current user
    const task = await db.Task.create({
      userId: req.user.userId, // User-specific
      title: title.trim(),
      description: description?.trim() || null,
      priority,
      difficulty,
      xpReward: finalXpReward,
      tags: Array.isArray(tags) ? tags : [],
      dueDate: dueDate || null,
      reminderTime: reminderTime || null,
      estimatedDuration: estimatedDuration || null,
      location: location?.trim() || null,
      isRecurring,
      recurringPattern: recurringPattern || null,
      parentTaskId: parentTaskId || null,
      orderIndex: orderIndex || null,
      status: 'pending'
    });

    // Log activity
    await db.ActivityLog.create({
      userId: req.user.userId,
      activityType: 'task_created',
      description: `Created task: ${task.title}`,
      xpGained: 0,
      isPublic: false,
      importance: 'info'
    });

    return res.status(201).json({
      message: "Task created successfully",
      task
    });

  } catch (error) {
    console.error("Error creating task:", error);
    return res.status(500).json({
      message: "An error occurred while creating task",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
