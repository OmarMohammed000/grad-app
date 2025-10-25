import db from '../../models/index.js';

const { User, UserProfile, Character, Task, Habit, TaskCompletion, HabitCompletion, sequelize } = db;

export const getUserStats = async (req, res) => {
  try {
    const { id } = req.params;
    const targetUserId = id === 'me' ? req.user.userId : id;

    // Get user with profile and character
    const user = await User.findByPk(targetUserId, {
      include: [
        {
          model: UserProfile,
          as: 'profile'
        },
        {
          model: Character,
          as: 'character',
          include: [{ model: db.Rank, as: 'rank' }]
        }
      ]
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Privacy check - only show if public profile or own profile
    if (targetUserId !== req.user.userId && !user.profile?.isPublicProfile) {
      return res.status(403).json({ message: 'Profile is private' });
    }

    // Get task statistics
    const [taskStats] = await Task.findAll({
      where: { userId: targetUserId },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
        [sequelize.fn('COUNT', sequelize.literal(`CASE WHEN status = 'completed' THEN 1 END`)), 'completed'],
        [sequelize.fn('COUNT', sequelize.literal(`CASE WHEN status = 'active' THEN 1 END`)), 'active'],
        [sequelize.fn('COUNT', sequelize.literal(`CASE WHEN status = 'pending' THEN 1 END`)), 'pending']
      ],
      raw: true
    });

    // Get habit statistics
    const [habitStats] = await Habit.findAll({
      where: { userId: targetUserId, isActive: true },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
        [sequelize.fn('AVG', sequelize.col('currentStreak')), 'avgStreak'],
        [sequelize.fn('MAX', sequelize.col('longestStreak')), 'maxStreak'],
        [sequelize.fn('SUM', sequelize.col('totalCompletions')), 'totalCompletions']
      ],
      raw: true
    });

    // Get XP earned this week/month
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const [weeklyTaskXP, monthlyTaskXP] = await Promise.all([
      TaskCompletion.sum('xpEarned', {
        where: {
          userId: targetUserId,
          completedAt: { [db.Sequelize.Op.gte]: weekAgo }
        }
      }),
      TaskCompletion.sum('xpEarned', {
        where: {
          userId: targetUserId,
          completedAt: { [db.Sequelize.Op.gte]: monthAgo }
        }
      })
    ]);

    const [weeklyHabitXP, monthlyHabitXP] = await Promise.all([
      HabitCompletion.sum('xpAwarded', {
        where: {
          userId: targetUserId,
          completedAt: { [db.Sequelize.Op.gte]: weekAgo }
        }
      }),
      HabitCompletion.sum('xpAwarded', {
        where: {
          userId: targetUserId,
          completedAt: { [db.Sequelize.Op.gte]: monthAgo }
        }
      })
    ]);

    res.json({
      user: {
        id: user.id,
        displayName: user.profile?.displayName || 'Anonymous',
        avatarUrl: user.profile?.avatarUrl
      },
      character: user.character,
      stats: {
        tasks: taskStats || { total: 0, completed: 0, active: 0, pending: 0 },
        habits: habitStats || { total: 0, avgStreak: 0, maxStreak: 0, totalCompletions: 0 },
        xp: {
          total: user.character?.totalXp || 0,
          weekly: (weeklyTaskXP || 0) + (weeklyHabitXP || 0),
          monthly: (monthlyTaskXP || 0) + (monthlyHabitXP || 0)
        }
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ message: error.message });
  }
};
