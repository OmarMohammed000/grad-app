'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('challenge_tasks', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      challengeId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'group_challenges',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Challenge task title'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Detailed task description'
      },
      taskType: {
        type: Sequelize.ENUM('required', 'optional', 'bonus'),
        allowNull: false,
        defaultValue: 'required',
        comment: 'Whether task is mandatory for challenge completion'
      },
      pointValue: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
          min: 0
        },
        comment: 'Points toward challenge progress'
      },
      xpReward: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 10,
        validate: {
          min: 0
        },
        comment: 'XP awarded to user character'
      },
      difficulty: {
        type: Sequelize.ENUM('easy', 'medium', 'hard', 'extreme'),
        allowNull: false,
        defaultValue: 'medium',
        comment: 'Task difficulty level'
      },
      isRepeatable: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Can be completed multiple times'
      },
      maxCompletions: {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: {
          min: 1
        },
        comment: 'Maximum completions if repeatable'
      },
      orderIndex: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Display order within challenge'
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Whether task is currently available'
      },
      tags: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
        defaultValue: [],
        comment: 'Task categorization tags'
      },
      requiresProof: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Whether completion requires proof'
      },
      proofInstructions: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Instructions for providing proof'
      },
      estimatedDuration: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Estimated time in minutes'
      },
      availableFrom: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When task becomes available (for phased challenges)'
      },
      availableUntil: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When task is no longer available'
      },
      prerequisites: {
        type: Sequelize.ARRAY(Sequelize.UUID),
        allowNull: true,
        comment: 'Array of task IDs that must be completed first'
      },
      completionCount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Total times this task has been completed'
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
    await queryInterface.addIndex('challenge_tasks', ['challengeId'], {
      name: 'idx_challenge_tasks_challenge_id'
    });

    await queryInterface.addIndex('challenge_tasks', ['taskType'], {
      name: 'idx_challenge_tasks_task_type'
    });

    await queryInterface.addIndex('challenge_tasks', ['isActive'], {
      name: 'idx_challenge_tasks_is_active'
    });

    await queryInterface.addIndex('challenge_tasks', ['challengeId', 'isActive'], {
      name: 'idx_challenge_tasks_challenge_active'
    });

    await queryInterface.addIndex('challenge_tasks', ['orderIndex'], {
      name: 'idx_challenge_tasks_order_index'
    });

    await queryInterface.addIndex('challenge_tasks', ['availableFrom'], {
      name: 'idx_challenge_tasks_available_from'
    });

    await queryInterface.addIndex('challenge_tasks', ['availableUntil'], {
      name: 'idx_challenge_tasks_available_until'
    });

    await queryInterface.addIndex('challenge_tasks', ['tags'], {
      name: 'idx_challenge_tasks_tags',
      using: 'gin'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('challenge_tasks');
  }
};
