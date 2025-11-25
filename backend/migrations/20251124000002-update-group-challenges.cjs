'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add new columns
    await queryInterface.addColumn('group_challenges', 'isGlobal', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    await queryInterface.addColumn('group_challenges', 'verificationType', {
      type: Sequelize.ENUM('none', 'manual', 'ai'),
      allowNull: false,
      defaultValue: 'none'
    });

    // Remove old columns
    await queryInterface.removeColumn('group_challenges', 'isTeamBased');
    await queryInterface.removeColumn('group_challenges', 'teamSize');
    
    // Add index for isGlobal
    await queryInterface.addIndex('group_challenges', ['isGlobal'], {
      name: 'idx_group_challenges_is_global'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Revert changes
    await queryInterface.removeColumn('group_challenges', 'isGlobal');
    await queryInterface.removeColumn('group_challenges', 'verificationType');
    
    await queryInterface.addColumn('group_challenges', 'isTeamBased', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
    
    await queryInterface.addColumn('group_challenges', 'teamSize', {
      type: Sequelize.INTEGER,
      allowNull: true
    });
  }
};
