import db from "../../models/index.js";
import { removeXP } from "../../services/xpService.js";

/**
 * Uncomplete a task (remove completion and deduct XP)
 * DELETE /tasks/:id/complete
 */
export default async function uncompleteTask(req, res) {
  const transaction = await db.sequelize.transaction();

  try {
    const { id } = req.params;

    // Find task and verify ownership
    const task = await db.Task.findOne({
      where: {
        id,
        userId: req.user.userId // User-specific
      },
      transaction
    });

    if (!task) {
      await transaction.rollback();
      return res.status(404).json({
        message: "Task not found"
      });
    }

    // Verify task is actually completed
    if (task.status !== 'completed') {
      await transaction.rollback();
      return res.status(400).json({
        message: "Task is not completed"
      });
    }

    // Find most recent completion record
    const completion = await db.TaskCompletion.findOne({
      where: {
        taskId: id,
        userId: req.user.userId
      },
      order: [['completedAt', 'DESC']],
      transaction
    });

    if (!completion) {
      await transaction.rollback();
      return res.status(404).json({
        message: "Completion record not found"
      });
    }

    const xpToRemove = completion.xpEarned;

    // Remove XP from user's character
    const xpRemovalResult = await removeXP(
      req.user.userId,
      xpToRemove,
      'task_uncompleted',
      { taskId: id },
      transaction
    );

    // Delete completion record
    await completion.destroy({ transaction });

    // Update task status back to pending
    await task.update({ status: 'pending' }, { transaction });

    // Log activity
    await db.ActivityLog.create({
      userId: req.user.userId,
      activityType: 'task_uncompleted',
      description: `Uncompleted task: ${task.title}`,
      xpGained: -xpToRemove, // Negative to show removal
      isPublic: false,
      importance: xpRemovalResult.leveledDown ? 'milestone' : 'medium',
      relatedTaskId: task.id,
      metadata: {
        xpRemoved: xpToRemove,
        leveledDown: xpRemovalResult.leveledDown,
        oldLevel: xpRemovalResult.oldLevel,
        newLevel: xpRemovalResult.newLevel
      }
    }, { transaction });

    await transaction.commit();

    // Reload task with associations
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
      message: "Task uncompleted successfully",
      task: updatedTask,
      xpRemoved: xpToRemove,
      character: xpRemovalResult.leveledDown ? {
        leveledDown: true,
        oldLevel: xpRemovalResult.oldLevel,
        newLevel: xpRemovalResult.newLevel,
        currentXP: xpRemovalResult.currentXP,
        xpForNextLevel: xpRemovalResult.xpForNextLevel,
        rankedDown: xpRemovalResult.rankedDown,
        oldRank: xpRemovalResult.oldRank?.name,
        newRank: xpRemovalResult.newRank?.name
      } : {
        currentXP: xpRemovalResult.currentXP,
        xpForNextLevel: xpRemovalResult.xpForNextLevel
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error("Error uncompleting task:", error);
    return res.status(500).json({
      message: "An error occurred while uncompleting the task",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

