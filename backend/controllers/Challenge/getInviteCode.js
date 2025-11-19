import db from '../../models/index.js';
import crypto from 'crypto';

/**
 * Get or regenerate invite code for a challenge (creator/moderator only)
 * GET /challenges/:id/invite-code?regenerate=true
 */
export default async function getInviteCode(req, res) {
  const transaction = await db.sequelize.transaction();

  try {
    const { id } = req.params;
    const { regenerate } = req.query;

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
        message: 'Only the challenge creator or moderators can access invite codes' 
      });
    }

    // Only private challenges have invite codes
    if (challenge.isPublic) {
      await transaction.rollback();
      return res.status(400).json({ 
        message: 'Public challenges do not require invite codes' 
      });
    }

    // Regenerate invite code if requested
    if (regenerate === 'true') {
      const newInviteCode = crypto.randomBytes(8).toString('hex');
      challenge.inviteCode = newInviteCode;
      await challenge.save({ transaction });
      
      await transaction.commit();
      
      return res.json({
        message: 'Invite code regenerated successfully',
        inviteCode: newInviteCode
      });
    }

    // Return existing invite code
    await transaction.commit();
    
    return res.json({
      inviteCode: challenge.inviteCode
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error getting invite code:', error);
    return res.status(500).json({
      message: 'An error occurred while getting the invite code',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

