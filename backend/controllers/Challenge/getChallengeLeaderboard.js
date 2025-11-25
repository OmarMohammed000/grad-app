import db from '../../models/index.js';

/**
 * Get challenge leaderboard
 * GET /challenges/:id/leaderboard
 */
export default async function getChallengeLeaderboard(req, res) {
  try {
    const { id } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const challenge = await db.GroupChallenge.findByPk(id, {
      attributes: ['id', 'title', 'goalTarget', 'goalType', 'status']
    });

    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    // Get participants ordered by rank
    // Optimized: Only select necessary fields
    const participants = await db.ChallengeParticipant.findAll({
      where: {
        challengeId: id,
        status: { [db.Sequelize.Op.in]: ['active', 'completed'] }
      },
      attributes: [
        'userId', 
        'totalPoints', 
        'currentProgress', 
        'completedTasksCount', 
        'totalXpEarned', 
        'streakDays', 
        'status', 
        'badges'
      ],
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
    
    // Check if user is in the current page
    const userEntry = leaderboard.find(entry => entry.userId === req.user.userId);
    
    if (userEntry) {
      userRank = userEntry;
    } else {
      // User not in current page, fetch their specific data
      const userParticipant = await db.ChallengeParticipant.findOne({
        where: {
          challengeId: id,
          userId: req.user.userId
        },
        attributes: [
          'userId', 
          'totalPoints', 
          'currentProgress', 
          'completedTasksCount', 
          'totalXpEarned', 
          'streakDays', 
          'status', 
          'badges'
        ]
      });

      if (userParticipant && (userParticipant.status === 'active' || userParticipant.status === 'completed')) {
        // Calculate rank efficiently
        const higherRankedCount = await db.ChallengeParticipant.count({
          where: {
            challengeId: id,
            status: { [db.Sequelize.Op.in]: ['active', 'completed'] },
            [db.Sequelize.Op.or]: [
              { totalPoints: { [db.Sequelize.Op.gt]: userParticipant.totalPoints } },
              {
                totalPoints: userParticipant.totalPoints,
                completedTasksCount: { [db.Sequelize.Op.gt]: userParticipant.completedTasksCount }
              }
            ]
          }
        });

        // Fetch user profile for display
        const userProfile = await db.UserProfile.findOne({
          where: { userId: req.user.userId },
          attributes: ['displayName', 'avatarUrl']
        });

        userRank = {
          rank: higherRankedCount + 1,
          userId: userParticipant.userId,
          displayName: userProfile?.displayName || 'You',
          avatarUrl: userProfile?.avatarUrl,
          totalPoints: userParticipant.totalPoints,
          currentProgress: userParticipant.currentProgress,
          completedTasksCount: userParticipant.completedTasksCount,
          totalXpEarned: userParticipant.totalXpEarned,
          streakDays: userParticipant.streakDays,
          status: userParticipant.status,
          badges: userParticipant.badges
        };
      }
    }

    return res.json({
      leaderboard,
      userRank,
      challenge, // Already selected specific attributes above
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
