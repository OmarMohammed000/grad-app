'use strict';
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash('Password@123', 10);

    // Create 25 users
    for (let i = 1; i <= 25; i++) {
      const email = `player${i}@huntergame.com`;

      // Check if exists
      const [existing] = await queryInterface.sequelize.query(
        `SELECT id FROM users WHERE email = '${email}'`,
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );

      if (!existing) {
        const userId = crypto.randomUUID();
        const profileId = crypto.randomUUID();
        const charId = crypto.randomUUID();

        // Create user
        await queryInterface.sequelize.query(
          `INSERT INTO users (id, email, password, role, "isActive", "createdAt", "updatedAt") 
                 VALUES ('${userId}', '${email}', '${hashedPassword}', 'user', true, NOW(), NOW())`
        );

        const playerNum = i;

        // Profile
        await queryInterface.sequelize.query(
          `INSERT INTO user_profiles (id, "userId", "displayName", timezone, language, theme, "notificationsEnabled", "emailNotifications", "soundEnabled", "isPublicProfile", "createdAt", "updatedAt")
                 VALUES ('${profileId}', '${userId}', 'Player ${playerNum}', 'UTC', 'en', '${Math.random() > 0.5 ? 'dark' : 'light'}', true, true, true, true, NOW(), NOW())`
        );

        // Character
        let totalXp = 0;
        let level = 1;
        if (playerNum <= 5) { // Newbies
          totalXp = Math.floor(Math.random() * 100);
          level = 1;
        } else if (playerNum <= 15) { // Intermediate
          totalXp = Math.floor(Math.random() * 1500) + 500;
          level = Math.floor(totalXp / 100) + 1;
        } else { // Experts
          totalXp = Math.floor(Math.random() * 5000) + 2000;
          level = Math.floor(totalXp / 100) + 1;
        }

        const currentXp = totalXp % 100;
        const rankId = 1; // Default

        await queryInterface.sequelize.query(
          `INSERT INTO characters (id, "userId", "rankId", level, "currentXp", "totalXp", "xpToNextLevel", "streakDays", "longestStreak", "totalTasksCompleted", "totalHabitsCompleted", "totalChallengesJoined", "totalChallengesCompleted", "createdAt", "updatedAt")
                 VALUES ('${charId}', '${userId}', ${rankId}, ${level}, ${currentXp}, ${totalXp}, 100, ${Math.floor(Math.random() * 20)}, ${Math.floor(Math.random() * 30)}, ${Math.floor(Math.random() * 50)}, ${Math.floor(Math.random() * 50)}, ${Math.floor(Math.random() * 5)}, ${Math.floor(Math.random() * 2)}, NOW(), NOW())`
        );
      }
    }
  },

  async down(queryInterface, Sequelize) {
    const userRecords = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE email LIKE 'player%@huntergame.com'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (userRecords.length > 0) {
      const userIds = userRecords.map(u => `'${u.id}'`).join(',');
      await queryInterface.sequelize.query(`DELETE FROM characters WHERE "userId" IN (${userIds})`);
      await queryInterface.sequelize.query(`DELETE FROM user_profiles WHERE "userId" IN (${userIds})`);
      await queryInterface.sequelize.query(`DELETE FROM users WHERE id IN (${userIds})`);
    }
  }
};
