'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('user_profiles', 'pushToken', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Expo push token for mobile notifications'
    });

    await queryInterface.addColumn('user_profiles', 'pushTokenPlatform', {
      type: Sequelize.STRING(20),
      allowNull: true,
      comment: 'Platform of the push token (ios, android, web)'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('user_profiles', 'pushToken');
    await queryInterface.removeColumn('user_profiles', 'pushTokenPlatform');
  }
};
