'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'refreshToken', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'Hashed refresh token for JWT authentication'
    });

    await queryInterface.addIndex('users', ['refreshToken'], {
      name: 'idx_users_refresh_token'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('users', 'idx_users_refresh_token');
    await queryInterface.removeColumn('users', 'refreshToken');
  }
};
