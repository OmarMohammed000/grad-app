import cron from 'node-cron';
import { Op } from 'sequelize';
import db from '../models/index.js';
import notificationService, { NotificationTypes } from './notificationService.js';

/**
 * Notification Scheduler
 * Runs background jobs to check for notification triggers
 */
class NotificationScheduler {
  constructor() {
    this.tasks = [];
  }

  /**
   * Initialize all scheduled tasks
   */
  init() {
    console.log('Initializing notification scheduler...');

    // Check for task deadlines every hour
    this.scheduleTaskDeadlineCheck();

    // Check for habit streaks daily at 8 AM
    this.scheduleHabitStreakCheck();

    // Check for challenge deadlines every hour
    this.scheduleChallengeDeadlineCheck();

    // Check for inactive users once daily at 10 AM
    this.scheduleInactiveUserCheck();

    // Cleanup old notifications daily at 3 AM
    this.scheduleNotificationCleanup();

    console.log('Notification scheduler initialized successfully');
  }

  /**
   * Check for tasks with approaching deadlines
   * Runs every hour
   */
  scheduleTaskDeadlineCheck() {
    const task = cron.schedule('0 * * * *', async () => {
      try {
        console.log('Checking for task deadlines...');

        const now = new Date();
        const users = await db.User.findAll({
          attributes: ['id'],
          include: [
            {
              model: db.UserProfile,
              as: 'profile',
              attributes: ['notificationPreferences'],
            },
          ],
        });

        for (const user of users) {
          const advanceHours = user.profile?.notificationPreferences?.deadlineAdvanceHours || 24;
          const checkTime = new Date(now.getTime() + advanceHours * 60 * 60 * 1000);

          // Find tasks with deadlines approaching
          const tasks = await db.Task.findAll({
            where: {
              userId: user.id,
              status: { [Op.in]: ['pending', 'in_progress'] },
              dueDate: {
                [Op.gte]: now,
                [Op.lte]: checkTime,
              },
            },
          });

          for (const taskItem of tasks) {
            // Check if we already sent a notification for this task
            const existingNotification = await db.Notification.findOne({
              where: {
                userId: user.id,
                type: NotificationTypes.TASK_DEADLINE_NEARING,
                relatedEntityType: 'task',
                relatedEntityId: taskItem.id,
                createdAt: {
                  [Op.gte]: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Last 24 hours
                },
              },
            });

            if (!existingNotification) {
              const hoursUntilDeadline = Math.floor((new Date(taskItem.dueDate) - now) / (1000 * 60 * 60));

              await notificationService.notifyUser(user.id, {
                type: NotificationTypes.TASK_DEADLINE_NEARING,
                title: '⏰ Task Deadline Approaching',
                message: `"${taskItem.title}" is due in ${hoursUntilDeadline} hours`,
                relatedEntityType: 'task',
                relatedEntityId: taskItem.id,
                metadata: {
                  taskId: taskItem.id,
                  taskTitle: taskItem.title,
                  dueDate: taskItem.dueDate,
                  hoursUntilDeadline,
                },
                data: {
                  screen: 'TaskDetail',
                  taskId: taskItem.id,
                },
              });
            }
          }
        }

        console.log('Task deadline check completed');
      } catch (error) {
        console.error('Error checking task deadlines:', error);
      }
    });

    this.tasks.push(task);
  }

