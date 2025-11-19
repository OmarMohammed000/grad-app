import db from '../../models/index.js';
import { awardXP } from '../../services/xpService.js';

/**
 * Complete a challenge task
 * POST /challenges/:challengeId/tasks/:taskId/complete
 */
export default async function completeChallengeTask(req, res) {
  const transaction = await db.sequelize.transaction();

  try {
    const { challengeId, taskId } = req.params;
    // const { proof, proofImageUrl, durationMinutes } = req.body; // TODO: Verification system not yet implemented
    const { durationMinutes } = req.body;

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
          challengeTaskId: { [db.Sequelize.Op.in]: task.prerequisites }
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
        participantId: participant.id
      },
      transaction
    });

    if (!task.isRepeatable && previousCompletions > 0) {
      await transaction.rollback();
      return res.status(400).json({ 
        message: 'Task already completed' 
      });
    }

    if (task.isRepeatable && task.maxCompletions && previousCompletions >= task.maxCompletions) {
      await transaction.rollback();
      return res.status(400).json({ 
        message: `Maximum completions (${task.maxCompletions}) reached for this task` 
      });
    }

    // TODO: Verification system not yet implemented
    // Check if proof is required
    // if (task.requiresProof && !proof && !proofImageUrl) {
    //   await transaction.rollback();
    //   return res.status(400).json({ 
    //     message: 'Proof is required for this task',
    //     proofInstructions: task.proofInstructions
    //   });
    // }

    // Create completion
    const completion = await db.ChallengeTaskCompletion.create({
      challengeTaskId: taskId,
      participantId: participant.id,
      userId: req.user.userId,
      pointsEarned: task.pointValue,
      xpEarned: task.xpReward,
      completedAt: new Date(),
      // proof, // TODO: Verification system not yet implemented
      // proofImageUrl, // TODO: Verification system not yet implemented
      // isVerified: !task.requiresVerification, // Auto-verify if verification not required
      durationMinutes,
      completionNumber: previousCompletions + 1
    }, { transaction });

    // Update participant progress
    participant.completedTasksCount += 1;
    participant.totalPoints += task.pointValue;
    participant.totalXpEarned += task.xpReward;
    participant.currentProgress += task.pointValue;
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

    // Check if challenge is completed
    if (participant.currentProgress >= challenge.goalTarget) {
      participant.status = 'completed';
      participant.completedAt = new Date();

      // Update character total challenges completed
      const character = await db.Character.findOne({
        where: { userId: req.user.userId },
        transaction
      });

      if (character) {
        character.totalChallengesCompleted += 1;
        await character.save({ transaction });
      }

      // Award bonus XP for completing challenge
      if (challenge.xpReward > 0) {
        await awardXP(
          req.user.userId,
          challenge.xpReward,
          'challenge_completed',
          { challengeId, challengeTitle: challenge.title },
          transaction
        );
      }
    }

    await participant.save({ transaction });

    // Update task completion count
    task.completionCount += 1;
    await task.save({ transaction });

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
      progressToday.progressValue += task.pointValue;
      progressToday.cumulativeProgress = participant.currentProgress;
      await progressToday.save({ transaction });
    } else {
      await db.ChallengeProgress.create({
        participantId: participant.id,
        challengeId,
        userId: req.user.userId,
        date: today,
        progressValue: task.pointValue,
        tasksCompleted: 1,
        xpEarned: task.xpReward,
        pointsEarned: task.pointValue,
        cumulativeProgress: participant.currentProgress,
        streakCount: participant.streakDays
      }, { transaction });
    }

    // TODO: Verification system not yet implemented - always award XP for now
    // Award XP to user character (if verification not required)
    // if (!task.requiresVerification) {
      await awardXP(
        req.user.userId,
        task.xpReward,
        'challenge_task_completed',
        { challengeId, taskId, taskTitle: task.title },
        transaction
      );
    // }

    await transaction.commit();

    return res.json({
      message: 'Task completed successfully!',
      // message: task.requiresVerification 
      //   ? 'Task completed! Awaiting verification.'
      //   : 'Task completed successfully!', // TODO: Verification system not yet implemented
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
