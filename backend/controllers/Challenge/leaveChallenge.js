import db from '../../models/index.js';

/**
 * Leave a challenge
 * POST /challenges/:id/leave
 */
export default async function leaveChallenge(req, res) {
  const transaction = await db.sequelize.transaction();

  try {
    const { id } = req.params;

    const challenge = await db.GroupChallenge.findByPk(id, { transaction });

    if (!challenge) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Challenge not found' });
    }

    // Find participant
    const participant = await db.ChallengeParticipant.findOne({
      where: {
        challengeId: id,
        userId: req.user.userId
      },
      transaction
    });

    if (!participant) {
      await transaction.rollback();
      return res.status(404).json({ 
        message: 'You are not a participant in this challenge' 
      });
    }

    // Cannot leave if you're the creator
    if (challenge.createdBy === req.user.userId) {
      await transaction.rollback();
      return res.status(400).json({ 
        message: 'Challenge creator cannot leave. Delete the challenge instead.' 
      });
    }

    // Cannot leave if already completed
    if (participant.status === 'completed') {
      await transaction.rollback();
      return res.status(400).json({ 
        message: 'Cannot leave a completed challenge' 
      });
    }

    // Update participant status
    participant.status = 'dropped_out';
    participant.droppedAt = new Date();
    await participant.save({ transaction });

    // Update challenge participant count
    if (challenge.currentParticipants > 0) {
      challenge.currentParticipants -= 1;
      await challenge.save({ transaction });
    }

    // Log activity
    await db.ActivityLog.create({
      userId: req.user.userId,
      activityType: 'challenge_left',
      description: `Left challenge: ${challenge.title}`,
      isPublic: false,
      importance: 'info'
    }, { transaction });

    await transaction.commit();

    return res.json({
      message: 'Successfully left the challenge',
      participant
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error leaving challenge:', error);
    return res.status(500).json({
      message: 'An error occurred while leaving the challenge',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
