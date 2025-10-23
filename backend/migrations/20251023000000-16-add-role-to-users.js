'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'role', {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: 'user',
      comment: 'User role: user or admin'
    });

    // Add index for faster role-based queries
    await queryInterface.addIndex('users', ['role'], {
      name: 'idx_users_role'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('users', 'idx_users_role');
    await queryInterface.removeColumn('users', 'role');
  }
};
