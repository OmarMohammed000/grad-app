import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Character = sequelize.define('Character', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    rankId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      references: {
        model: 'ranks',
        key: 'id'
      }
    },
    level: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1
      }
    },
    currentXp: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      },
      comment: 'Current XP progress toward next level'
    },
    totalXp: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      },
      comment: 'Lifetime XP for leaderboard ranking'
    },
    xpToNextLevel: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100,
      validate: {
        min: 1
      },
      comment: 'XP required for next level'
    },
    globalRanking: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Position in global leaderboard (calculated)'
    },
    streakDays: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      },
      comment: 'Consecutive days with activity'
    },
    longestStreak: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      },
      comment: 'Personal best streak record'
    },
    lastStreakDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: 'Last date user maintained streak'
    },
    lastActiveDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: 'Last date user had any activity'
    },
    totalTasksCompleted: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    totalHabitsCompleted: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    totalChallengesJoined: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    totalChallengesCompleted: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    }
  }, {
    tableName: 'characters',
    timestamps: true,
    indexes: [
      {
        name: 'idx_characters_user_id',
        unique: true,
        fields: ['userId']
      },
      {
        name: 'idx_characters_total_xp',
        fields: ['totalXp']
      },
      {
        name: 'idx_characters_global_ranking',
        fields: ['globalRanking']
      },
      {
        name: 'idx_characters_rank_id',
        fields: ['rankId']
      },
      {
        name: 'idx_characters_level',
        fields: ['level']
      },
      {
        name: 'idx_characters_last_active_date',
        fields: ['lastActiveDate']
      }
    ]
  });

  Character.associate = (models) => {
    // Belongs to User
    Character.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    // Belongs to Rank
    Character.belongsTo(models.Rank, {
      foreignKey: 'rankId',
      as: 'rank',
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    });
  };

  return Character;
};