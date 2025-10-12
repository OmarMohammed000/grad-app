'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('habit_completions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      habitId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'habits',
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
      completedDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: 'Date habit was completed (YYYY-MM-DD)'
      },
      xpEarned: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 0
        },
        comment: 'XP awarded at time of completion'
      },
      completionTime: {
        type: Sequelize.TIME,
        allowNull: true,
        comment: 'Time of day habit was completed'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'User notes about completion'
      },
      mood: {
        type: Sequelize.ENUM('very_bad', 'bad', 'neutral', 'good', 'excellent'),
        allowNull: true,
        comment: 'User mood when completing habit'
      },
      difficultyRating: {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: {
          min: 1,
          max: 5
        },
        comment: 'User rating of difficulty (1-5)'
      },
      energyLevel: {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: {
          min: 1,
          max: 5
        },
        comment: 'User energy level (1-5)'
      },
      streakCount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: 'Streak count at time of completion'
      },
      habitSnapshot: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Snapshot of habit data at completion time'
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

    // Add unique constraint: one completion per habit per day
    await queryInterface.addConstraint('habit_completions', {
      fields: ['habitId', 'completedDate'],
      type: 'unique',
      name: 'unique_habit_completion_per_day'
    });

    // Add indexes
    await queryInterface.addIndex('habit_completions', ['habitId'], {
      name: 'idx_habit_completions_habit_id'
    });

    await queryInterface.addIndex('habit_completions', ['userId'], {
      name: 'idx_habit_completions_user_id'
    });

    await queryInterface.addIndex('habit_completions', ['completedDate'], {
      name: 'idx_habit_completions_completed_date'
    });

    await queryInterface.addIndex('habit_completions', ['userId', 'completedDate'], {
      name: 'idx_habit_completions_user_date'
    });

    await queryInterface.addIndex('habit_completions', ['habitId', 'completedDate'], {
      name: 'idx_habit_completions_habit_date'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('habit_completions');
  }
};
