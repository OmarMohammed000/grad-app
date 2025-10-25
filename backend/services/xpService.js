import db from '../models/index.js';
import { 
  emitUserProgress, 
  emitLevelUp, 
  emitRankUp 
} from './websocketService.js';

/**
 * XP Base Values by Difficulty
 */
const XP_BASE_VALUES = {
  task: {
    easy: 10,
    medium: 25,
    hard: 50,
    extreme: 100
  },
  habit: {
    easy: 5,
    medium: 15,
    hard: 30,
    extreme: 60
  }
};

/**
 * Calculate XP for task completion with modifiers
 * @param {Object} task - Task instance
 * @param {Object} completionData - Completion metadata
 * @returns {number} Final XP amount
 */
export function calculateTaskXP(task, completionData = {}) {
  // Start with custom XP or base value
  let finalXP = task.xpReward || XP_BASE_VALUES.task[task.difficulty] || 25;

  // Priority modifier (reasonable boost)
  const priorityMultipliers = {
    low: 0.9,
    medium: 1.0,
    high: 1.2,
    critical: 1.4
  };
  finalXP *= (priorityMultipliers[task.priority] || 1.0);

  // Early completion bonus (max 20%)
  if (task.dueDate && completionData.completedAt) {
    const daysEarly = Math.floor((new Date(task.dueDate) - new Date(completionData.completedAt)) / (1000 * 60 * 60 * 24));
    
    if (daysEarly > 0) {
      // Small bonus for early completion
      const earlyBonus = Math.min(daysEarly * 0.05, 0.2); // max 20%
      finalXP *= (1 + earlyBonus);
    } else if (daysEarly < 0) {
      // Small penalty for late completion (min 70% of XP)
      const latePenalty = Math.max(-0.3, daysEarly * 0.05);
      finalXP *= (1 + latePenalty);
    }
  }

  // Subtask completion bonus (10% if all subtasks done)
  if (completionData.allSubtasksCompleted) {
    finalXP *= 1.1;
  }

  return Math.round(finalXP);
}

/**
 * Calculate XP for habit completion with CAPPED streak bonus
 * @param {Object} habit - Habit instance
 * @param {Object} completionData - Completion metadata
 * @returns {number} Final XP amount
 */
export function calculateHabitXP(habit, completionData = {}) {
  // Start with custom XP or base value
  let finalXP = habit.xpReward || XP_BASE_VALUES.habit[habit.difficulty] || 15;

  // Streak bonus - CAPPED to prevent spiral
  // +2% per 7-day streak, max +30% at 15 weeks (105 days)
  if (habit.currentStreak && habit.currentStreak > 0) {
    const weekStreaks = Math.floor(habit.currentStreak / 7);
    const streakBonus = Math.min(weekStreaks * 0.02, 0.3); // max 30%
    finalXP *= (1 + streakBonus);
  }

  // First completion bonus (one-time)
  if (completionData.isFirstCompletion) {
    finalXP *= 1.5; // 50% bonus for first time
  }

  // Weekly consistency bonus (small reward for hitting all target days)
  if (completionData.completedAllTargetDaysThisWeek) {
    finalXP *= 1.15; // 15% bonus
  }

  return Math.round(finalXP);
}

/**
 * Award XP to user's character and check for level up
 * @param {string} userId - User UUID
 * @param {number} xpAmount - XP to award
 * @param {string} source - Source type (task_completion, habit_completion, etc)
 * @param {string} sourceId - Source entity ID
 * @returns {Object} { character, leveledUp, newLevel }
 */
