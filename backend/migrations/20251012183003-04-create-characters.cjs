'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('characters', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      rankId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1, // E-Rank
        references: {
          model: 'ranks',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      level: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
          min: 1
        }
      },
      currentXp: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0
        },
        comment: 'Current XP progress toward next level'
      },
      totalXp: {
        type: Sequelize.BIGINT,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0
        },
        comment: 'Lifetime XP for leaderboard ranking'
      },
      xpToNextLevel: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 100,
        validate: {
          min: 1
        },
        comment: 'XP required for next level'
      },
      globalRanking: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Position in global leaderboard (calculated)'
      },
      streakDays: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0
        },
        comment: 'Consecutive days with activity'
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
      lastStreakDate: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: 'Last date user maintained streak'
      },
      lastActiveDate: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: 'Last date user had any activity'
      },
      totalTasksCompleted: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0
        }
      },
      totalHabitsCompleted: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0
        }
      },
      totalChallengesJoined: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0
        }
      },
      totalChallengesCompleted: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0
        }
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

    // Add indexes for performance
    await queryInterface.addIndex('characters', ['userId'], {
      name: 'idx_characters_user_id',
      unique: true
    });

    await queryInterface.addIndex('characters', ['totalXp'], {
      name: 'idx_characters_total_xp'
    });

    await queryInterface.addIndex('characters', ['globalRanking'], {
      name: 'idx_characters_global_ranking'
    });

    await queryInterface.addIndex('characters', ['rankId'], {
      name: 'idx_characters_rank_id'
    });

    await queryInterface.addIndex('characters', ['level'], {
      name: 'idx_characters_level'
    });

    await queryInterface.addIndex('characters', ['lastActiveDate'], {
      name: 'idx_characters_last_active_date'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('characters');
  }
};
