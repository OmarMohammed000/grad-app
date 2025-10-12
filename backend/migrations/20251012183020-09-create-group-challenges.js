'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('group_challenges', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      createdBy: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'User who created the challenge'
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Challenge name/title'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Detailed challenge description'
      },
      challengeType: {
        type: Sequelize.ENUM('competitive', 'collaborative'),
        allowNull: false,
        defaultValue: 'competitive',
        comment: 'Whether participants compete or collaborate'
      },
      goalType: {
        type: Sequelize.ENUM('task_count', 'total_xp', 'habit_streak', 'custom'),
        allowNull: false,
        comment: 'Type of goal for the challenge'
      },
      goalTarget: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 1
        },
        comment: 'Target number for the goal'
      },
      goalDescription: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Detailed description of the goal'
      },
      status: {
        type: Sequelize.ENUM('upcoming', 'active', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'upcoming',
        comment: 'Current challenge status'
      },
      isPublic: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Whether challenge is discoverable'
      },
      inviteCode: {
        type: Sequelize.STRING(20),
        allowNull: true,
        unique: true,
        comment: 'Invite code for private challenges'
      },
      maxParticipants: {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: {
          min: 2
        },
        comment: 'Maximum number of participants (null = unlimited)'
      },
      currentParticipants: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
          min: 1
        },
        comment: 'Current number of participants'
      },
      xpReward: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0
        },
        comment: 'Bonus XP for completing challenge'
      },
      startDate: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: 'When challenge becomes active'
      },
      endDate: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: 'When challenge ends'
      },
      tags: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
        defaultValue: [],
        comment: 'Challenge categorization tags'
      },
      rules: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Challenge rules and requirements'
      },
      prizeDescription: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Description of prizes/rewards'
      },
      requiresVerification: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Whether task completions need verification'
      },
      isTeamBased: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Whether participants form teams'
      },
      teamSize: {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: {
          min: 2
        },
        comment: 'Size of teams if team-based'
      },
      difficultyLevel: {
        type: Sequelize.ENUM('beginner', 'intermediate', 'advanced', 'expert'),
        allowNull: false,
        defaultValue: 'intermediate',
        comment: 'Challenge difficulty level'
      },
      completedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When challenge was completed'
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
    await queryInterface.addIndex('group_challenges', ['createdBy'], {
      name: 'idx_group_challenges_created_by'
    });

    await queryInterface.addIndex('group_challenges', ['status'], {
      name: 'idx_group_challenges_status'
    });

    await queryInterface.addIndex('group_challenges', ['isPublic'], {
      name: 'idx_group_challenges_is_public'
    });

    await queryInterface.addIndex('group_challenges', ['startDate'], {
      name: 'idx_group_challenges_start_date'
    });

    await queryInterface.addIndex('group_challenges', ['endDate'], {
      name: 'idx_group_challenges_end_date'
    });

    await queryInterface.addIndex('group_challenges', ['inviteCode'], {
      name: 'idx_group_challenges_invite_code',
      unique: true
    });

    await queryInterface.addIndex('group_challenges', ['tags'], {
      name: 'idx_group_challenges_tags',
      using: 'gin'
    });

    await queryInterface.addIndex('group_challenges', ['difficultyLevel'], {
      name: 'idx_group_challenges_difficulty'
    });

    // Add check constraints
    await queryInterface.addConstraint('group_challenges', {
      fields: ['endDate'],
      type: 'check',
      name: 'check_end_date_after_start_date',
      where: {
        endDate: {
          [Sequelize.Op.gt]: Sequelize.col('startDate')
        }
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('group_challenges');
  }
};
