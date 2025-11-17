import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const ChallengeProgress = sequelize.define('ChallengeProgress', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    participantId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'challenge_participants',
        key: 'id'
      }
    },
    challengeId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'group_challenges',
        key: 'id'
      }
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: 'Date of progress entry'
    },
    progressValue: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      },
      comment: 'Progress points accumulated on this date'
    },
    tasksCompleted: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      },
      comment: 'Number of challenge tasks completed on this date'
    },
    xpEarned: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      },
      comment: 'XP earned from challenge tasks on this date'
    },
    pointsEarned: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      },
      comment: 'Challenge points earned on this date'
    },
    cumulativeProgress: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      },
      comment: 'Total progress up to this date'
    },
    rankOnDate: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Participant rank on this date'
    },
    streakCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      },
      comment: 'Activity streak count on this date'
    }
  }, {
    tableName: 'challenge_progress',
    timestamps: true,
    indexes: [
      {
        name: 'idx_challenge_progress_participant_id',
        fields: ['participantId']
      },
      {
        name: 'idx_challenge_progress_challenge_id',
        fields: ['challengeId']
      },
      {
        name: 'idx_challenge_progress_user_id',
        fields: ['userId']
      },
      {
        name: 'idx_challenge_progress_date',
        fields: ['date']
      },
      {
        name: 'idx_challenge_progress_challenge_date',
        fields: ['challengeId', 'date']
      },
      {
        name: 'idx_challenge_progress_participant_date',
        fields: ['participantId', 'date']
      },
      {
        name: 'idx_challenge_progress_progress_value',
        fields: ['progressValue']
      },
      {
        name: 'idx_challenge_progress_cumulative_progress',
        fields: ['cumulativeProgress']
      }
    ],
    // Add unique constraint: one entry per participant per date
    uniqueKeys: {
      unique_participant_progress_per_date: {
        fields: ['participantId', 'date']
      }
    }
  });

  ChallengeProgress.associate = (models) => {
    // Belongs to ChallengeParticipant
    ChallengeProgress.belongsTo(models.ChallengeParticipant, {
      foreignKey: 'participantId',
      as: 'participant',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    // Belongs to GroupChallenge
    ChallengeProgress.belongsTo(models.GroupChallenge, {
      foreignKey: 'challengeId',
      as: 'challenge',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    // Belongs to User
    ChallengeProgress.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });
  };

  return ChallengeProgress;
};