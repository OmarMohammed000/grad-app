'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('activity_logs', {
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
      activityType: {
        type: Sequelize.ENUM(
          'task_completed', 'task_created', 'task_updated', 'task_deleted',
          'habit_completed', 'habit_created', 'habit_updated', 'habit_deleted',
          'level_up', 'rank_up', 'rank_down',
          'challenge_joined', 'challenge_created', 'challenge_completed', 'challenge_left',
          'challenge_task_completed', 'challenge_won', 'challenge_lost',
          'streak_milestone', 'streak_broken',
          'xp_earned', 'achievement_unlocked',
          'user_registered', 'profile_updated',
          'friend_added', 'friend_removed'
        ),
        allowNull: false,
        comment: 'Type of activity performed'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Human-readable description of activity'
      },
      xpGained: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'XP gained from this activity'
      },
      levelBefore: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'User level before activity (for level-up events)'
      },
      levelAfter: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'User level after activity (for level-up events)'
      },
      rankBefore: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'User rank before activity (for rank-up events)'
      },
      rankAfter: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'User rank after activity (for rank-up events)'
      },
      relatedTaskId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'tasks',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Related task (if applicable)'
      },
      relatedHabitId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'habits',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Related habit (if applicable)'
      },
      relatedChallengeId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'group_challenges',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Related challenge (if applicable)'
      },
      relatedUserId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Related user (for social activities)'
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Additional flexible data for the activity'
      },
      isPublic: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Whether activity is visible to other users'
      },
      importance: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'milestone'),
        allowNull: false,
        defaultValue: 'medium',
        comment: 'Activity importance level for filtering'
      },
      deviceInfo: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Device/platform where activity occurred'
      },
      location: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Location where activity occurred (if relevant)'
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
    await queryInterface.addIndex('activity_logs', ['userId'], {
      name: 'idx_activity_logs_user_id'
    });

    await queryInterface.addIndex('activity_logs', ['activityType'], {
      name: 'idx_activity_logs_activity_type'
    });

    await queryInterface.addIndex('activity_logs', ['userId', 'activityType'], {
      name: 'idx_activity_logs_user_activity'
    });

    await queryInterface.addIndex('activity_logs', ['createdAt'], {
      name: 'idx_activity_logs_created_at'
    });

    await queryInterface.addIndex('activity_logs', ['userId', 'createdAt'], {
      name: 'idx_activity_logs_user_created'
    });

    await queryInterface.addIndex('activity_logs', ['isPublic'], {
      name: 'idx_activity_logs_is_public'
    });

    await queryInterface.addIndex('activity_logs', ['importance'], {
      name: 'idx_activity_logs_importance'
    });

    await queryInterface.addIndex('activity_logs', ['relatedTaskId'], {
      name: 'idx_activity_logs_related_task_id'
    });

    await queryInterface.addIndex('activity_logs', ['relatedHabitId'], {
      name: 'idx_activity_logs_related_habit_id'
    });

    await queryInterface.addIndex('activity_logs', ['relatedChallengeId'], {
      name: 'idx_activity_logs_related_challenge_id'
    });

    await queryInterface.addIndex('activity_logs', ['metadata'], {
      name: 'idx_activity_logs_metadata',
      using: 'gin'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('activity_logs');
  }
};
