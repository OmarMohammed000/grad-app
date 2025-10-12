'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('challenge_task_completions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      challengeTaskId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'challenge_tasks',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      participantId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'challenge_participants',
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
      pointsEarned: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 0
        },
        comment: 'Points earned toward challenge progress'
      },
      xpEarned: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 0
        },
        comment: 'XP awarded to user character'
      },
      completedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      proof: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Text proof of task completion'
      },
      proofImageUrl: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Image proof URL'
      },
      isVerified: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Whether completion has been verified'
      },
      verifiedBy: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Who verified the completion'
      },
      verifiedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When completion was verified'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'User notes about completion'
      },
      verificationNotes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Verifier notes'
      },
      difficultyRating: {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: {
          min: 1,
          max: 5
        },
        comment: 'User difficulty rating (1-5)'
      },
      satisfactionRating: {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: {
          min: 1,
          max: 5
        },
        comment: 'User satisfaction rating (1-5)'
      },
      durationMinutes: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Time spent on task'
      },
      completionNumber: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: 'Which completion this is for repeatable tasks'
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
    await queryInterface.addIndex('challenge_task_completions', ['challengeTaskId'], {
      name: 'idx_challenge_task_completions_task_id'
    });

    await queryInterface.addIndex('challenge_task_completions', ['participantId'], {
      name: 'idx_challenge_task_completions_participant_id'
    });

    await queryInterface.addIndex('challenge_task_completions', ['userId'], {
      name: 'idx_challenge_task_completions_user_id'
    });

    await queryInterface.addIndex('challenge_task_completions', ['completedAt'], {
      name: 'idx_challenge_task_completions_completed_at'
    });

    await queryInterface.addIndex('challenge_task_completions', ['isVerified'], {
      name: 'idx_challenge_task_completions_is_verified'
    });

    await queryInterface.addIndex('challenge_task_completions', ['challengeTaskId', 'userId'], {
      name: 'idx_challenge_task_completions_task_user'
    });

    await queryInterface.addIndex('challenge_task_completions', ['participantId', 'completedAt'], {
      name: 'idx_challenge_task_completions_participant_date'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('challenge_task_completions');
  }
};
