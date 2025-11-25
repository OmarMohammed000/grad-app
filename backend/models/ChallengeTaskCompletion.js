import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const ChallengeTaskCompletion = sequelize.define('ChallengeTaskCompletion', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    challengeTaskId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'challenge_tasks',
        key: 'id'
      }
    },
    participantId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'challenge_participants',
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
    pointsEarned: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0
      },
      comment: 'Points earned toward challenge progress'
    },
    xpEarned: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0
      },
      comment: 'XP awarded to user character'
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    proof: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Text proof of task completion'
    },
    proofImageUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Image proof URL'
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Whether completion has been verified'
    },
    verifiedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'Who verified the completion'
    },
    verifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When completion was verified'
    },
    verificationNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Verifier notes'
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'failed'),
      allowNull: false,
      defaultValue: 'pending',
      comment: 'Verification status'
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Reason for rejection'
    },
    aiAnalysis: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'AI verification analysis result'
    },
    durationMinutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Time spent on task'
    },
    completionNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: 'Which completion this is for repeatable tasks'
    }
  }, {
    tableName: 'challenge_task_completions',
    timestamps: true,
    indexes: [
      {
        name: 'idx_challenge_task_completions_task_id',
        fields: ['challengeTaskId']
      },
      {
        name: 'idx_challenge_task_completions_participant_id',
        fields: ['participantId']
      },
      {
        name: 'idx_challenge_task_completions_user_id',
        fields: ['userId']
      },
      {
        name: 'idx_challenge_task_completions_completed_at',
        fields: ['completedAt']
      },
      {
        name: 'idx_challenge_task_completions_is_verified',
        fields: ['isVerified']
      },
      {
        name: 'idx_challenge_task_completions_status',
        fields: ['status']
      },
      {
        name: 'idx_challenge_task_completions_task_user',
        fields: ['challengeTaskId', 'userId']
      },
      {
        name: 'idx_challenge_task_completions_participant_date',
        fields: ['participantId', 'completedAt']
      }
    ]
  });

  ChallengeTaskCompletion.associate = (models) => {
    // Belongs to ChallengeTask
    ChallengeTaskCompletion.belongsTo(models.ChallengeTask, {
      foreignKey: 'challengeTaskId',
      as: 'challengeTask',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    // Belongs to ChallengeParticipant
    ChallengeTaskCompletion.belongsTo(models.ChallengeParticipant, {
      foreignKey: 'participantId',
      as: 'participant',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    // Belongs to User
    ChallengeTaskCompletion.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    // Verified by User (self-referential)
    ChallengeTaskCompletion.belongsTo(models.User, {
      foreignKey: 'verifiedBy',
      as: 'verifier',
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  };

  return ChallengeTaskCompletion;
};