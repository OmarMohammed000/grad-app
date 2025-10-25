import db from '../../models/index.js';

/**
 * Update challenge (creator or moderator only)
 * PUT /challenges/:id
 */
export default async function updateChallenge(req, res) {
  const transaction = await db.sequelize.transaction();

  try {
    const { id } = req.params;
    const {
      title,
      description,
      goalTarget,
      goalDescription,
      maxParticipants,
      xpReward,
      startDate,
      endDate,
      tags,
      rules,
      prizeDescription,
      difficultyLevel,
      status
    } = req.body;

    const challenge = await db.GroupChallenge.findByPk(id, { transaction });

    if (!challenge) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Challenge not found' });
    }

    // Check if user is creator or moderator
    const participant = await db.ChallengeParticipant.findOne({
      where: {
        challengeId: id,
        userId: req.user.userId
      },
      transaction
    });

    const isCreator = challenge.createdBy === req.user.userId;
    const isModerator = participant?.role === 'moderator';

    if (!isCreator && !isModerator) {
      await transaction.rollback();
      return res.status(403).json({ 
        message: 'Only the challenge creator or moderators can update this challenge' 
      });
    }

    // Prevent updates if challenge is completed or cancelled
    if (challenge.status === 'completed' || challenge.status === 'cancelled') {
      await transaction.rollback();
      return res.status(400).json({ 
        message: `Cannot update a ${challenge.status} challenge` 
      });
    }

    // Update fields
    if (title !== undefined) challenge.title = title.trim();
    if (description !== undefined) challenge.description = description?.trim();
    if (goalTarget !== undefined) challenge.goalTarget = goalTarget;
    if (goalDescription !== undefined) challenge.goalDescription = goalDescription;
    if (maxParticipants !== undefined) {
      // Can't reduce below current participants
      if (maxParticipants && maxParticipants < challenge.currentParticipants) {
        await transaction.rollback();
        return res.status(400).json({ 
          message: `Maximum participants cannot be less than current participants (${challenge.currentParticipants})` 
        });
      }
      challenge.maxParticipants = maxParticipants;
    }
    if (xpReward !== undefined) challenge.xpReward = xpReward;
    if (tags !== undefined) challenge.tags = tags;
    if (rules !== undefined) challenge.rules = rules;
    if (prizeDescription !== undefined) challenge.prizeDescription = prizeDescription;
    if (difficultyLevel !== undefined) challenge.difficultyLevel = difficultyLevel;

    // Update dates (with validation)
    if (startDate !== undefined) {
      const newStartDate = new Date(startDate);
      if (challenge.endDate && newStartDate >= challenge.endDate) {
        await transaction.rollback();
        return res.status(400).json({ message: 'Start date must be before end date' });
      }
      challenge.startDate = newStartDate;
    }

    if (endDate !== undefined) {
      const newEndDate = new Date(endDate);
      if (challenge.startDate && newEndDate <= challenge.startDate) {
        await transaction.rollback();
        return res.status(400).json({ message: 'End date must be after start date' });
      }
      challenge.endDate = newEndDate;
    }

    // Allow creator to change status (with restrictions)
    if (status !== undefined && isCreator) {
      const validTransitions = {
        'upcoming': ['active', 'cancelled'],
        'active': ['completed', 'cancelled'],
        'completed': [], // Cannot change from completed
        'cancelled': [] // Cannot change from cancelled
      };

      if (!validTransitions[challenge.status]?.includes(status)) {
        await transaction.rollback();
        return res.status(400).json({ 
          message: `Cannot transition from ${challenge.status} to ${status}` 
        });
      }

      challenge.status = status;
      
      if (status === 'completed') {
        challenge.completedAt = new Date();
      }
    }

    await challenge.save({ transaction });

    await transaction.commit();

    return res.json({
      message: 'Challenge updated successfully',
      challenge
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error updating challenge:', error);
    return res.status(500).json({
      message: 'An error occurred while updating the challenge',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
