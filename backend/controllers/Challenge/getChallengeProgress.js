import db from '../../models/index.js';

/**
 * Get user's progress in a challenge
 * GET /challenges/:id/progress
 */
export default async function getChallengeProgress(req, res) {
  try {
    const { id } = req.params;
    const { days = 30 } = req.query;

    const challenge = await db.GroupChallenge.findByPk(id);

    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    // Get user's participation
    const participant = await db.ChallengeParticipant.findOne({
      where: {
        challengeId: id,
        userId: req.user.userId
      }
    });

    if (!participant) {
      return res.status(404).json({ 
        message: 'You are not a participant in this challenge' 
      });
    }

    // Get daily progress for the last N days
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));

    const dailyProgress = await db.ChallengeProgress.findAll({
      where: {
        participantId: participant.id,
        date: { [db.Sequelize.Op.gte]: daysAgo.toISOString().split('T')[0] }
      },
      order: [['date', 'ASC']]
    });

    // Get task completions
    const taskCompletions = await db.ChallengeTaskCompletion.findAll({
      where: {
        participantId: participant.id
      },
      include: [
        {
          model: db.ChallengeTask,
          as: 'challengeTask',
          attributes: ['id', 'title', 'difficulty', 'taskType']
        }
      ],
      order: [['completedAt', 'DESC']],
      limit: 20
    });

    // Get uncompleted tasks
    const allTasks = await db.ChallengeTask.findAll({
      where: {
        challengeId: id,
        isActive: true
      }
    });

    const completedTaskIds = taskCompletions.map(tc => tc.challengeTaskId);
    const incompleteTasks = allTasks.filter(task => 
      !completedTaskIds.includes(task.id) || 
      (task.isRepeatable && (!task.maxCompletions || 
        taskCompletions.filter(tc => tc.challengeTaskId === task.id).length < task.maxCompletions))
    );

    // Calculate statistics
    const stats = {
      totalPoints: participant.totalPoints,
      currentProgress: participant.currentProgress,
      goalTarget: challenge.goalTarget,
      progressPercentage: ((participant.currentProgress / challenge.goalTarget) * 100).toFixed(2),
      completedTasksCount: participant.completedTasksCount,
      totalXpEarned: participant.totalXpEarned,
      streakDays: participant.streakDays,
      longestStreak: participant.longestStreak,
      rank: participant.rank,
      status: participant.status,
      joinedAt: participant.joinedAt,
      daysInChallenge: Math.floor((new Date() - new Date(participant.joinedAt)) / (1000 * 60 * 60 * 24))
    };

    return res.json({
      participant,
      stats,
      dailyProgress,
      recentCompletions: taskCompletions,
      incompleteTasks: incompleteTasks.map(task => ({
        id: task.id,
        title: task.title,
        difficulty: task.difficulty,
        taskType: task.taskType,
        pointValue: task.pointValue,
        xpReward: task.xpReward,
        requiresProof: task.requiresProof
      })),
      challenge: {
        id: challenge.id,
        title: challenge.title,
        status: challenge.status,
        startDate: challenge.startDate,
        endDate: challenge.endDate,
        daysRemaining: Math.max(0, Math.ceil((new Date(challenge.endDate) - new Date()) / (1000 * 60 * 60 * 24)))
      }
    });

  } catch (error) {
    console.error('Error fetching challenge progress:', error);
    return res.status(500).json({
      message: 'An error occurred while fetching progress',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
