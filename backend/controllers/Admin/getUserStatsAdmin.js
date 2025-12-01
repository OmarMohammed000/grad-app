import db from '../../models/index.js';

const { User, UserProfile, Character, Task, Habit, TaskCompletion, HabitCompletion, sequelize } = db;

const safeSum = async (model, field, where) => {
  try {
    const result = await model.sum(field, { where });
    return Number(result) || 0;
  } catch (error) {
    console.error(`Error summing ${field}:`, error);
    return 0;
  }
};

/**
 * Get user stats (admin only - bypasses privacy checks)
 * GET /admin/users/:id/stats
 */
export default async function getUserStatsAdmin(req, res) {
  try {
    const { id } = req.params;

    // Get user with profile and character
    const user = await User.findByPk(id, {
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

    // Admin bypasses privacy check - no privacy validation needed

    // Get task statistics
    const [taskStats] = await Task.findAll({
      where: { userId: id },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
        [sequelize.fn('COUNT', sequelize.literal(`CASE WHEN status = 'completed' THEN 1 END`)), 'completed'],
        [sequelize.fn('COUNT', sequelize.literal(`CASE WHEN status IN ('pending','in_progress') THEN 1 END`)), 'active'],
        [sequelize.fn('COUNT', sequelize.literal(`CASE WHEN status = 'pending' THEN 1 END`)), 'pending']
      ],
      raw: true
    });

    // Get habit statistics
    const [habitStats] = await Habit.findAll({
      where: { userId: id, isActive: true },
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

    const [weeklyTaskXP, monthlyTaskXP, weeklyHabitXP, monthlyHabitXP] = await Promise.all([
      safeSum(TaskCompletion, 'xpEarned', {
        userId: id,
        completedAt: { [db.Sequelize.Op.gte]: weekAgo }
      }),
      safeSum(TaskCompletion, 'xpEarned', {
        userId: id,
        completedAt: { [db.Sequelize.Op.gte]: monthAgo }
      }),
      safeSum(HabitCompletion, 'xpEarned', {
        userId: id,
        createdAt: { [db.Sequelize.Op.gte]: weekAgo }
      }),
      safeSum(HabitCompletion, 'xpEarned', {
        userId: id,
        createdAt: { [db.Sequelize.Op.gte]: monthAgo }
      })
    ]);

    // Admin-specific: include account metadata
    const accountInfo = {
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      displayName: user.profile?.displayName || 'Anonymous',
      avatarUrl: user.profile?.avatarUrl,
      isPublicProfile: user.profile?.isPublicProfile
    };

    res.json({
      user: accountInfo,
      character: user.character,
      stats: {
        tasks: taskStats || { total: 0, completed: 0, active: 0, pending: 0 },
        habits: habitStats || { total: 0, avgStreak: 0, maxStreak: 0, totalCompletions: 0 },
        xp: {
          total: user.character?.totalXp || 0,
          weekly: weeklyTaskXP + weeklyHabitXP,
          monthly: monthlyTaskXP + monthlyHabitXP
        }
      }
    });
  } catch (error) {
    console.error('Get user stats (admin) error:', error);
    res.status(500).json({ message: error.message });
  }
}
