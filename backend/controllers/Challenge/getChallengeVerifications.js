import db from '../../models/index.js';

/**
 * Get pending verifications for a challenge
 * GET /challenges/:id/verifications
 */
export default async function getChallengeVerifications(req, res) {
  try {
    const { id } = req.params;

    const challenge = await db.GroupChallenge.findByPk(id);

    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    // Verify user is creator/admin
    if (challenge.createdBy !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only challenge creator can view verifications' });
    }

    const pendingCompletions = await db.ChallengeTaskCompletion.findAll({
      where: {
        status: 'pending'
      },
      include: [
        {
          model: db.ChallengeTask,
          as: 'challengeTask',
          where: { challengeId: id },
          attributes: ['id', 'title', 'pointValue', 'xpReward']
        },
        {
          model: db.User,
          as: 'user',
          attributes: ['id'],
          include: [{
            model: db.UserProfile,
            as: 'profile',
            attributes: ['displayName', 'avatarUrl']
          }]
        }
      ],
      order: [['createdAt', 'ASC']]
    });

    return res.json({
      verifications: pendingCompletions
    });

  } catch (error) {
    console.error('Error fetching verifications:', error);
    return res.status(500).json({
      message: 'An error occurred while fetching verifications',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
