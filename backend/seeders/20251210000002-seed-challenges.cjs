'use strict';
const crypto = require('crypto');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Fetch some users to be creators and participants
    const users = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE email LIKE 'player%@huntergame.com'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (users.length === 0) {
      console.warn('No seed users found. Skipping challenge seeding.');
      return;
    }

    const challenges = [];
    const challengeTasks = [];
    const participants = [];

    // Helper to pick random user
    const getRandomUser = () => users[Math.floor(Math.random() * users.length)].id;

    const challengeConfigs = [
      { title: 'Global Fitness Challenge', isGlobal: true, verificationType: 'none', goalType: 'task_count' },
      { title: 'Global Coding Marathon', isGlobal: true, verificationType: 'ai', goalType: 'total_xp' },
      { title: 'Photo Contest', isGlobal: false, verificationType: 'manual', goalType: 'task_count' },
      { title: 'Daily Journaling (AI Verified)', isGlobal: false, verificationType: 'ai', goalType: 'task_count' },
      { title: 'Weekly Steps', isGlobal: false, verificationType: 'none', goalType: 'total_xp' },
      { title: 'Reading Challenge', isGlobal: false, verificationType: 'manual', goalType: 'task_count' },
      { title: 'Meditation Month', isGlobal: false, verificationType: 'none', goalType: 'task_count' },
      { title: 'Healthy Eating', isGlobal: false, verificationType: 'manual', goalType: 'total_xp' },
      { title: 'Learn a New Skill', isGlobal: false, verificationType: 'manual', goalType: 'task_count' },
      { title: 'Community Service', isGlobal: false, verificationType: 'manual', goalType: 'task_count' },
    ];

    for (const config of challengeConfigs) {
      const challengeId = crypto.randomUUID();
      // Calc end date
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);

      challenges.push({
        id: challengeId,
        createdBy: getRandomUser(),
        title: config.title,
        description: `A seeded challenge for ${config.title}. Join now!`,
        challengeType: 'competitive',
        goalType: config.goalType,
        goalTarget: 10 + Math.floor(Math.random() * 50),
        status: 'active',
        isPublic: true,
        isGlobal: config.isGlobal,
        verificationType: config.verificationType,
        difficultyLevel: 'intermediate',
        startDate: startDate,
        endDate: endDate,
        createdAt: new Date(),
        updatedAt: new Date(),
        currentParticipants: 0,
        xpReward: 100
      });

      // Add 3 tasks
      for (let i = 1; i <= 3; i++) {
        const taskId = crypto.randomUUID();
        challengeTasks.push({
          id: taskId,
          challengeId: challengeId,
          title: `${config.title} - Task ${i}`,
          description: `Complete task ${i} for ${config.title}`,
          taskType: 'required',
          pointValue: 10 * i,
          xpReward: 100 * i,
          difficulty: 'medium',
          isActive: true,
          requiresProof: config.verificationType !== 'none',
          createdAt: new Date(),
          updatedAt: new Date(),
          orderIndex: i,
          completionCount: 0
        });
      }

      // Add 5 random participants
      const shuffledUsers = [...users].sort(() => 0.5 - Math.random());
      const selectedUsers = shuffledUsers.slice(0, 5);

      for (const user of selectedUsers) {
        participants.push({
          id: crypto.randomUUID(),
          challengeId: challengeId,
          userId: user.id,
          status: 'active',
          currentProgress: Math.floor(Math.random() * 10),
          totalPoints: Math.floor(Math.random() * 50),
          joinedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          totalXpEarned: 0,
          completedTasksCount: 0,
          streakDays: 0,
          longestStreak: 0,
          role: 'member'
        });
      }
    }

    if (challenges.length > 0) {
      await queryInterface.bulkInsert('group_challenges', challenges);
    }
    if (challengeTasks.length > 0) {
      await queryInterface.bulkInsert('challenge_tasks', challengeTasks);
    }
    if (participants.length > 0) {
      await queryInterface.bulkInsert('challenge_participants', participants, { ignoreDuplicates: true });
    }
  },

  async down(queryInterface, Sequelize) {
    const titles = [
      'Global Fitness Challenge', 'Global Coding Marathon', 'Photo Contest',
      'Daily Journaling (AI Verified)', 'Weekly Steps', 'Reading Challenge',
      'Meditation Month', 'Healthy Eating', 'Learn a New Skill', 'Community Service'
    ];

    const challenges = await queryInterface.sequelize.query(
      `SELECT id FROM group_challenges WHERE title IN (:titles)`,
      {
        replacements: { titles },
        type: queryInterface.sequelize.QueryTypes.SELECT
      }
    );

    if (challenges.length > 0) {
      const challengeIds = challenges.map(c => c.id);

      await queryInterface.bulkDelete('challenge_participants', { challengeId: challengeIds });
      await queryInterface.bulkDelete('challenge_tasks', { challengeId: challengeIds });
      await queryInterface.bulkDelete('group_challenges', { id: challengeIds });
    }
  }
};
