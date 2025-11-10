'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('challenge_progress', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
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
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: 'Date of progress entry'
      },
      progressValue: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0
        },
        comment: 'Progress points accumulated on this date'
      },
      tasksCompleted: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0
        },
        comment: 'Number of challenge tasks completed on this date'
      },
      xpEarned: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0
        },
        comment: 'XP earned from challenge tasks on this date'
      },
      pointsEarned: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0
        },
        comment: 'Challenge points earned on this date'
      },
      cumulativeProgress: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0
        },
        comment: 'Total progress up to this date'
      },
      rankOnDate: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Participant rank on this date'
      },
      streakCount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0
        },
        comment: 'Activity streak count on this date'
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

    // Add unique constraint: one entry per participant per date
    await queryInterface.addConstraint('challenge_progress', {
      fields: ['participantId', 'date'],
      type: 'unique',
      name: 'unique_participant_progress_per_date'
    });

    // Add indexes
    await queryInterface.addIndex('challenge_progress', ['participantId'], {
      name: 'idx_challenge_progress_participant_id'
    });

    await queryInterface.addIndex('challenge_progress', ['challengeId'], {
      name: 'idx_challenge_progress_challenge_id'
    });

    await queryInterface.addIndex('challenge_progress', ['userId'], {
      name: 'idx_challenge_progress_user_id'
    });

    await queryInterface.addIndex('challenge_progress', ['date'], {
      name: 'idx_challenge_progress_date'
    });

    await queryInterface.addIndex('challenge_progress', ['challengeId', 'date'], {
      name: 'idx_challenge_progress_challenge_date'
    });

    await queryInterface.addIndex('challenge_progress', ['participantId', 'date'], {
      name: 'idx_challenge_progress_participant_date'
    });

    await queryInterface.addIndex('challenge_progress', ['progressValue'], {
      name: 'idx_challenge_progress_progress_value'
    });

    await queryInterface.addIndex('challenge_progress', ['cumulativeProgress'], {
      name: 'idx_challenge_progress_cumulative_progress'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('challenge_progress');
  }
};