export async function awardXP(userId, xpAmount, source, metadata = {}, transaction) {
  const useTransaction = transaction || await db.sequelize.transaction();

  try {
    // Get user's character
    const character = await db.Character.findOne({
      where: { userId },
      include: [
        { model: db.Rank, as: 'rank' },
        { 
          model: db.User, 
          as: 'user',
          include: [{ model: db.UserProfile, as: 'profile' }]
        }
      ],
      transaction: useTransaction
    });

    if (!character) {
      throw new Error('Character not found');
    }

    const oldLevel = character.level;
    const oldRank = character.rank;

    // Add XP
    character.currentXp += xpAmount;
    character.totalXp += xpAmount;

    // Emit progress update via WebSocket
    emitUserProgress(userId, {
      xpEarned: xpAmount,
      currentXP: character.currentXp,
      totalXP: character.totalXp,
      level: character.level,
      xpToNextLevel: character.xpToNextLevel,
      source,
      metadata
    });

    // Check for level up
    let leveledUp = false;
    let newLevel = oldLevel;
    const levelUpDetails = [];

    while (character.currentXp >= character.xpToNextLevel) {
      character.currentXp -= character.xpToNextLevel;
      character.level += 1;
      leveledUp = true;
      newLevel = character.level;

      // Calculate next level XP requirement (grows moderately)
      character.xpToNextLevel = calculateXPForNextLevel(character.level);
      
      levelUpDetails.push({
        level: character.level,
        xpToNextLevel: character.xpToNextLevel
      });
    }

    // Check for rank up
    let rankedUp = false;
    let newRank = null;

    if (leveledUp) {
      const nextRank = await db.Rank.findOne({
        where: {
          minLevel: { [db.Sequelize.Op.lte]: character.level }
        },
        order: [['minLevel', 'DESC']],
        transaction: useTransaction
      });

      if (nextRank && nextRank.id !== character.rankId) {
        character.rankId = nextRank.id;
        rankedUp = true;
        newRank = nextRank;
      }
    }

    await character.save({ transaction: useTransaction });

    // Log activity
    await db.ActivityLog.create({
      userId,
      activityType: source,
      description: leveledUp 
        ? `Leveled up to ${newLevel}! Earned ${xpAmount} XP`
        : `Earned ${xpAmount} XP`,
      xpGained: xpAmount,
      isPublic: true,
      importance: leveledUp ? 'milestone' : 'info'
    }, { transaction: useTransaction });

    // If ranked up, log that too
    if (rankedUp) {
      await db.ActivityLog.create({
        userId,
        activityType: 'rank_up',
        description: `Advanced to ${newRank.name} rank!`,
        xpGained: 0,
        isPublic: true,
        importance: 'milestone'
      }, { transaction: useTransaction });
    }

    if (!transaction) {
      await useTransaction.commit();
    }

    // Emit WebSocket events after transaction commits
    if (leveledUp) {
      emitLevelUp(userId, {
        user: {
          id: userId,
          displayName: character.user?.profile?.displayName || 'Anonymous'
        },
        oldLevel,
        newLevel,
        levelUpDetails,
        currentXP: character.currentXp,
        xpToNextLevel: character.xpToNextLevel
      });
    }

    if (rankedUp) {
      emitRankUp(userId, {
        user: {
          id: userId,
          displayName: character.user?.profile?.displayName || 'Anonymous'
        },
        oldRank: oldRank?.name,
        newRank: {
          id: newRank.id,
          name: newRank.name,
          minLevel: newRank.minLevel
        }
      });
    }

    return {
      character: await character.reload({ 
        include: [
          { model: db.Rank, as: 'rank' },
          { 
            model: db.User, 
            as: 'user',
            include: [{ model: db.UserProfile, as: 'profile' }]
          }
        ] 
      }),
      leveledUp,
      newLevel: leveledUp ? newLevel : null,
      rankedUp,
      newRank: rankedUp ? newRank : null,
      currentXP: character.currentXp,
      xpForNextLevel: character.xpToNextLevel
    };

  } catch (error) {
    if (!transaction) {
      await useTransaction.rollback();
    }
    throw error;
  }
}

/**
 * Calculate XP required for next level
 * Uses a moderate growth curve to prevent excessive grinding
 * @param {number} currentLevel
 * @returns {number} XP required for next level
 */
function calculateXPForNextLevel(currentLevel) {
  // Base: 100 XP for level 1->2
  // Growth: roughly 15% per level (moderate curve)
  // Level 10: ~400 XP
  // Level 50: ~12,000 XP
  // Level 100: ~150,000 XP
  const base = 100;
  const growthFactor = 1.15;
  return Math.round(base * Math.pow(growthFactor, currentLevel - 1));
}

/**
 * Get default XP value for difficulty
 * @param {string} type - 'task' or 'habit'
 * @param {string} difficulty - 'easy', 'medium', 'hard', 'extreme'
 * @returns {number} Default XP value
 */
export function getDefaultXP(type, difficulty) {
  return XP_BASE_VALUES[type]?.[difficulty] || 25;
}
