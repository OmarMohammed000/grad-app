'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add notification preferences field to user_profiles
    await queryInterface.addColumn('user_profiles', 'notificationPreferences', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: {
        taskDeadlines: true,
        habitStreaks: true,
        challengeUpdates: true,
        challengeInvitations: true,
        inactiveReminders: true,
        deadlineAdvanceHours: 24
      },
      comment: 'User notification preferences'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('user_profiles', 'notificationPreferences');
  }
};
