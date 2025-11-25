'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('challenge_tasks');

    if (!tableInfo.requiresProof) {
      await queryInterface.addColumn('challenge_tasks', 'requiresProof', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Whether completion requires proof'
      });
    }

    if (!tableInfo.proofInstructions) {
      await queryInterface.addColumn('challenge_tasks', 'proofInstructions', {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Instructions for providing proof'
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('challenge_tasks');

    if (tableInfo.proofInstructions) {
      await queryInterface.removeColumn('challenge_tasks', 'proofInstructions');
    }

    if (tableInfo.requiresProof) {
      await queryInterface.removeColumn('challenge_tasks', 'requiresProof');
    }
  }
};
