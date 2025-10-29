import db from '../../models/index.js';

const { Character, User, UserProfile, sequelize } = db;

export const getGlobalLeaderboard = async (req, res) => {
  try {
    const {
      timeframe = 'all-time', // all-time, monthly, weekly
      limit = 50,
      offset = 0
    } = req.query;

    let dateFilter = {};
    
    if (timeframe === 'weekly') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter = { updatedAt: { [db.Sequelize.Op.gte]: weekAgo } };
    } else if (timeframe === 'monthly') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateFilter = { updatedAt: { [db.Sequelize.Op.gte]: monthAgo } };
    }

    const leaderboard = await Character.findAll({
      where: dateFilter,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email'],
          include: [
            {
              model: UserProfile,
              as: 'profile',
              attributes: ['displayName', 'avatarUrl', 'isPublicProfile']
            }
          ]
        }
      ],
      order: [
        ['level', 'DESC'],
        ['currentXp', 'DESC']
      ],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Format response
    const formattedLeaderboard = leaderboard.map((char, index) => ({
      rank: parseInt(offset) + index + 1,
      userId: char.userId,
      displayName: char.user?.profile?.displayName || 'Anonymous',
      avatarUrl: char.user?.profile?.avatarUrl,
      level: char.level,
      currentXp: char.currentXp,
      totalXp: char.totalXp
    }));

    // Get current user's rank
    let userRank = null;
    if (req.user?.userId) {
      const userCharacter = await Character.findOne({
        where: { userId: req.user.userId }
      });

      if (userCharacter) {
        const higherRanked = await Character.count({
          where: {
            [db.Sequelize.Op.or]: [
              { level: { [db.Sequelize.Op.gt]: userCharacter.level } },
              {
                level: userCharacter.level,
              currentXp: { [db.Sequelize.Op.gt]: userCharacter.currentXp }
              }
            ],
            ...dateFilter
          }
        });

        userRank = {
          rank: higherRanked + 1,
          character: userCharacter
        };
      }
    }

    res.json({
      leaderboard: formattedLeaderboard,
      userRank,
      timeframe,
      total: await Character.count({ where: dateFilter })
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ message: error.message });
  }
};