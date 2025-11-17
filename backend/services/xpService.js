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
  // Validate task object
  if (!task || typeof task !== 'object') {
    console.error('Invalid task object passed to calculateTaskXP:', task);
    return 25; // Default fallback
  }

  // Start with custom XP or base value - ensure it's a number
  let finalXP = Number(task.xpReward) || XP_BASE_VALUES.task[task.difficulty] || 25;
  
  // Validate finalXP is a valid number
  if (isNaN(finalXP) || !isFinite(finalXP) || finalXP < 0) {
    console.error('Invalid XP value calculated, using default:', finalXP);
    finalXP = 25;
  }

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
    try {
      const dueDate = new Date(task.dueDate);
      const completedDate = new Date(completionData.completedAt);
      
      if (isNaN(dueDate.getTime()) || isNaN(completedDate.getTime())) {
        console.warn('Invalid date in XP calculation, skipping time bonus');
      } else {
        const daysEarly = Math.floor((dueDate - completedDate) / (1000 * 60 * 60 * 24));
        
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
    } catch (error) {
      console.error('Error calculating time bonus:', error);
    }
  }

  // Subtask completion bonus (10% if all subtasks done)
  if (completionData.allSubtasksCompleted) {
    finalXP *= 1.1;
  }

  // Final validation and rounding
  finalXP = Math.round(finalXP);
  
  // Ensure final value is valid and within reasonable bounds
  if (isNaN(finalXP) || !isFinite(finalXP) || finalXP < 0) {
    console.error('Invalid final XP value, using default:', finalXP);
    finalXP = 25;
  }
  
  // Cap at reasonable maximum (1 million XP per task)
  if (finalXP > 1000000) {
    console.error('XP value too large, capping at 1M:', finalXP);
    finalXP = 1000000;
  }

  return finalXP;
}

/**
 * Calculate XP for habit completion with CAPPED streak bonus
 * @param {Object} habit - Habit instance
 * @param {Object} completionData - Completion metadata
 * @returns {number} Final XP amount
 */
