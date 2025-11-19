import db from '../../models/index.js';

/**
 * Find a challenge by invite code
 * GET /challenges/by-code/:inviteCode
 */
export default async function findChallengeByCode(req, res) {
  try {
    const { inviteCode } = req.params;

    if (!inviteCode || inviteCode.trim().length === 0) {
      return res.status(400).json({ message: 'Invite code is required' });
    }

    const challenge = await db.GroupChallenge.findOne({
      where: {
        inviteCode: inviteCode.trim()
      },
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
        }
      ]
    });

    if (!challenge) {
      return res.status(404).json({ 
        message: 'Challenge not found. Please check the invite code.' 
      });
    }

    // Check if challenge is active/upcoming
    if (challenge.status !== 'active' && challenge.status !== 'upcoming') {
      return res.status(400).json({ 
        message: `This challenge is ${challenge.status} and cannot be joined.` 
      });
    }

    // Check if user has already joined
    const existingParticipant = await db.ChallengeParticipant.findOne({
      where: {
        challengeId: challenge.id,
        userId: req.user.userId
      }
    });

    // Return challenge info (without sensitive data)
    return res.json({
      challenge: {
        id: challenge.id,
        title: challenge.title,
        description: challenge.description,
        challengeType: challenge.challengeType,
        goalType: challenge.goalType,
        goalTarget: challenge.goalTarget,
        goalDescription: challenge.goalDescription,
        status: challenge.status,
        isPublic: challenge.isPublic,
        maxParticipants: challenge.maxParticipants,
        currentParticipants: challenge.currentParticipants,
        xpReward: challenge.xpReward,
        startDate: challenge.startDate,
        endDate: challenge.endDate,
        tags: challenge.tags,
        difficultyLevel: challenge.difficultyLevel,
        creator: challenge.creator,
        hasJoined: !!existingParticipant,
        canJoin: !existingParticipant && 
                 (challenge.status === 'active' || challenge.status === 'upcoming') &&
                 (!challenge.maxParticipants || challenge.currentParticipants < challenge.maxParticipants)
      }
    });

  } catch (error) {
    console.error('Error finding challenge by code:', error);
    return res.status(500).json({
      message: 'An error occurred while finding the challenge',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

