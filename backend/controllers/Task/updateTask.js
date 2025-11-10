import db from "../../models/index.js";
import { getDefaultXP } from "../../services/xpService.js";

/**
 * Update task
 * PUT /tasks/:id
 */
export default async function updateTask(req, res) {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      priority,
      difficulty,
      status,
      dueDate,
      tags,
      metadata,
      isRecurring,
      recurrencePattern,
      parentTaskId,
      orderIndex
    } = req.body;
    // reminderTime is accessed directly from req.body to avoid scope issues

    // Find task and verify ownership
    const task = await db.Task.findOne({
      where: {
        id,
        userId: req.user.userId // User-specific
      }
    });

    if (!task) {
      return res.status(404).json({
        message: "Task not found"
      });
    }

    // Prevent updating completed tasks unless changing status
    if (task.status === 'completed' && status !== 'active' && status !== 'pending') {
      return res.status(400).json({
        message: "Cannot update completed tasks. You can reopen them by setting status to 'active' or 'pending'"
      });
    }

    // If changing parent task, verify new parent exists and belongs to user
    if (parentTaskId !== undefined) {
      if (parentTaskId) {
        // Prevent circular references
        if (parentTaskId === id) {
          return res.status(400).json({
            message: "A task cannot be its own parent"
          });
        }

        const parentTask = await db.Task.findOne({
          where: {
            id: parentTaskId,
            userId: req.user.userId // Parent must belong to same user
          }
        });

        if (!parentTask) {
          return res.status(404).json({
            message: "Parent task not found"
          });
        }

        // Check if new parent would create circular dependency
        const wouldCreateCircular = await checkCircularDependency(parentTaskId, id);
        if (wouldCreateCircular) {
          return res.status(400).json({
            message: "Cannot set parent task: would create circular dependency"
          });
        }
      }
    }

    // Build update object
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (priority !== undefined) updates.priority = priority;
    if (difficulty !== undefined) {
      updates.difficulty = difficulty;
      // Recalculate default XP if difficulty changed and XP was default
      const newDefaultXP = getDefaultXP('task', difficulty);
      if (task.xpReward === getDefaultXP('task', task.difficulty)) {
        updates.xpReward = newDefaultXP;
      }
    }
    if (status !== undefined) updates.status = status;
    
    // Validate and parse dueDate
    if (dueDate !== undefined) {
      if (dueDate === null || dueDate === '') {
        updates.dueDate = null;
      } else {
        let parsedDueDate = null;
        if (dueDate instanceof Date) {
          parsedDueDate = isNaN(dueDate.getTime()) ? null : dueDate;
        } else if (typeof dueDate === 'string') {
          const dateObj = new Date(dueDate);
          parsedDueDate = isNaN(dateObj.getTime()) ? null : dateObj;
        }
        updates.dueDate = parsedDueDate;
      }
    }
    
    // Validate and parse reminderTime (safely handle if not in req.body)
    const reminderTimeValue = req.body.reminderTime;
    if (reminderTimeValue !== undefined) {
      if (reminderTimeValue === null || reminderTimeValue === '') {
        updates.reminderTime = null;
      } else {
        let parsedReminderTime = null;
        try {
          if (reminderTimeValue instanceof Date) {
            parsedReminderTime = isNaN(reminderTimeValue.getTime()) ? null : reminderTimeValue;
          } else if (typeof reminderTimeValue === 'string' && reminderTimeValue.trim() !== '') {
            const dateObj = new Date(reminderTimeValue.trim());
            parsedReminderTime = isNaN(dateObj.getTime()) ? null : dateObj;
          }
        } catch (error) {
          console.error('Error parsing reminderTime:', error);
          parsedReminderTime = null;
        }
        updates.reminderTime = parsedReminderTime;
      }
    }
    
    if (tags !== undefined) updates.tags = tags;
    if (metadata !== undefined) updates.metadata = metadata;
    if (isRecurring !== undefined) updates.isRecurring = isRecurring;
    if (recurrencePattern !== undefined) updates.recurrencePattern = recurrencePattern;
    if (parentTaskId !== undefined) updates.parentTaskId = parentTaskId;
    if (orderIndex !== undefined) updates.orderIndex = orderIndex;

    await task.update(updates);

    // Log activity
    await db.ActivityLog.create({
      userId: req.user.userId,
      activityType: 'task_updated',
      description: `Task updated: ${task.title}`,
      xpGained: 0,
      isPublic: false,
      importance: 'medium',
      relatedTaskId: task.id,
      metadata: { updates: Object.keys(updates) }
    });

    // Reload with associations
    const updatedTask = await db.Task.findByPk(task.id, {
      include: [
        {
          model: db.Task,
          as: 'subtasks',
          attributes: ['id', 'title', 'status']
        },
        {
          model: db.Task,
          as: 'parentTask',
          attributes: ['id', 'title', 'status']
        }
      ]
    });

    return res.status(200).json({
      message: "Task updated successfully",
      task: updatedTask
    });

  } catch (error) {
    console.error("Error updating task:", error);
    return res.status(500).json({
      message: "An error occurred while updating the task",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Check if setting a new parent would create a circular dependency
 * @param {number} newParentId - ID of the proposed parent task
 * @param {number} taskId - ID of the task being updated
 * @returns {Promise<boolean>} true if circular dependency would be created
 */
async function checkCircularDependency(newParentId, taskId) {
  let currentId = newParentId;
  const visited = new Set();

  while (currentId) {
    if (currentId === taskId) {
      return true; // Circular dependency detected
    }

    if (visited.has(currentId)) {
      // Already checked this branch, no circular dependency
      return false;
    }

    visited.add(currentId);

    const parent = await db.Task.findByPk(currentId, {
      attributes: ['parentTaskId']
    });

    if (!parent) {
      return false; // No parent, no circular dependency
    }

    currentId = parent.parentTaskId;
  }

  return false; // No circular dependency found
}
