import db from '../models/index.js';

/**
 * Ensures a challenge is marked completed when its end date has passed
 * or when no active participants remain (if checkParticipants = true).
 */
export async function finalizeChallengeIfNeeded(challenge, {
  checkParticipants = false,
  transaction = null
} = {}) {
  if (!challenge) return null;

  if (challenge.status === 'completed' || challenge.status === 'cancelled') {
    return challenge;
  }

  const now = new Date();
  const endDate = new Date(challenge.endDate);
  const hasEnded = now >= endDate;

  let shouldComplete = hasEnded;

  if (!shouldComplete && checkParticipants) {
    const activeCount = await db.ChallengeParticipant.count({
      where: {
        challengeId: challenge.id,
        status: 'active'
      },
      transaction
    });
    shouldComplete = activeCount === 0;
  }

  if (shouldComplete) {
    challenge.status = 'completed';
    if (!challenge.completedAt) {
      challenge.completedAt = hasEnded ? endDate : now;
    }
    if (transaction) {
      await challenge.save({ transaction });
    } else {
      await challenge.save();
    }
  }

  return challenge;
}

