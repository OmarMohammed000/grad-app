import db from '../../models/index.js';

/**
 * Delete/cancel challenge (creator only)
 * DELETE /challenges/:id
 */
export default async function deleteChallenge(req, res) {
  const transaction = await db.sequelize.transaction();

  try {
    const { id } = req.params;
    const { permanent = false } = req.query;

    const challenge = await db.GroupChallenge.findByPk(id, { transaction });

    if (!challenge) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Challenge not found' });
    }

    // Only creator can delete
    if (challenge.createdBy !== req.user.userId) {
      await transaction.rollback();
      return res.status(403).json({ 
        message: 'Only the challenge creator can delete this challenge' 
      });
    }

    // Check if challenge has started
    if (challenge.status === 'active') {
      // Cannot permanently delete active challenge
      if (permanent === 'true') {
        await transaction.rollback();
        return res.status(400).json({ 
          message: 'Cannot permanently delete an active challenge. Cancel it instead.' 
        });
      }

      // Cancel the challenge instead
      challenge.status = 'cancelled';
      await challenge.save({ transaction });

      await transaction.commit();

      return res.json({
        message: 'Challenge cancelled successfully',
        challenge
      });
    }

    // For upcoming/completed/cancelled challenges
    if (permanent === 'true') {
      // Permanent deletion
      await challenge.destroy({ transaction });

      await transaction.commit();

      return res.json({ message: 'Challenge permanently deleted' });
    } else {
      // Soft delete (mark as cancelled)
      challenge.status = 'cancelled';
      await challenge.save({ transaction });

      await transaction.commit();

      return res.json({
        message: 'Challenge cancelled',
        challenge
      });
    }

  } catch (error) {
    await transaction.rollback();
    console.error('Error deleting challenge:', error);
    return res.status(500).json({
      message: 'An error occurred while deleting the challenge',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
