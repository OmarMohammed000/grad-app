import db from '../../models/index.js';
import { calculateHabitXP, awardXP } from '../../services/xpService.js';
import { emitHabitCompleted, emitStreakMilestone } from '../../services/websocketService.js';

const { Habit, HabitCompletion, Character, sequelize } = db;

export const completeHabit = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { notes, completedAt = new Date() } = req.body;

    const habit = await Habit.findByPk(id, {
      include: [
        {
          model: HabitCompletion,
          as: 'completions',
          limit: 7,
          order: [['completedAt', 'DESC']]
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

    if (!habit.isActive) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Cannot complete inactive habit' });
    }

    // Check if already completed today
    const today = new Date(completedAt);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const alreadyCompletedToday = await HabitCompletion.findOne({
      where: {
        habitId: id,
        completedAt: {
          [db.Sequelize.Op.gte]: today,
          [db.Sequelize.Op.lt]: tomorrow
        }
      },
      transaction
    });

    if (alreadyCompletedToday) {
      await transaction.rollback();
      return res.status(400).json({ 
        message: 'Habit already completed today',
        completion: alreadyCompletedToday
      });
    }

    // Update streak logic
    const lastCompletion = habit.completions[0];
    let newStreak = habit.currentStreak;

    if (lastCompletion) {
      const lastDate = new Date(lastCompletion.completedAt);
      lastDate.setHours(0, 0, 0, 0);
      const daysDiff = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

      if (daysDiff === 1) {
        // Consecutive day
        newStreak += 1;
      } else if (daysDiff > 1) {
        // Streak broken
        newStreak = 1;
      } else {
        // Same day (shouldn't happen due to check above)
        newStreak = habit.currentStreak;
      }
    } else {
      // First completion
      newStreak = 1;
    }

    // Check weekly consistency for bonus
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const thisWeekCompletions = await HabitCompletion.count({
      where: {
        habitId: id,
        completedAt: {
          [db.Sequelize.Op.gte]: weekAgo,
          [db.Sequelize.Op.lt]: tomorrow
        }
      },
      transaction
    });

    const targetDaysThisWeek = habit.frequency === 'daily' ? 7 : habit.targetDays?.length || 3;
    const completedAllTargetDaysThisWeek = (thisWeekCompletions + 1) >= targetDaysThisWeek;

    // Calculate XP
    const xpEarned = calculateHabitXP(habit, {
      currentStreak: newStreak,
      isFirstCompletion: habit.totalCompletions === 0,
      completedAllTargetDaysThisWeek
    });

    // Create completion record
    const completion = await HabitCompletion.create({
      habitId: id,
      userId: req.user.userId,
      completedAt,
      notes,
      xpAwarded: xpEarned,
      streakAtCompletion: newStreak
    }, { transaction });

    // Update habit stats
    habit.currentStreak = newStreak;
    habit.longestStreak = Math.max(habit.longestStreak, newStreak);
    habit.totalCompletions += 1;
    habit.lastCompletedAt = completedAt;
    await habit.save({ transaction });

    // Award XP and handle level-ups
    const result = await awardXP(
      req.user.userId,
      xpEarned,
      'habit_completion',
      { habitId: id, completionId: completion.id },
      transaction
    );

    await transaction.commit();

    // Emit WebSocket events
    emitHabitCompleted(req.user.userId, {
      habitId: id,
      habitTitle: habit.title,
      xpEarned,
      streak: newStreak,
      completedAt,
      leveledUp: result.leveledUp,
      newLevel: result.newLevel
    });

    // Emit streak milestone if it's a significant streak
    if (newStreak > 0 && (newStreak % 7 === 0 || newStreak === 30 || newStreak === 100)) {
      emitStreakMilestone(req.user.userId, {
        habitId: id,
        habitTitle: habit.title,
        streak: newStreak,
        longestStreak: habit.longestStreak
      });
    }

    res.json({
      message: 'Habit completed!',
      completion,
      habit,
      xpEarned,
      ...result
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Complete habit error:', error);
    res.status(500).json({ message: error.message });
  }
};