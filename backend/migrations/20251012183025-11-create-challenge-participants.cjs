'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('challenge_participants', {
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
      status: {
        type: Sequelize.ENUM('active', 'completed', 'dropped_out', 'disqualified'),
        allowNull: false,
        defaultValue: 'active',
        comment: 'Participant status in challenge'
      },
      currentProgress: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0
        },
        comment: 'Current progress toward challenge goal'
      },
      totalPoints: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0
        },
        comment: 'Total points earned in challenge'
      },
      totalXpEarned: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0
        },
        comment: 'Total XP earned from challenge tasks'
      },
      rank: {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: {
          min: 1
        },
        comment: 'Current ranking in challenge'
      },
      completedTasksCount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0
        },
        comment: 'Number of challenge tasks completed'
      },
      joinedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        comment: 'When user joined the challenge'
      },
      completedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When user completed the challenge'
      },
      droppedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When user dropped out of challenge'
      },
      teamId: {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'Team ID for team-based challenges'
      },
      role: {
        type: Sequelize.ENUM('member', 'team_leader', 'moderator'),
        allowNull: false,
        defaultValue: 'member',
        comment: 'Participant role in challenge'
      },
      invitedBy: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Who invited this participant'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Participant notes or motivation'
      },
      lastActivityDate: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: 'Last date participant was active'
      },
      streakDays: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0
        },
        comment: 'Current streak within challenge'
      },
      longestStreak: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0
        },
        comment: 'Longest streak achieved in challenge'
      },
      badges: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
        defaultValue: [],
        comment: 'Badges earned in this challenge'
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

    // Add unique constraint: user can join challenge only once
    await queryInterface.addConstraint('challenge_participants', {
      fields: ['challengeId', 'userId'],
      type: 'unique',
      name: 'unique_user_per_challenge'
    });

    // Add indexes
    await queryInterface.addIndex('challenge_participants', ['challengeId'], {
      name: 'idx_challenge_participants_challenge_id'
    });

    await queryInterface.addIndex('challenge_participants', ['userId'], {
      name: 'idx_challenge_participants_user_id'
    });

    await queryInterface.addIndex('challenge_participants', ['status'], {
      name: 'idx_challenge_participants_status'
    });

    await queryInterface.addIndex('challenge_participants', ['challengeId', 'status'], {
      name: 'idx_challenge_participants_challenge_status'
    });

    await queryInterface.addIndex('challenge_participants', ['currentProgress'], {
      name: 'idx_challenge_participants_current_progress'
    });

    await queryInterface.addIndex('challenge_participants', ['rank'], {
      name: 'idx_challenge_participants_rank'
    });

    await queryInterface.addIndex('challenge_participants', ['teamId'], {
      name: 'idx_challenge_participants_team_id'
    });

    await queryInterface.addIndex('challenge_participants', ['joinedAt'], {
      name: 'idx_challenge_participants_joined_at'
    });

    await queryInterface.addIndex('challenge_participants', ['lastActivityDate'], {
      name: 'idx_challenge_participants_last_activity_date'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('challenge_participants');
  }
};
