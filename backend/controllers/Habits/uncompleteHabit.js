import db from '../../models/index.js';
import { Op } from 'sequelize';
import { removeXP } from '../../services/xpService.js';

const { Habit, HabitCompletion, sequelize } = db;

export const uncompleteHabit = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { completedDate } = req.body;

    // Get the date to uncomplete (default to today)
    const dateToUncomplete = completedDate 
      ? new Date(completedDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    const habit = await Habit.findByPk(id, {
      include: [
        {
          model: HabitCompletion,
          as: 'completions',
          limit: 10,
          order: [['completedDate', 'DESC']]
        }
      ],
      transaction
    });

    if (!habit) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Habit not found' });
    }

    if (habit.userId !== req.user.userId) {
      await transaction.rollback();
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Find the completion for the specified date
    const completion = await HabitCompletion.findOne({
      where: {
        habitId: id,
        completedDate: dateToUncomplete
      },
      transaction
    });

    if (!completion) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Completion not found for this date' });
    }

    // Store XP earned and completion date before deletion
    const xpEarned = completion.xpEarned;
    const completionStreak = completion.streakCount;

    // Remove XP from user's character
    const xpRemovalResult = await removeXP(
      req.user.userId,
      xpEarned,
      'habit_uncompleted',
      { habitId: id },
      transaction
    );

    // Delete the completion
    await completion.destroy({ transaction });

    // Recalculate streak after removal
    // Get all remaining completions (excluding the one being deleted)
    const remainingCompletions = await HabitCompletion.findAll({
      where: {
        habitId: id,
        completedDate: {
          [Op.ne]: dateToUncomplete
        }
      },
      order: [['completedDate', 'DESC']],
      limit: 100,
      transaction
    });

    // Calculate current streak from remaining completions
    let newStreak = calculateCurrentStreak(remainingCompletions);

    // Update habit stats
    habit.currentStreak = newStreak;
    habit.totalCompletions = Math.max(0, habit.totalCompletions - 1);
    
    // Update lastCompletedDate to the most recent remaining completion
    if (remainingCompletions.length > 0) {
      // Get the most recent completion date
      const sortedCompletions = remainingCompletions.sort((a, b) => 
        new Date(b.completedDate) - new Date(a.completedDate)
      );
      habit.lastCompletedDate = sortedCompletions[0].completedDate;
    } else {
      habit.lastCompletedDate = null;
    }
    
    // Update longestStreak if needed (it should only decrease if we're removing from the longest streak)
    // For simplicity, we'll keep the longestStreak as is (it represents historical best)
    // In a more sophisticated system, we might want to recalculate this

    await habit.save({ transaction });

    // Log activity
    await db.ActivityLog.create({
      userId: req.user.userId,
      activityType: 'habit_uncompleted',
      description: `Uncompleted habit: ${habit.title}`,
      xpGained: -xpEarned, // Negative to show removal
      isPublic: false,
      importance: xpRemovalResult.leveledDown ? 'milestone' : 'medium',
      relatedHabitId: habit.id,
      metadata: {
        xpRemoved: xpEarned,
        leveledDown: xpRemovalResult.leveledDown,
        oldLevel: xpRemovalResult.oldLevel,
        newLevel: xpRemovalResult.newLevel
      }
    }, { transaction });

    await transaction.commit();

    res.json({
      message: 'Habit completion removed',
      habit,
      xpRemoved: xpEarned,
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
    console.error('Uncomplete habit error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Calculate current streak from completion history
 */
function calculateCurrentStreak(completions) {
  if (completions.length === 0) return 0;

  // Sort by date descending
  const sorted = [...completions].sort((a, b) => 
    new Date(b.completedDate) - new Date(a.completedDate)
  );

  let streak = 1;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if the most recent completion is today or yesterday
  const lastDate = new Date(sorted[0].completedDate + 'T00:00:00');
  const daysSinceLast = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

  if (daysSinceLast > 1) {
    // Streak is broken
    return 0;
  }

  // Count consecutive days
  for (let i = 1; i < sorted.length; i++) {
    const currentDate = new Date(sorted[i - 1].completedDate + 'T00:00:00');
    const nextDate = new Date(sorted[i].completedDate + 'T00:00:00');
    const daysDiff = Math.floor((currentDate - nextDate) / (1000 * 60 * 60 * 24));

    if (daysDiff === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

