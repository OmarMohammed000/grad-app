'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add new columns
    await queryInterface.addColumn('challenge_task_completions', 'status', {
      type: Sequelize.ENUM('pending', 'approved', 'rejected', 'failed'),
      allowNull: false,
      defaultValue: 'pending'
    });

    await queryInterface.addColumn('challenge_task_completions', 'rejectionReason', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('challenge_task_completions', 'aiAnalysis', {
      type: Sequelize.JSONB,
      allowNull: true
    });
    
    // Uncommented columns (ensure they exist if they were commented out in model but not in DB, 
    // or create them if they didn't exist. Assuming they didn't exist in DB because they were commented out in model)
    
    // Check if columns exist first to avoid errors if they were partially implemented
    const tableInfo = await queryInterface.describeTable('challenge_task_completions');
    
    if (!tableInfo.proof) {
      await queryInterface.addColumn('challenge_task_completions', 'proof', {
        type: Sequelize.TEXT,
        allowNull: true
      });
    }
    
    if (!tableInfo.proofImageUrl) {
      await queryInterface.addColumn('challenge_task_completions', 'proofImageUrl', {
        type: Sequelize.TEXT,
        allowNull: true
      });
    }
    
    if (!tableInfo.isVerified) {
      await queryInterface.addColumn('challenge_task_completions', 'isVerified', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
    }
    
    if (!tableInfo.verifiedBy) {
      await queryInterface.addColumn('challenge_task_completions', 'verifiedBy', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'SET NULL'
      });
    }
    
    if (!tableInfo.verifiedAt) {
      await queryInterface.addColumn('challenge_task_completions', 'verifiedAt', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }
    
    if (!tableInfo.verificationNotes) {
      await queryInterface.addColumn('challenge_task_completions', 'verificationNotes', {
        type: Sequelize.TEXT,
        allowNull: true
      });
    }

    await queryInterface.addIndex('challenge_task_completions', ['status'], {
      name: 'idx_challenge_task_completions_status'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('challenge_task_completions', 'status');
    await queryInterface.removeColumn('challenge_task_completions', 'rejectionReason');
    await queryInterface.removeColumn('challenge_task_completions', 'aiAnalysis');
    // We might want to keep the other columns if they were intended to be there
  }
};
