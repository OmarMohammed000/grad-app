import db from '../../models/index.js';
import notificationService, { NotificationTypes } from '../../services/notificationService.js';

/**
 * Add task to challenge (creator/moderator only)
 * POST /challenges/:id/tasks
 */
export default async function addChallengeTask(req, res) {
  const transaction = await db.sequelize.transaction();

  try {
    const { id: challengeId } = req.params;
    const {
      title,
      description,
      taskType = 'required',
      pointValue = 1,
      xpReward = 10,
      difficulty = 'medium',
      isRepeatable = false,
      maxCompletions,
      orderIndex = 0,
      tags = [],
      requiresProof = false,
      proofInstructions,
      estimatedDuration,
      availableFrom,
      availableUntil,
      prerequisites = []
    } = req.body;

    const challenge = await db.GroupChallenge.findByPk(challengeId, {
      include: [
        {
          model: db.ChallengeParticipant,
          as: 'participants',
          attributes: ['userId']
        }
      ],
      transaction
    });

    if (!challenge) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Challenge not found' });
    }

 // Check if user is creator or moderator
    const participant = await db.ChallengeParticipant.findOne({
      where: {
        challengeId,
        userId: req.user.userId
      },
      transaction
    });

    const isCreator = challenge.createdBy === req.user.userId;
    const isModerator = participant?.role === 'moderator';

    if (!isCreator && !isModerator) {
      await transaction.rollback();
      return res.status(403).json({ 
        message: 'Only the challenge creator or moderators can add tasks' 
      });
    }

    // Validation
    if (!title?.trim()) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Title is required' });
    }

    // Create task
    const task = await db.ChallengeTask.create({
      challengeId,
      title: title.trim(),
      description: description?.trim(),
      taskType,
      pointValue,
      xpReward,
      difficulty,
      isRepeatable,
      maxCompletions: isRepeatable ? maxCompletions : null,
      orderIndex,
      tags,
      requiresProof,
      proofInstructions,
      estimatedDuration,
      availableFrom,
      availableUntil,
      prerequisites,
      isActive: true
    }, { transaction });

    await transaction.commit();

    // Notify all participants about the new task (async, don't wait)
    const participantIds = challenge.participants.map(p => p.userId);
    notificationService.notifyUsers(participantIds, {
      type: NotificationTypes.CHALLENGE_TASK_CREATED,
      title: '✨ New Challenge Task!',
      message: `New task "${title}" added to "${challenge.title}"`,
      relatedEntityType: 'challenge_task',
      relatedEntityId: task.id,
      metadata: {
        challengeId: challenge.id,
        challengeTitle: challenge.title,
        taskId: task.id,
        taskTitle: title,
        taskType,
        pointValue,
        xpReward
      },
      data: {
        screen: 'ChallengeDetail',
        challengeId: challenge.id,
        taskId: task.id
      }
    }).catch(error => {
      console.error('Error sending challenge task notifications:', error);
    });

    return res.status(201).json({
      message: 'Challenge task added successfully',
      task
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error adding challenge task:', error);
    return res.status(500).json({
      message: 'An error occurred while adding the task',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
