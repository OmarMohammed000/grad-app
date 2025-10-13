import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const ChallengeParticipant = sequelize.define('ChallengeParticipant', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
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
    status: {
      type: DataTypes.ENUM('active', 'completed', 'dropped_out', 'disqualified'),
      allowNull: false,
      defaultValue: 'active',
      comment: 'Participant status in challenge'
    },
    currentProgress: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      },
      comment: 'Current progress toward challenge goal'
    },
    totalPoints: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      },
      comment: 'Total points earned in challenge'
    },
    totalXpEarned: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      },
      comment: 'Total XP earned from challenge tasks'
    },
    rank: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1
      },
      comment: 'Current ranking in challenge'
    },
    completedTasksCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      },
      comment: 'Number of challenge tasks completed'
    },
    joinedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'When user joined the challenge'
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When user completed the challenge'
    },
    droppedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When user dropped out of challenge'
    },
    teamId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Team ID for team-based challenges'
    },
    role: {
      type: DataTypes.ENUM('member', 'team_leader', 'moderator'),
      allowNull: false,
      defaultValue: 'member',
      comment: 'Participant role in challenge'
    },
    invitedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'Who invited this participant'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Participant notes or motivation'
    },
    lastActivityDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: 'Last date participant was active'
    },
    streakDays: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      },
      comment: 'Current streak within challenge'
    },
    longestStreak: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      },
      comment: 'Longest streak achieved in challenge'
    },
    badges: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: [],
      comment: 'Badges earned in this challenge'
    }
  }, {
    tableName: 'challenge_participants',
    timestamps: true,
    indexes: [
      {
        name: 'idx_challenge_participants_challenge_id',
        fields: ['challengeId']
      },
      {
        name: 'idx_challenge_participants_user_id',
        fields: ['userId']
      },
      {
        name: 'idx_challenge_participants_status',
        fields: ['status']
      },
      {
        name: 'idx_challenge_participants_challenge_status',
        fields: ['challengeId', 'status']
      },
      {
        name: 'idx_challenge_participants_current_progress',
        fields: ['currentProgress']
      },
      {
        name: 'idx_challenge_participants_rank',
        fields: ['rank']
      },
      {
        name: 'idx_challenge_participants_team_id',
        fields: ['teamId']
      },
      {
        name: 'idx_challenge_participants_joined_at',
        fields: ['joinedAt']
      },
      {
        name: 'idx_challenge_participants_last_activity_date',
        fields: ['lastActivityDate']
      }
    ],
    // Add unique constraint: user can join challenge only once
    uniqueKeys: {
      unique_user_per_challenge: {
        fields: ['challengeId', 'userId']
      }
    }
  });

  ChallengeParticipant.associate = (models) => {
    // Belongs to GroupChallenge
    ChallengeParticipant.belongsTo(models.GroupChallenge, {
      foreignKey: 'challengeId',
      as: 'challenge',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    // Belongs to User
    ChallengeParticipant.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    // Invited by User (self-referential)
    ChallengeParticipant.belongsTo(models.User, {
      foreignKey: 'invitedBy',
      as: 'inviter',
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // One-to-many relationships
    ChallengeParticipant.hasMany(models.ChallengeTaskCompletion, {
      foreignKey: 'participantId',
      as: 'taskCompletions',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    ChallengeParticipant.hasMany(models.ChallengeProgress, {
      foreignKey: 'participantId',
      as: 'progress',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });
  };

  return ChallengeParticipant;
};