import db from '../../models/index.js';

/**
 * Verify a challenge task completion (Approve/Reject)
 * POST /challenges/:challengeId/completions/:completionId/verify
 */
export default async function verifyChallengeTask(req, res) {
  const transaction = await db.sequelize.transaction();

  try {
    const { challengeId, completionId } = req.params;
    const { status, rejectionReason } = req.body; // 'approved' or 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Invalid status. Must be approved or rejected.' });
    }

    if (status === 'rejected' && !rejectionReason) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Rejection reason is required.' });
    }

    const completion = await db.ChallengeTaskCompletion.findByPk(completionId, {
      include: [
        { model: db.ChallengeTask, as: 'challengeTask' },
        { model: db.ChallengeParticipant, as: 'participant' }
      ],
      transaction
    });

    if (!completion) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Completion not found' });
    }

    if (completion.status !== 'pending') {
      await transaction.rollback();
      return res.status(400).json({ message: `Completion is already ${completion.status}` });
    }

    // Verify user is creator/admin of the challenge
    const challenge = await db.GroupChallenge.findByPk(challengeId, { transaction });
    if (challenge.createdBy !== req.user.userId && req.user.role !== 'admin') {
      await transaction.rollback();
      return res.status(403).json({ message: 'Only challenge creator or admins can verify tasks' });
    }

    // Update completion status
    completion.status = status;
    completion.isVerified = true;
    completion.verifiedBy = req.user.userId;
    completion.verifiedAt = new Date();
    if (status === 'rejected') {
      completion.rejectionReason = rejectionReason;
    }
    await completion.save({ transaction });

    // If approved, award XP and update progress (similar to completeChallengeTask logic)
    if (status === 'approved') {
      const participant = completion.participant;
      const task = completion.challengeTask;

      // Update points/XP in completion record if they were 0
      completion.pointsEarned = task.pointValue;
      completion.xpEarned = task.xpReward;
      await completion.save({ transaction });

      // Update participant progress
      participant.totalPoints += task.pointValue;
      participant.totalXpEarned += task.xpReward;
      participant.completedTasksCount += 1;

      if (challenge.goalType === 'task_count') {
        participant.currentProgress += 1;
      } else if (challenge.goalType === 'total_xp') {
        participant.currentProgress += task.xpReward;
      }

      // Check completion
      let challengeCompleted = false;
      if (participant.currentProgress >= challenge.goalTarget && participant.status === 'active') {
        participant.status = 'completed';
        participant.completedAt = new Date();
        challengeCompleted = true;
        
        participant.totalXpEarned += challenge.xpReward;
        
        const character = await db.Character.findOne({
          where: { userId: participant.userId },
          transaction
        });
        if (character) {
          character.totalChallengesCompleted += 1;
          await character.save({ transaction });
        }
      }
      await participant.save({ transaction });

      // Update daily progress
      const today = new Date().toISOString().split('T')[0];
      const [dailyProgress] = await db.ChallengeProgress.findOrCreate({
        where: {
          challengeId,
          participantId: participant.id,
          date: today
        },
        defaults: {
          userId: participant.userId,
          progressValue: 0,
          tasksCompleted: 0,
          xpEarned: 0,
          pointsEarned: 0,
          cumulativeProgress: participant.currentProgress,
          streakCount: participant.streakDays
        },
        transaction
      });

      await dailyProgress.increment({
        progressValue: challenge.goalType === 'task_count' ? 1 : task.xpReward,
        tasksCompleted: 1,
        xpEarned: task.xpReward,
        pointsEarned: task.pointValue
      }, { transaction });

      // Award XP to character
      const character = await db.Character.findOne({
        where: { userId: participant.userId },
        transaction
      });
      if (character) {
        character.xp += task.xpReward;
        if (challengeCompleted) {
          character.xp += challenge.xpReward;
        }
        await character.save({ transaction });
      }
    }

    // Create notification for user
    await db.Notification.create({
      userId: completion.userId,
      type: 'verification_result',
      message: status === 'approved' 
        ? `Your task "${completion.challengeTask.title}" was approved! +${completion.challengeTask.xpReward} XP`
        : `Your task "${completion.challengeTask.title}" was rejected: ${rejectionReason}`,
      metadata: {
        challengeId,
        taskId: completion.challengeTaskId,
        completionId: completion.id,
        status
      }
    }, { transaction });

    await transaction.commit();

    return res.json({
      message: `Task ${status} successfully`,
      completion
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error verifying task:', error);
    return res.status(500).json({
      message: 'An error occurred while verifying the task',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
