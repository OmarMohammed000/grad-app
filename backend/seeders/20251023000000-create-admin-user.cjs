'use strict';
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash('Admin@12345', 10);

    // Generate UUIDs
    const adminUserId = crypto.randomUUID();
    const profileId = crypto.randomUUID();
    const characterId = crypto.randomUUID();

    // Create admin user
    await queryInterface.bulkInsert('users', [{
      id: adminUserId,
      email: 'admin@huntergame.com',
      password: hashedPassword,
      role: 'admin',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }]);

    // Create admin profile
    await queryInterface.bulkInsert('user_profiles', [{
      id: profileId,
      userId: adminUserId,
      displayName: 'System Admin',
      timezone: 'UTC',
      language: 'en',
      theme: 'dark',
      notificationsEnabled: true,
      emailNotifications: true,
      soundEnabled: true,
      isPublicProfile: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }]);

    // Create admin character (E-Rank, level 1)
    await queryInterface.bulkInsert('characters', [{
      id: characterId,
      userId: adminUserId,
      rankId: 1, // E-Rank ID
      level: 1,
      currentXp: 0,
      totalXp: 0,
      xpToNextLevel: 100,
      streakDays: 0,
      longestStreak: 0,
      totalTasksCompleted: 0,
      totalHabitsCompleted: 0,
      totalChallengesJoined: 0,
      totalChallengesCompleted: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }]);

    console.log('✅ Admin user created:');
    console.log('   Email: admin@huntergame.com');
    console.log('   Password: Admin@12345');
    console.log('   ⚠️  CHANGE THIS PASSWORD IMMEDIATELY IN PRODUCTION!');
  },

  async down(queryInterface, Sequelize) {
    const adminUser = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE email = 'admin@huntergame.com' LIMIT 1`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (adminUser.length > 0) {
      const adminUserId = adminUser[0].id;
      await queryInterface.bulkDelete('characters', { userId: adminUserId });
      await queryInterface.bulkDelete('user_profiles', { userId: adminUserId });
      await queryInterface.bulkDelete('users', { email: 'admin@huntergame.com' });
    }
  }
};
