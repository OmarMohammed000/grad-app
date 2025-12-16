import db from '../../models/index.js';
import { awardXP } from '../../services/xpService.js';
import { finalizeChallengeIfNeeded } from '../../services/challengeStatusService.js';

/**
 * Complete a challenge task
 * POST /challenges/:challengeId/tasks/:taskId/complete
 */
export default async function completeChallengeTask(req, res) {
  const transaction = await db.sequelize.transaction();

  try {
    const { challengeId, taskId } = req.params;
    const { proof, proofImageUrl, durationMinutes } = req.body;

    // Get challenge and task
    const challenge = await db.GroupChallenge.findByPk(challengeId, { transaction });
    const task = await db.ChallengeTask.findByPk(taskId, { transaction });

    if (!challenge) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Challenge not found' });
    }

    if (!task || task.challengeId !== challengeId) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Task not found in this challenge' });
    }

    // Check if task is active
    if (!task.isActive) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Task is not active' });
    }

    // Check availability window
    const now = new Date();
    if (task.availableFrom && now < new Date(task.availableFrom)) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Task is not yet available' });
    }

    if (task.availableUntil && now > new Date(task.availableUntil)) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Task is no longer available' });
    }

    // Get participant
    const participant = await db.ChallengeParticipant.findOne({
      where: {
        challengeId,
        userId: req.user.userId,
        status: 'active'
      },
      transaction
    });

    if (!participant) {
      await transaction.rollback();
      return res.status(403).json({
        message: 'You must be an active participant to complete tasks'
      });
    }

    // Check prerequisites
    if (task.prerequisites && task.prerequisites.length > 0) {
      const completedPrereqs = await db.ChallengeTaskCompletion.count({
        where: {
          participantId: participant.id,
          challengeTaskId: { [db.Sequelize.Op.in]: task.prerequisites },
          status: 'approved' // Only approved completions count
        },
        transaction
      });

      if (completedPrereqs < task.prerequisites.length) {
        await transaction.rollback();
        return res.status(400).json({
          message: 'Prerequisites not completed'
        });
      }
    }

    // Check if already completed (for non-repeatable tasks)
    const previousCompletions = await db.ChallengeTaskCompletion.count({
      where: {
        challengeTaskId: taskId,
        participantId: participant.id,
        status: { [db.Sequelize.Op.ne]: 'rejected' } // Count pending or approved
      },
      transaction
    });

    if (!task.isRepeatable && previousCompletions > 0) {
      await transaction.rollback();
      return res.status(400).json({
        message: 'Task already completed or pending verification'
      });
    }

    if (task.isRepeatable && task.maxCompletions && previousCompletions >= task.maxCompletions) {
      await transaction.rollback();
      return res.status(400).json({
        message: `Maximum completions (${task.maxCompletions}) reached for this task`
      });
    }

    // Check if proof is required
    if (task.requiresProof && !proof && !proofImageUrl) {
      await transaction.rollback();
      return res.status(400).json({
        message: 'Proof is required for this task',
        proofInstructions: task.proofInstructions
      });
    }

    // Check verification type
    const verificationType = challenge.verificationType || 'none';
    let status = 'approved'; // Default for 'none'
    let aiResult = null;
    let rejectionReason = null;

    if (verificationType === 'manual') {
      status = 'pending';
      // If manual, we don't award XP yet
    } else if (verificationType === 'ai') {
      if (!proofImageUrl) {
        await transaction.rollback();
        return res.status(400).json({ message: 'Image proof is required for AI verification' });
      }

      // Call AI service
      try {
        const { verifyImage } = await import('../../services/aiVerificationService.js');
        aiResult = await verifyImage(proofImageUrl, task.description || task.title);

        if (aiResult.approved) {
          status = 'approved';
        } else {
          status = 'rejected';
          rejectionReason = aiResult.reason;
        }
      } catch (error) {
        console.error('AI Verification failed:', error);
        // Fallback to manual if AI fails? Or just fail?
        // Let's fail for now to avoid bypassing checks
        await transaction.rollback();
        return res.status(500).json({ message: 'AI verification service unavailable' });
      }
    }

    // Create completion record
    const completion = await db.ChallengeTaskCompletion.create({
      challengeTaskId: taskId,
      participantId: participant.id,
      userId: req.user.userId,
      pointsEarned: status === 'approved' ? task.pointValue : 0,
      xpEarned: status === 'approved' ? task.xpReward : 0,
      completedAt: new Date(),
      proof,
      proofImageUrl,
      durationMinutes,
      completionNumber: previousCompletions + 1,
      status,
      rejectionReason,
      aiAnalysis: aiResult,
      isVerified: status === 'approved' && verificationType !== 'manual', // Auto-verified if AI approved or no verification
      verifiedAt: status === 'approved' && verificationType !== 'manual' ? new Date() : null,
      verifiedBy: status === 'approved' && verificationType === 'ai' ? null : null // System verified for AI (null for now, or use a system user ID)
    }, { transaction });

    // Only update progress and award XP if approved
    let challengeCompleted = false;

    if (status === 'approved') {
      // Update participant progress
      participant.completedTasksCount += 1;
      participant.totalPoints += task.pointValue;
      participant.totalXpEarned += task.xpReward;

      // Update currentProgress based on challenge goal type
      if (challenge.goalType === 'total_xp') {
        participant.currentProgress = participant.totalXpEarned;
      } else {
        // Default task_count
        participant.currentProgress = participant.completedTasksCount;
      }
      participant.lastActivityDate = new Date().toISOString().split('T')[0];

      // Update streak
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      if (participant.lastActivityDate === yesterday) {
        participant.streakDays += 1;
        participant.longestStreak = Math.max(participant.longestStreak, participant.streakDays);
      } else if (participant.lastActivityDate !== today) {
        participant.streakDays = 1;
      }

      // Check if challenge goal reached
      if (participant.currentProgress >= challenge.goalTarget && participant.status === 'active') {
        participant.status = 'completed';
        participant.completedAt = new Date();
        challengeCompleted = true;

        // Award bonus XP for completing challenge
        if (challenge.xpReward > 0) {
          // Update character total challenges completed
          const character = await db.Character.findOne({
            where: { userId: req.user.userId },
            transaction
          });

          if (character) {
            character.totalChallengesCompleted += 1;
            character.xp += challenge.xpReward; // Award bonus XP
            await character.save({ transaction });
          }
        }
      }

      await participant.save({ transaction });

      // Ensure challenge-level completion status is updated when appropriate
      await finalizeChallengeIfNeeded(challenge, {
        checkParticipants: true,
        transaction
      });

      // Update task completion count
      task.completionCount += 1;
      await task.save({ transaction });

      const progressIncrement = challenge.goalType === 'total_xp' ? task.xpReward : 1;

      // Create daily progress entry
      const progressToday = await db.ChallengeProgress.findOne({
        where: {
          participantId: participant.id,
          date: today
        },
        transaction
      });

      if (progressToday) {
        progressToday.tasksCompleted += 1;
        progressToday.xpEarned += task.xpReward;
        progressToday.pointsEarned += task.pointValue;
        progressToday.progressValue += progressIncrement;
        progressToday.cumulativeProgress = participant.currentProgress;
        progressToday.streakCount = participant.streakDays;
        await progressToday.save({ transaction });
      } else {
        await db.ChallengeProgress.create({
          participantId: participant.id,
          challengeId,
          userId: req.user.userId,
          date: today,
          progressValue: progressIncrement,
          tasksCompleted: 1,
          xpEarned: task.xpReward,
          pointsEarned: task.pointValue,
          cumulativeProgress: participant.currentProgress,
          streakCount: participant.streakDays
        }, { transaction });
      }

      // Award XP to user character (if verification not required)
      await awardXP(
        req.user.userId,
        task.xpReward,
        'challenge_task_completed',
        { challengeId, taskId, taskTitle: task.title },
        transaction
      );
    }

    // Create notification for AI verification result
    if (verificationType === 'ai') {
      await db.Notification.create({
        userId: req.user.userId,
        type: 'verification_result',
        message: status === 'approved'
          ? `Your task "${task.title}" was approved by AI! +${task.xpReward} XP`
          : `Your task "${task.title}" was rejected by AI: ${rejectionReason}`,
        metadata: {
          challengeId,
          taskId,
          completionId: completion.id,
          status
        }
      }, { transaction });
    }

    await transaction.commit();

    return res.json({
      message: status === 'pending'
        ? 'Task submitted for verification.'
        : status === 'rejected'
          ? `Task rejected: ${rejectionReason}`
          : 'Task completed successfully!',
      completion,
      participant,
      challengeCompleted: participant.status === 'completed'
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error completing challenge task:', error);
    return res.status(500).json({
      message: 'An error occurred while completing the task',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