  /**
   * Check for habits with expiring streaks
   * Runs daily at 8 AM
   */
  scheduleHabitStreakCheck() {
    const task = cron.schedule('0 8 * * *', async () => {
      try {
        console.log('Checking for habit streaks...');

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        // Find habits with active streaks (currentStreak > 0) that weren't completed today
        const habits = await db.Habit.findAll({
          where: {
            isActive: true,
            currentStreak: { [Op.gt]: 0 },
            lastCompletedDate: {
              [Op.or]: [
                { [Op.lt]: today }, // Last completed before today
                { [Op.is]: null }, // Or never completed
              ],
            },
          },
          include: [
            {
              model: db.User,
              as: 'user',
              attributes: ['id'],
            },
          ],
        });

        for (const habit of habits) {
          // Check if we already sent a notification for this habit today
          const existingNotification = await db.Notification.findOne({
            where: {
              userId: habit.userId,
              type: NotificationTypes.HABIT_STREAK_EXPIRING,
              relatedEntityType: 'habit',
              relatedEntityId: habit.id,
              createdAt: {
                [Op.gte]: today,
              },
            },
          });

          if (!existingNotification) {
            await notificationService.notifyUser(habit.userId, {
              type: NotificationTypes.HABIT_STREAK_EXPIRING,
              title: '🔥 Habit Streak About to Break!',
              message: `Your ${habit.currentStreak}-day streak for "${habit.title}" will break if not completed today`,
              relatedEntityType: 'habit',
              relatedEntityId: habit.id,
              metadata: {
                habitId: habit.id,
                habitTitle: habit.title,
                currentStreak: habit.currentStreak,
              },
              data: {
                screen: 'HabitDetail',
                habitId: habit.id,
              },
            });
          }
        }

        console.log('Habit streak check completed');
      } catch (error) {
        console.error('Error checking habit streaks:', error);
      }
    });

    this.tasks.push(task);
  }

  /**
   * Check for challenges ending soon and challenge tasks with deadlines
   * Runs every hour
   */
  scheduleChallengeDeadlineCheck() {
    const task = cron.schedule('0 * * * *', async () => {
      try {
        console.log('Checking for challenge deadlines...');

        const now = new Date();
        const warningTime = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48 hours ahead

        // Find active challenges ending within 48 hours
        const challenges = await db.GroupChallenge.findAll({
          where: {
            status: 'active',
            endDate: {
              [Op.gte]: now,
              [Op.lte]: warningTime,
            },
          },
          include: [
            {
              model: db.ChallengeParticipant,
              as: 'participants',
              attributes: ['userId'],
            },
          ],
        });

        for (const challenge of challenges) {
          const hoursUntilEnd = Math.floor((new Date(challenge.endDate) - now) / (1000 * 60 * 60));

          // Notify all participants
          for (const participant of challenge.participants) {
            // Check if we already sent this notification
            const existingNotification = await db.Notification.findOne({
              where: {
                userId: participant.userId,
                type: NotificationTypes.CHALLENGE_ENDING_SOON,
                relatedEntityType: 'challenge',
                relatedEntityId: challenge.id,
                createdAt: {
                  [Op.gte]: new Date(now.getTime() - 24 * 60 * 60 * 1000),
                },
              },
            });

            if (!existingNotification) {
              await notificationService.notifyUser(participant.userId, {
                type: NotificationTypes.CHALLENGE_ENDING_SOON,
                title: '🏆 Challenge Ending Soon!',
                message: `"${challenge.title}" ends in ${hoursUntilEnd} hours`,
                relatedEntityType: 'challenge',
                relatedEntityId: challenge.id,
                metadata: {
                  challengeId: challenge.id,
                  challengeTitle: challenge.title,
                  endDate: challenge.endDate,
                  hoursUntilEnd,
                },
                data: {
                  screen: 'ChallengeDetail',
                  challengeId: challenge.id,
                },
              });
            }
          }
        }

        // Check for challenge tasks with deadlines
        const challengeTasks = await db.ChallengeTask.findAll({
          where: {
            isActive: true,
            availableUntil: {
              [Op.not]: null,
              [Op.gte]: now,
              [Op.lte]: warningTime,
            },
          },
          include: [
            {
              model: db.GroupChallenge,
              as: 'challenge',
              attributes: ['id', 'title'],
              where: { status: 'active' },
              include: [
                {
                  model: db.ChallengeParticipant,
                  as: 'participants',
                  attributes: ['userId'],
                },
              ],
            },
          ],
        });

        for (const challengeTask of challengeTasks) {
          const hoursUntilDeadline = Math.floor((new Date(challengeTask.availableUntil) - now) / (1000 * 60 * 60));

          // Notify all participants
          for (const participant of challengeTask.challenge.participants) {
            const existingNotification = await db.Notification.findOne({
              where: {
                userId: participant.userId,
                type: NotificationTypes.CHALLENGE_TASK_DEADLINE,
                relatedEntityType: 'challenge_task',
                relatedEntityId: challengeTask.id,
                createdAt: {
                  [Op.gte]: new Date(now.getTime() - 24 * 60 * 60 * 1000),
                },
              },
            });

            if (!existingNotification) {
              await notificationService.notifyUser(participant.userId, {
                type: NotificationTypes.CHALLENGE_TASK_DEADLINE,
                title: '⚡ Challenge Task Deadline!',
                message: `"${challengeTask.title}" in "${challengeTask.challenge.title}" is due in ${hoursUntilDeadline} hours`,
                relatedEntityType: 'challenge_task',
                relatedEntityId: challengeTask.id,
                metadata: {
                  challengeTaskId: challengeTask.id,
                  challengeTaskTitle: challengeTask.title,
                  challengeId: challengeTask.challengeId,
                  challengeTitle: challengeTask.challenge.title,
                  deadline: challengeTask.availableUntil,
                  hoursUntilDeadline,
                },
                data: {
                  screen: 'ChallengeDetail',
                  challengeId: challengeTask.challengeId,
                  taskId: challengeTask.id,
                },
              });
            }
          }
        }

        console.log('Challenge deadline check completed');
      } catch (error) {
        console.error('Error checking challenge deadlines:', error);
      }
    });

    this.tasks.push(task);
  }

