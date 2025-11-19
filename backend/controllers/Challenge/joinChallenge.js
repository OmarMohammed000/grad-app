import db from '../../models/index.js';

/**
 * Join a challenge
 * POST /challenges/:id/join
 */
export default async function joinChallenge(req, res) {
  const transaction = await db.sequelize.transaction();

  try {
    const { id } = req.params;
    const { inviteCode, teamId } = req.body;

    const challenge = await db.GroupChallenge.findByPk(id, { transaction });

    if (!challenge) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Challenge not found' });
    }

    // Check if challenge is active
    if (challenge.status !== 'active' && challenge.status !== 'upcoming') {
      await transaction.rollback();
      return res.status(400).json({ 
        message: `Cannot join a ${challenge.status} challenge` 
      });
    }

    // Check if challenge is private and requires invite code
    let invitedByUserId = null;
    if (!challenge.isPublic) {
      if (!inviteCode || inviteCode !== challenge.inviteCode) {
        await transaction.rollback();
        return res.status(403).json({ 
          message: 'Invalid or missing invite code for private challenge' 
        });
      }
      
      // Try to find who shared the invite code (if provided in request)
      // For now, we'll track if someone shared the code by checking if there's an inviter
      // In future, we can add a separate endpoint to invite specific users
      const { inviterId } = req.body;
      if (inviterId && inviterId !== req.user.userId) {
        // Verify inviter is a participant
        const inviter = await db.ChallengeParticipant.findOne({
          where: {
            challengeId: id,
            userId: inviterId
          },
          transaction
        });
        if (inviter) {
          invitedByUserId = inviterId;
        }
      }
    }

    // Check if already joined
    const existingParticipant = await db.ChallengeParticipant.findOne({
      where: {
        challengeId: id,
        userId: req.user.userId
      },
      transaction
    });

    if (existingParticipant) {
      await transaction.rollback();
      return res.status(400).json({ 
        message: 'You have already joined this challenge',
        participant: existingParticipant
      });
    }

    // Check max participants
    if (challenge.maxParticipants && challenge.currentParticipants >= challenge.maxParticipants) {
      await transaction.rollback();
      return res.status(400).json({ 
        message: 'Challenge is full. Maximum participants reached.' 
      });
    }

    // Create participant
    const participant = await db.ChallengeParticipant.create({
      challengeId: id,
      userId: req.user.userId,
      status: 'active',
      teamId: challenge.isTeamBased ? teamId : null,
      invitedBy: invitedByUserId, // Track who invited this user (if applicable)
      joinedAt: new Date()
    }, { transaction });

    // Update challenge participant count
    challenge.currentParticipants += 1;
    await challenge.save({ transaction });

    // Update character challenge count
    const character = await db.Character.findOne({
      where: { userId: req.user.userId },
      transaction
    });

    if (character) {
      character.totalChallengesJoined += 1;
      await character.save({ transaction });
    }

    // Log activity
    await db.ActivityLog.create({
      userId: req.user.userId,
      activityType: 'challenge_joined',
      description: `Joined challenge: ${challenge.title}`,
      isPublic: true,
      importance: 'medium'
    }, { transaction });

    await transaction.commit();

    return res.status(201).json({
      message: 'Successfully joined the challenge',
      participant,
      challenge
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error joining challenge:', error);
    return res.status(500).json({
      message: 'An error occurred while joining the challenge',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
