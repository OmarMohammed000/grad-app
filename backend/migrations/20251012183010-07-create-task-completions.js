'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('task_completions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      taskId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'tasks',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      xpEarned: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 0
        },
        comment: 'XP awarded at time of completion'
      },
      completedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        comment: 'When task was completed'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'User notes about completion'
      },
      durationMinutes: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Actual time spent on task'
      },
      difficultyRating: {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: {
          min: 1,
          max: 5
        },
        comment: 'User rating of actual difficulty (1-5)'
      },
      satisfactionRating: {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: {
          min: 1,
          max: 5
        },
        comment: 'User satisfaction with completion (1-5)'
      },
      taskSnapshot: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Snapshot of task data at completion time'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes
    await queryInterface.addIndex('task_completions', ['taskId'], {
      name: 'idx_task_completions_task_id'
    });

    await queryInterface.addIndex('task_completions', ['userId'], {
      name: 'idx_task_completions_user_id'
    });

    await queryInterface.addIndex('task_completions', ['completedAt'], {
      name: 'idx_task_completions_completed_at'
    });

    await queryInterface.addIndex('task_completions', ['userId', 'completedAt'], {
      name: 'idx_task_completions_user_completed'
    });

    await queryInterface.addIndex('task_completions', ['xpEarned'], {
      name: 'idx_task_completions_xp_earned'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('task_completions');
  }
};