  /**
   * Check for inactive users (7+ days without login)
   * Runs daily at 10 AM
   */
  scheduleInactiveUserCheck() {
    const task = cron.schedule('0 10 * * *', async () => {
      try {
        console.log('Checking for inactive users...');

        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Find users who haven't logged in for 7+ days
        const inactiveUsers = await db.User.findAll({
          where: {
            lastLoginAt: {
              [Op.or]: [
                { [Op.lt]: sevenDaysAgo },
                { [Op.is]: null },
              ],
            },
          },
          attributes: ['id'],
        });

        for (const user of inactiveUsers) {
          // Check if we already sent a reminder in the last 7 days
          const existingNotification = await db.Notification.findOne({
            where: {
              userId: user.id,
              type: NotificationTypes.INACTIVE_USER_REMINDER,
              createdAt: {
                [Op.gte]: sevenDaysAgo,
              },
            },
          });

          if (!existingNotification) {
            await notificationService.notifyUser(user.id, {
              type: NotificationTypes.INACTIVE_USER_REMINDER,
              title: '👋 We Miss You!',
              message: "You haven't logged in for a while. Your tasks and challenges are waiting!",
              metadata: {
                daysInactive: Math.floor((now - new Date(user.lastLoginAt || user.createdAt)) / (1000 * 60 * 60 * 24)),
              },
              data: {
                screen: 'Home',
              },
            });
          }
        }

        console.log('Inactive user check completed');
      } catch (error) {
        console.error('Error checking inactive users:', error);
      }
    });

    this.tasks.push(task);
  }

  /**
   * Clean up old read notifications (older than 30 days)
   * Runs daily at 3 AM
   */
  scheduleNotificationCleanup() {
    const task = cron.schedule('0 3 * * *', async () => {
      try {
        console.log('Cleaning up old notifications...');

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const deletedCount = await db.Notification.destroy({
          where: {
            isRead: true,
            createdAt: {
              [Op.lt]: thirtyDaysAgo,
            },
          },
        });

        console.log(`Deleted ${deletedCount} old notifications`);
      } catch (error) {
        console.error('Error cleaning up notifications:', error);
      }
    });

    this.tasks.push(task);
  }

  /**
   * Stop all scheduled tasks
   */
  stop() {
    console.log('Stopping notification scheduler...');
    this.tasks.forEach((task) => task.stop());
    this.tasks = [];
    console.log('Notification scheduler stopped');
  }
}

export default new NotificationScheduler();
