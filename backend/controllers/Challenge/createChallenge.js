import db from '../../models/index.js';
import crypto from 'crypto';

/**
 * Create a new group challenge
 * POST /challenges
 */
export default async function createChallenge(req, res) {
  const transaction = await db.sequelize.transaction();

  try {
    const {
      title,
      description,
      challengeType = 'competitive',
      goalType,
      goalTarget,
      goalDescription,
      isPublic = true,
      maxParticipants,
      xpReward = 0,
      startDate,
      endDate,
      tags = [],
      rules,
      prizeDescription,
      // requiresVerification = false, // TODO: Verification system not yet implemented
      isTeamBased = false,
      teamSize,
      difficultyLevel = 'intermediate'
    } = req.body;

    // Validations
    if (!title?.trim()) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Title is required' });
    }

    if (!goalType || !['task_count', 'total_xp', 'habit_streak', 'custom'].includes(goalType)) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Valid goalType is required' });
    }

    if (!goalTarget || goalTarget < 1) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Valid goalTarget is required' });
    }

    if (!startDate || !endDate) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Start and end dates are required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      await transaction.rollback();
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    // Generate invite code for private challenges
    const inviteCode = !isPublic ? crypto.randomBytes(8).toString('hex') : null;

    // Determine initial status
    const now = new Date();
    let status = 'upcoming';
    if (start <= now && end > now) {
      status = 'active';
    }

    // Create challenge
    const challenge = await db.GroupChallenge.create({
      createdBy: req.user.userId,
      title: title.trim(),
      description: description?.trim(),
      challengeType,
      goalType,
      goalTarget,
      goalDescription,
      status,
      isPublic,
      inviteCode,
      maxParticipants,
      currentParticipants: 1, // Creator is first participant
      xpReward,
      startDate: start,
      endDate: end,
      tags,
      rules,
      prizeDescription,
      // requiresVerification, // TODO: Verification system not yet implemented
      isTeamBased,
      teamSize,
      difficultyLevel
    }, { transaction });

    // Automatically add creator as first participant
    await db.ChallengeParticipant.create({
      challengeId: challenge.id,
      userId: req.user.userId,
      status: 'active',
      role: 'moderator', // Creator gets moderator role
      joinedAt: new Date()
    }, { transaction });

    // Log activity
    await db.ActivityLog.create({
      userId: req.user.userId,
      activityType: 'challenge_created',
      description: `Created challenge: ${title}`,
      isPublic: true,
      importance: 'medium'
    }, { transaction });

    await transaction.commit();

    return res.status(201).json({
      message: 'Challenge created successfully',
      challenge,
      inviteCode: inviteCode || undefined
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error creating challenge:', error);
    return res.status(500).json({
      message: 'An error occurred while creating the challenge',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
