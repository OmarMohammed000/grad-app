import db from "../../models/index.js";
import { calculateTaskXP, awardXP } from "../../services/xpService.js";
import { emitTaskCompleted } from "../../services/websocketService.js";

/**
 * Complete a task
 * POST /tasks/:id/complete
 */
export default async function completeTask(req, res) {
  const transaction = await db.sequelize.transaction();

  try {
    const { id } = req.params;
    const { notes } = req.body;

    // Find task and verify ownership
    const task = await db.Task.findOne({
      where: {
        id,
        userId: req.user.userId // User-specific
      },
      include: [
        {
          model: db.Task,
          as: 'subtasks',
          attributes: ['id', 'status']
        }
      ],
      transaction
    });

    if (!task) {
      await transaction.rollback();
      return res.status(404).json({
        message: "Task not found"
      });
    }

    // Check if already completed (unless recurring)
    if (task.status === 'completed' && !task.isRecurring) {
      await transaction.rollback();
      return res.status(400).json({
        message: "Task is already completed"
      });
    }

    // Check if all subtasks are completed
    const incompleteSubtasks = task.subtasks?.filter(st => st.status !== 'completed') || [];
    if (incompleteSubtasks.length > 0) {
      await transaction.rollback();
      return res.status(400).json({
        message: `Cannot complete task: ${incompleteSubtasks.length} subtask(s) are still incomplete`,
        incompleteSubtasks: incompleteSubtasks.map(st => ({ id: st.id }))
      });
    }

    // Calculate completion time factors
    const completedAt = new Date();
    const wasEarly = task.dueDate && completedAt < new Date(task.dueDate);
    const wasLate = task.dueDate && completedAt > new Date(task.dueDate);

    let earlyCompletionBonus = 0;
    let lateCompletionPenalty = 0;

    if (wasEarly) {
      const timeUntilDue = new Date(task.dueDate) - completedAt;
      const totalTime = new Date(task.dueDate) - new Date(task.createdAt);
      const earlyPercentage = (timeUntilDue / totalTime) * 100;
      
      if (earlyPercentage >= 50) {
        earlyCompletionBonus = 0.3; // 30% bonus for completing >50% early
      } else if (earlyPercentage >= 25) {
        earlyCompletionBonus = 0.2; // 20% bonus for completing >25% early
      } else {
        earlyCompletionBonus = 0.1; // 10% bonus for any early completion
      }
    } else if (wasLate) {
      const timeOverdue = completedAt - new Date(task.dueDate);
      const totalTime = new Date(task.dueDate) - new Date(task.createdAt);
      const latePercentage = (timeOverdue / totalTime) * 100;
      
      if (latePercentage >= 100) {
        lateCompletionPenalty = 0.3; // 30% penalty for >2x time
      } else if (latePercentage >= 50) {
        lateCompletionPenalty = 0.2; // 20% penalty for >50% late
      } else {
        lateCompletionPenalty = 0.1; // 10% penalty for any late completion
      }
    }

    // Count completed subtasks for bonus
    const completedSubtaskCount = await db.Task.count({
      where: {
        parentTaskId: task.id,
        status: 'completed'
      },
      transaction
    });

    // Calculate XP reward
    const xpEarned = calculateTaskXP({
      baseXP: task.xpReward,
      priority: task.priority,
      difficulty: task.difficulty,
      earlyCompletionBonus,
      lateCompletionPenalty,
      subtaskCompletionCount: completedSubtaskCount
    });

    // Create completion record
    const completion = await db.TaskCompletion.create({
      userId: req.user.userId,
      taskId: task.id,
      completedAt,
      xpEarned,
      notes
    }, { transaction });

    // Update task status (or reset if recurring)
    if (task.isRecurring) {
      // For recurring tasks, reset to pending for next occurrence
      await task.update({
        status: 'pending',
        // Could implement recurrence pattern logic here to set next due date
      }, { transaction });
    } else {
      await task.update({
        status: 'completed'
      }, { transaction });
    }

    // Award XP to user
    const levelUpResult = await awardXP(
      req.user.userId,
      xpEarned,
      'task_completed',
      { taskId: task.id },
      transaction
    );

    // Log activity
    await db.ActivityLog.create({
      userId: req.user.userId,
      activityType: 'task_completed',
      description: `Task completed: ${task.title}`,
      xpGained: xpEarned,
      isPublic: true,
      importance: levelUpResult.leveledUp ? 'milestone' : 'medium',
      metadata: {
        taskId: task.id,
        wasEarly,
        wasLate,
        leveledUp: levelUpResult.leveledUp,
        newLevel: levelUpResult.newLevel
      }
    }, { transaction });

    await transaction.commit();

    // Emit WebSocket event for task completion
    emitTaskCompleted(req.user.userId, {
      taskId: task.id,
      taskTitle: task.title,
      xpEarned,
      wasEarly,
      wasLate,
      completedAt,
      leveledUp: levelUpResult.leveledUp,
      newLevel: levelUpResult.newLevel
    });

    return res.status(200).json({
      message: "Task completed successfully",
      completion: {
        id: completion.id,
        completedAt: completion.completedAt,
        xpEarned,
        wasEarly,
        wasLate,
        earlyCompletionBonus,
        lateCompletionPenalty,
        subtaskBonus: completedSubtaskCount > 0
      },
      character: levelUpResult.leveledUp ? {
        leveledUp: true,
        newLevel: levelUpResult.newLevel,
        currentXP: levelUpResult.currentXP,
        xpForNextLevel: levelUpResult.xpForNextLevel,
        rankedUp: levelUpResult.rankedUp,
        newRank: levelUpResult.newRank
      } : {
        currentXP: levelUpResult.currentXP,
        xpForNextLevel: levelUpResult.xpForNextLevel
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error("Error completing task:", error);
    return res.status(500).json({
      message: "An error occurred while completing the task",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
