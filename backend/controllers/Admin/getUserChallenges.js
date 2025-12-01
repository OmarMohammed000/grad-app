import db from '../../models/index.js';

/**
 * Get all challenges a user has participated in (admin only)
 * GET /admin/users/:id/challenges
 */
export default async function getUserChallenges(req, res) {
  try {
    const { id } = req.params;

    // Verify user exists
    const user = await db.User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get all challenge participations for this user
    const participations = await db.ChallengeParticipant.findAll({
      where: { userId: id },
      include: [
        {
          model: db.GroupChallenge,
          as: 'challenge',
          include: [
            {
              model: db.User,
              as: 'creator',
              attributes: ['id'],
              include: [
                {
                  model: db.UserProfile,
                  as: 'profile',
                  attributes: ['displayName']
                }
              ]
            },
            {
              model: db.ChallengeTask,
              as: 'challengeTasks',
              attributes: ['id', 'title', 'taskType']
            }
          ]
        }
      ],
      order: [['joinedAt', 'DESC']]
    });

    // Format the response
    const challenges = participations.map(participation => {
      const challenge = participation.challenge;
      return {
        id: challenge.id,
        title: challenge.title,
        description: challenge.description,
        status: challenge.status,
        challengeType: challenge.challengeType,
        isGlobal: challenge.isGlobal,
        startDate: challenge.startDate,
        endDate: challenge.endDate,
        creatorName: challenge.creator?.profile?.displayName || 'Unknown',
        isCreator: challenge.createdBy === id,
        // User's participation details
        participation: {
          joinedAt: participation.joinedAt,
          status: participation.status,
          role: participation.role,
          currentProgress: participation.currentProgress,
          totalPoints: participation.totalPoints,
          totalXpEarned: participation.totalXpEarned,
          rank: participation.rank,
          completedTasksCount: participation.completedTasksCount,
          completedAt: participation.completedAt,
          streakDays: participation.streakDays,
          longestStreak: participation.longestStreak
        },
        // Challenge summary
        totalTasks: challenge.challengeTasks?.length || 0,
        goalType: challenge.goalType,
        goalTarget: challenge.goalTarget
      };
    });

    res.json({
      userId: id,
      totalChallenges: challenges.length,
      challenges
    });

  } catch (error) {
    console.error('Get user challenges (admin) error:', error);
    res.status(500).json({ 
      message: 'An error occurred while fetching user challenges',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
