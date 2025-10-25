import db from '../../models/index.js';

/**
 * Get challenge leaderboard
 * GET /challenges/:id/leaderboard
 */
export default async function getChallengeLeaderboard(req, res) {
  try {
    const { id } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const challenge = await db.GroupChallenge.findByPk(id);

    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    // Get participants ordered by rank
    const participants = await db.ChallengeParticipant.findAll({
      where: {
        challengeId: id,
        status: { [db.Sequelize.Op.in]: ['active', 'completed'] }
      },
      include: [
        {
          model: db.User,
          as: 'user',
          attributes: ['id'],
          include: [
            {
              model: db.UserProfile,
              as: 'profile',
              attributes: ['displayName', 'avatarUrl']
            }
          ]
        }
      ],
      order: [
        ['totalPoints', 'DESC'],
        ['completedTasksCount', 'DESC'],
        ['currentProgress', 'DESC']
      ],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Calculate ranks
    const leaderboard = participants.map((participant, index) => ({
      rank: parseInt(offset) + index + 1,
      userId: participant.userId,
      displayName: participant.user?.profile?.displayName || 'Anonymous',
      avatarUrl: participant.user?.profile?.avatarUrl,
      totalPoints: participant.totalPoints,
      currentProgress: participant.currentProgress,
      completedTasksCount: participant.completedTasksCount,
      totalXpEarned: participant.totalXpEarned,
      streakDays: participant.streakDays,
      status: participant.status,
      badges: participant.badges
    }));

    // Get current user's rank
    let userRank = null;
    const userParticipant = participants.find(p => p.userId === req.user.userId);
    
    if (!userParticipant) {
      // User not in current page, find their rank
      const higherRanked = await db.ChallengeParticipant.count({
        where: {
          challengeId: id,
          status: { [db.Sequelize.Op.in]: ['active', 'completed'] },
          [db.Sequelize.Op.or]: [
            { totalPoints: { [db.Sequelize.Op.gt]: userParticipant?.totalPoints || 0 } },
            {
              totalPoints: userParticipant?.totalPoints || 0,
              completedTasksCount: { [db.Sequelize.Op.gt]: userParticipant?.completedTasksCount || 0 }
            }
          ]
        }
      });

      if (userParticipant) {
        userRank = {
          rank: higherRanked + 1,
          ...userParticipant.toJSON()
        };
      }
    } else {
      userRank = leaderboard.find(entry => entry.userId === req.user.userId);
    }

    return res.json({
      leaderboard,
      userRank,
      challenge: {
        id: challenge.id,
        title: challenge.title,
        goalTarget: challenge.goalTarget,
        goalType: challenge.goalType,
        status: challenge.status
      },
      total: await db.ChallengeParticipant.count({
        where: {
          challengeId: id,
          status: { [db.Sequelize.Op.in]: ['active', 'completed'] }
        }
      })
    });

  } catch (error) {
    console.error('Error fetching challenge leaderboard:', error);
    return res.status(500).json({
      message: 'An error occurred while fetching the leaderboard',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
