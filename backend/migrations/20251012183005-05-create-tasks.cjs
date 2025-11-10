'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tasks', {
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
        comment: 'Task title/name'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Detailed task description'
      },
      status: {
        type: Sequelize.ENUM('pending', 'in_progress', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
        comment: 'Current task status'
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'critical'),
        allowNull: false,
        defaultValue: 'medium',
        comment: 'Task priority level'
      },
      difficulty: {
        type: Sequelize.ENUM('easy', 'medium', 'hard', 'extreme'),
        allowNull: false,
        defaultValue: 'medium',
        comment: 'Task difficulty affecting XP reward'
      },
      xpReward: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 25,
        validate: {
          min: 1
        },
        comment: 'XP awarded upon completion'
      },
      tags: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
        defaultValue: [],
        comment: 'Array of tags for categorization'
      },
      dueDate: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Optional deadline for task'
      },
      reminderTime: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When to send reminder notification'
      },
      estimatedDuration: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Estimated time in minutes'
      },
      actualDuration: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Actual time spent in minutes'
      },
      location: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Task location (optional)'
      },
      isRecurring: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Whether task repeats (creates new instances)'
      },
      recurringPattern: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Recurring pattern details (frequency, interval, etc.)'
      },
      parentTaskId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'tasks',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Parent task for subtasks'
      },
      orderIndex: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Order within user task list'
      },
      completedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      startedAt: {
        type: Sequelize.DATE,
        allowNull: true
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
    await queryInterface.addIndex('tasks', ['userId'], {
      name: 'idx_tasks_user_id'
    });

    await queryInterface.addIndex('tasks', ['status'], {
      name: 'idx_tasks_status'
    });

    await queryInterface.addIndex('tasks', ['userId', 'status'], {
      name: 'idx_tasks_user_status'
    });

    await queryInterface.addIndex('tasks', ['dueDate'], {
      name: 'idx_tasks_due_date'
    });

    await queryInterface.addIndex('tasks', ['priority'], {
      name: 'idx_tasks_priority'
    });

    await queryInterface.addIndex('tasks', ['parentTaskId'], {
      name: 'idx_tasks_parent_task_id'
    });

    await queryInterface.addIndex('tasks', ['tags'], {
      name: 'idx_tasks_tags',
      using: 'gin'
    });

    await queryInterface.addIndex('tasks', ['createdAt'], {
      name: 'idx_tasks_created_at'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('tasks');
  }
};