export function calculateHabitXP(habit, completionData = {}) {
  // Validate habit object
  if (!habit || typeof habit !== 'object') {
    console.error('Invalid habit object passed to calculateHabitXP:', habit);
    return 15; // Default fallback
  }

  // Start with custom XP or base value - ensure it's a number
  let finalXP = Number(habit.xpReward) || XP_BASE_VALUES.habit[habit.difficulty] || 15;
  
  // Validate finalXP is a valid number
  if (isNaN(finalXP) || !isFinite(finalXP) || finalXP < 0) {
    console.error('Invalid XP value calculated, using default:', finalXP);
    finalXP = 15;
  }

  // Streak bonus - CAPPED to prevent spiral
  // +2% per 7-day streak, max +30% at 15 weeks (105 days)
  if (habit.currentStreak && Number(habit.currentStreak) > 0) {
    const streak = Number(habit.currentStreak);
    if (!isNaN(streak) && isFinite(streak)) {
      const weekStreaks = Math.floor(streak / 7);
      const streakBonus = Math.min(weekStreaks * 0.02, 0.3); // max 30%
      finalXP *= (1 + streakBonus);
    }
  }

  // First completion bonus (one-time)
  if (completionData.isFirstCompletion) {
    finalXP *= 1.5; // 50% bonus for first time
  }

  // Weekly consistency bonus (small reward for hitting all target days)
  if (completionData.completedAllTargetDaysThisWeek) {
    finalXP *= 1.15; // 15% bonus
  }

  // Final validation and rounding
  finalXP = Math.round(finalXP);
  
  // Ensure final value is valid and within reasonable bounds
  if (isNaN(finalXP) || !isFinite(finalXP) || finalXP < 0) {
    console.error('Invalid final XP value, using default:', finalXP);
    finalXP = 15;
  }
  
  // Cap at reasonable maximum (1 million XP per habit)
  if (finalXP > 1000000) {
    console.error('XP value too large, capping at 1M:', finalXP);
    finalXP = 1000000;
  }

  return finalXP;
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
    // Validate and sanitize xpAmount
    xpAmount = Number(xpAmount);
    
    if (isNaN(xpAmount) || !isFinite(xpAmount)) {
      console.error('Invalid xpAmount passed to awardXP:', xpAmount, 'source:', source, 'metadata:', metadata);
      throw new Error(`Invalid XP amount: ${xpAmount}. Expected a valid number.`);
    }
    
    if (xpAmount < 0) {
      console.error('Negative xpAmount passed to awardXP:', xpAmount);
      throw new Error(`XP amount cannot be negative: ${xpAmount}`);
    }
    
    if (xpAmount > 1000000) {
      console.error('XP amount too large:', xpAmount);
      throw new Error(`XP amount exceeds maximum allowed: ${xpAmount}`);
    }

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

    // Validate character XP values are numbers
    // Handle both number and string types (Sequelize may return BIGINT as string)
    let currentXp = character.currentXp;
    let totalXp = character.totalXp;
    
    // Convert to number, handling string representations
    if (typeof currentXp === 'string') {
      currentXp = parseInt(currentXp, 10);
    }
    if (typeof totalXp === 'string') {
      totalXp = parseInt(totalXp, 10);
    }
    
    currentXp = Number(currentXp) || 0;
    totalXp = Number(totalXp) || 0;
    
    // Log original values for debugging
    if (typeof character.currentXp === 'string' || typeof character.totalXp === 'string') {
      console.log('XP values converted from string:', {
        originalCurrentXp: character.currentXp,
        originalTotalXp: character.totalXp,
        convertedCurrentXp: currentXp,
        convertedTotalXp: totalXp
      });
    }
    
    if (isNaN(currentXp) || !isFinite(currentXp) || currentXp < 0) {
      console.error('Invalid currentXp in character:', character.currentXp, '->', currentXp);
      currentXp = 0;
      character.currentXp = 0;
    }
    
    if (isNaN(totalXp) || !isFinite(totalXp) || totalXp < 0) {
      console.error('Invalid totalXp in character:', character.totalXp, '->', totalXp);
      totalXp = 0;
      character.totalXp = 0;
    }
    
    // Additional safety check for extremely large values (likely corrupted)
    if (totalXp > 1000000000000) { // 1 trillion
      console.error('Suspiciously large totalXp detected, resetting:', totalXp);
      totalXp = 0;
      character.totalXp = 0;
    }

    const oldLevel = character.level;
    const oldRank = character.rank;

    // Add XP - Sequelize handles BIGINT conversion automatically
    // Ensure values are integers to avoid precision issues
    character.currentXp = Math.floor(currentXp + xpAmount);
    // For totalXp (BIGINT), ensure we're adding integers
    // Sequelize will handle the conversion to BigInt for PostgreSQL
    const newTotalXp = Math.floor(totalXp) + Math.floor(xpAmount);
    
    // Validate the result is within safe integer range for JavaScript
    if (newTotalXp > Number.MAX_SAFE_INTEGER) {
      console.error('Total XP exceeds safe integer range:', newTotalXp);
      throw new Error('Total XP value too large');
    }
    
    character.totalXp = newTotalXp;

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
    let description = '';
    if (leveledUp) {
      description = `Leveled up to ${newLevel}! Earned ${xpAmount} XP`;
    } else if (source === 'habit_completed') {
      description = `Completed habit and earned ${xpAmount} XP`;
    } else if (source === 'task_completed') {
      description = `Completed task and earned ${xpAmount} XP`;
    } else {
      description = `Earned ${xpAmount} XP`;
    }

    const activityLogData = {
      userId,
      activityType: source,
      description,
      xpGained: xpAmount,
      isPublic: true,
      importance: leveledUp ? 'milestone' : 'medium'
    };

    // Add related IDs based on source type
    if (source === 'habit_completed' && metadata.habitId) {
      activityLogData.relatedHabitId = metadata.habitId;
    } else if (source === 'task_completed' && metadata.taskId) {
      activityLogData.relatedTaskId = metadata.taskId;
    }

    await db.ActivityLog.create(activityLogData, { transaction: useTransaction });

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
 * Remove XP from user's character (for uncompletion)
 * Handles level down if necessary
 * @param {string} userId - User UUID
 * @param {number} xpAmount - XP to remove
 * @param {string} source - Source type (task_uncompleted, habit_uncompleted, etc)
 * @param {Object} metadata - Metadata object
 * @param {Object} transaction - Optional transaction object
 * @returns {Object} { character, xpRemoved, leveledDown, oldLevel, newLevel }
 */
export async function removeXP(userId, xpAmount, source, metadata = {}, transaction) {
  const useTransaction = transaction || await db.sequelize.transaction();

  try {
    // Validate and sanitize xpAmount
    xpAmount = Number(xpAmount);
    
    if (isNaN(xpAmount) || !isFinite(xpAmount)) {
      console.error('Invalid xpAmount passed to removeXP:', xpAmount, 'source:', source, 'metadata:', metadata);
      throw new Error(`Invalid XP amount: ${xpAmount}. Expected a valid number.`);
    }
    
    if (xpAmount < 0) {
      console.error('Negative xpAmount passed to removeXP:', xpAmount);
      throw new Error(`XP amount cannot be negative: ${xpAmount}`);
    }
    
    if (xpAmount > 1000000) {
      console.error('XP amount too large:', xpAmount);
      throw new Error(`XP amount exceeds maximum allowed: ${xpAmount}`);
    }

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

    // Validate character XP values are numbers
    let currentXp = character.currentXp;
    let totalXp = character.totalXp;
    
    // Convert to number, handling string representations
    if (typeof currentXp === 'string') {
      currentXp = parseInt(currentXp, 10);
    }
    if (typeof totalXp === 'string') {
      totalXp = parseInt(totalXp, 10);
    }
    
    currentXp = Number(currentXp) || 0;
    totalXp = Number(totalXp) || 0;
    
    if (isNaN(currentXp) || !isFinite(currentXp) || currentXp < 0) {
      console.error('Invalid currentXp in character:', character.currentXp, '->', currentXp);
      currentXp = 0;
      character.currentXp = 0;
    }
    
    if (isNaN(totalXp) || !isFinite(totalXp) || totalXp < 0) {
      console.error('Invalid totalXp in character:', character.totalXp, '->', totalXp);
      totalXp = 0;
      character.totalXp = 0;
    }

    const oldLevel = character.level;
    const oldRank = character.rank;

    // Remove XP (can go negative temporarily for level down calculation)
    let newCurrentXp = currentXp - xpAmount;
    let newTotalXp = Math.max(0, totalXp - xpAmount);

    // Handle level down if currentXp becomes negative
    let leveledDown = false;
    let newLevel = oldLevel;

    while (newCurrentXp < 0 && character.level > 1) {
      // Need to level down
      leveledDown = true;
      character.level -= 1;
      newLevel = character.level;
      
      // Calculate XP requirement for the level we're going down to
      const xpForCurrentLevel = calculateXPForNextLevel(character.level - 1);
      character.xpToNextLevel = xpForCurrentLevel;
      
      // Add back the XP requirement for the level we're losing
      newCurrentXp += xpForCurrentLevel;
    }

    // Ensure non-negative
    newCurrentXp = Math.max(0, newCurrentXp);
    
    character.currentXp = Math.floor(newCurrentXp);
    character.totalXp = Math.floor(newTotalXp);

    // Check for rank down
    let rankedDown = false;
    let newRank = oldRank;

    if (leveledDown) {
      const currentRank = await db.Rank.findOne({
        where: {
          minLevel: { [db.Sequelize.Op.lte]: character.level }
        },
        order: [['minLevel', 'DESC']],
        transaction: useTransaction
      });

      if (currentRank && currentRank.id !== character.rankId) {
        character.rankId = currentRank.id;
        rankedDown = true;
        newRank = currentRank;
      }
    }

    await character.save({ transaction: useTransaction });

    // Emit progress update via WebSocket
    emitUserProgress(userId, {
      xpEarned: -xpAmount, // Negative to show removal
      currentXP: character.currentXp,
      totalXP: character.totalXp,
      level: character.level,
      xpToNextLevel: character.xpToNextLevel,
      source,
      metadata
    });

    // Log activity
    const activityLogData = {
      userId,
      activityType: source,
      description: `Uncompleted ${source === 'task_uncompleted' ? 'task' : 'habit'} and removed ${xpAmount} XP`,
      xpGained: -xpAmount, // Negative to show removal
      isPublic: false,
      importance: leveledDown ? 'milestone' : 'medium'
    };

    // Add related IDs based on source type
    if (source === 'habit_uncompleted' && metadata.habitId) {
      activityLogData.relatedHabitId = metadata.habitId;
    } else if (source === 'task_uncompleted' && metadata.taskId) {
      activityLogData.relatedTaskId = metadata.taskId;
    }

    await db.ActivityLog.create(activityLogData, { transaction: useTransaction });

    // If ranked down, log that too
    if (rankedDown) {
      await db.ActivityLog.create({
        userId,
        activityType: 'rank_down',
        description: `Ranked down to ${newRank.name} rank`,
        xpGained: 0,
        isPublic: true,
        importance: 'milestone'
      }, { transaction: useTransaction });
    }

    if (!transaction) {
      await useTransaction.commit();
    }

    // Emit WebSocket events after transaction commits
    if (leveledDown) {
      // Note: We might want to emit a levelDown event, but for now we'll just use progress update
      console.log(`User ${userId} leveled down from ${oldLevel} to ${newLevel}`);
    }

    if (rankedDown) {
      // Note: We might want to emit a rankDown event
      console.log(`User ${userId} ranked down from ${oldRank?.name} to ${newRank.name}`);
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
      xpRemoved: xpAmount,
      leveledDown,
      oldLevel,
      newLevel: leveledDown ? newLevel : null,
      rankedDown,
      oldRank: rankedDown ? oldRank : null,
      newRank: rankedDown ? newRank : null,
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
