'use strict';
import bcrypt from 'bcryptjs';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash('Admin@12345', 10);

    // Create admin user
    const [adminUser] = await queryInterface.bulkInsert('users', [{
      id: Sequelize.literal('uuid_generate_v4()'),
      email: 'admin@huntergame.com',
      password: hashedPassword,
      role: 'admin',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }], { returning: true });

    const adminUserId = adminUser?.id || (await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE email = 'admin@huntergame.com' LIMIT 1`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    ))[0]?.id;

    if (!adminUserId) {
      throw new Error('Failed to create admin user');
    }

    // Create admin profile
    await queryInterface.bulkInsert('user_profiles', [{
      id: Sequelize.literal('uuid_generate_v4()'),
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

    // Create admin character (S-Rank, max level for demo)
    await queryInterface.bulkInsert('characters', [{
      id: Sequelize.literal('uuid_generate_v4()'),
      userId: adminUserId,
      rankId: 1, // Adjust based on your ranks - use E-Rank ID
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
