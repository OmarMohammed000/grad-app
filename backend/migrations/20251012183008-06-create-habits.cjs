'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('habits', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
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
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Habit name'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Habit description and details'
      },
      difficulty: {
        type: Sequelize.ENUM('easy', 'medium', 'hard', 'extreme'),
        allowNull: false,
        defaultValue: 'medium',
        comment: 'Habit difficulty affecting XP reward'
      },
      xpReward: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 15,
        validate: {
          min: 1
        },
        comment: 'XP awarded for each completion'
      },
      frequency: {
        type: Sequelize.ENUM('daily', 'weekly', 'custom'),
        allowNull: false,
        defaultValue: 'daily',
        comment: 'How often habit should be performed'
      },
      targetDays: {
        type: Sequelize.ARRAY(Sequelize.INTEGER),
        allowNull: true,
        comment: 'Array of weekday numbers [0-6] where 0=Sunday'
      },
      targetCount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
          min: 1
        },
        comment: 'How many times per period'
      },
      currentStreak: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0
        },
        comment: 'Current consecutive completion streak'
      },
      longestStreak: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0
        },
        comment: 'Personal best streak record'
      },
      totalCompletions: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0
        },
        comment: 'Total times habit was completed'
      },
      tags: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
        defaultValue: [],
        comment: 'Array of tags for categorization'
      },
      reminderTime: {
        type: Sequelize.TIME,
        allowNull: true,
        comment: 'Daily reminder time'
      },
      reminderDays: {
        type: Sequelize.ARRAY(Sequelize.INTEGER),
        allowNull: true,
        comment: 'Which days to send reminders [0-6]'
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Whether habit is currently being tracked'
      },
      color: {
        type: Sequelize.STRING(7),
        allowNull: true,
        comment: 'Hex color for habit display'
      },
      icon: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Icon identifier for habit'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'User notes about the habit'
      },
      lastCompletedDate: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: 'Most recent completion date'
      },
      startDate: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: 'When user started tracking this habit'
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
    await queryInterface.addIndex('habits', ['userId'], {
      name: 'idx_habits_user_id'
    });

    await queryInterface.addIndex('habits', ['isActive'], {
      name: 'idx_habits_is_active'
    });

    await queryInterface.addIndex('habits', ['userId', 'isActive'], {
      name: 'idx_habits_user_active'
    });

    await queryInterface.addIndex('habits', ['frequency'], {
      name: 'idx_habits_frequency'
    });

    await queryInterface.addIndex('habits', ['tags'], {
      name: 'idx_habits_tags',
      using: 'gin'
    });

    await queryInterface.addIndex('habits', ['lastCompletedDate'], {
      name: 'idx_habits_last_completed_date'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('habits');
  }
};
