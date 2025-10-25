import db from '../../models/index.js';

/**
 * Get single challenge by ID
 * GET /challenges/:id
 */
export default async function getChallenge(req, res) {
  try {
    const { id } = req.params;

    const challenge = await db.GroupChallenge.findByPk(id, {
      include: [
        {
          model: db.User,
          as: 'creator',
          attributes: ['id'],
          include: [
            {
              model: db.UserProfile,
              as: 'profile',
              attributes: ['displayName', 'avatarUrl']
            }
          ]
        },
        {
          model: db.ChallengeTask,
          as: 'challengeTasks',
          where: { isActive: true },
          required: false,
          order: [['orderIndex', 'ASC']]
        },
        {
          model: db.ChallengeParticipant,
          as: 'participants',
          where: { status: { [db.Sequelize.Op.in]: ['active', 'completed'] } },
          required: false,
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
          order: [['rank', 'ASC'], ['totalPoints', 'DESC']]
        }
      ]
    });

    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    // Check if challenge is private and user is not a participant
    if (!challenge.isPublic) {
      const isParticipant = challenge.participants?.some(p => p.userId === req.user.userId);
      const isCreator = challenge.createdBy === req.user.userId;

      if (!isParticipant && !isCreator) {
        return res.status(403).json({ 
          message: 'This is a private challenge. You need an invite code to access it.' 
        });
      }
    }

    // Check if user has joined
    const userParticipation = challenge.participants?.find(p => p.userId === req.user.userId);

    return res.json({
      challenge: {
        ...challenge.toJSON(),
        hasJoined: !!userParticipation,
        userParticipation: userParticipation || null,
        canJoin: !userParticipation && 
                 challenge.status === 'active' && 
                 (!challenge.maxParticipants || challenge.currentParticipants < challenge.maxParticipants)
      }
    });

  } catch (error) {
    console.error('Error fetching challenge:', error);
    return res.status(500).json({
      message: 'An error occurred while fetching the challenge',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
