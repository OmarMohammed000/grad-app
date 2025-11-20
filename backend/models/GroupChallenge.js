import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const GroupChallenge = sequelize.define('GroupChallenge', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'User who created the challenge'
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Challenge name/title'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Detailed challenge description'
    },
    challengeType: {
      type: DataTypes.ENUM('competitive', 'collaborative'),
      allowNull: false,
      defaultValue: 'competitive',
      comment: 'Whether participants compete or collaborate'
    },
    goalType: {
      // Currently only task_count and total_xp are supported.
      type: DataTypes.ENUM('task_count', 'total_xp'),
      allowNull: false,
      comment: 'Type of goal for the challenge'
    },
    goalTarget: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      },
      comment: 'Target number for the goal'
    },
    goalDescription: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Detailed description of the goal'
    },
    status: {
      type: DataTypes.ENUM('upcoming', 'active', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'upcoming',
      comment: 'Current challenge status'
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Whether challenge is discoverable'
    },
    inviteCode: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: true,
      comment: 'Invite code for private challenges'
    },
    maxParticipants: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 2
      },
      comment: 'Maximum number of participants (null = unlimited)'
    },
    currentParticipants: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1
      },
      comment: 'Current number of participants'
    },
    xpReward: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      },
      comment: 'Bonus XP for completing challenge'
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'When challenge becomes active'
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'When challenge ends'
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: [],
      comment: 'Challenge categorization tags'
    },
    rules: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Challenge rules and requirements'
    },
    prizeDescription: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Description of prizes/rewards'
    },
    // TODO: Verification system not yet implemented
    // requiresVerification: {
    //   type: DataTypes.BOOLEAN,
    //   allowNull: false,
    //   defaultValue: false,
    //   comment: 'Whether task completions need verification'
    // },
    isTeamBased: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Whether participants form teams'
    },
    teamSize: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 2
      },
      comment: 'Size of teams if team-based'
    },
    difficultyLevel: {
      type: DataTypes.ENUM('beginner', 'intermediate', 'advanced', 'expert'),
      allowNull: false,
      defaultValue: 'intermediate',
      comment: 'Challenge difficulty level'
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When challenge was completed'
    }
  }, {
    tableName: 'group_challenges',
    timestamps: true,
    indexes: [
      {
        name: 'idx_group_challenges_created_by',
        fields: ['createdBy']
      },
      {
        name: 'idx_group_challenges_status',
        fields: ['status']
      },
      {
        name: 'idx_group_challenges_is_public',
        fields: ['isPublic']
      },
      {
        name: 'idx_group_challenges_start_date',
        fields: ['startDate']
      },
      {
        name: 'idx_group_challenges_end_date',
        fields: ['endDate']
      },
      {
        name: 'idx_group_challenges_invite_code',
        unique: true,
        fields: ['inviteCode']
      },
      {
        name: 'idx_group_challenges_tags',
        fields: ['tags'],
        using: 'gin'
      },
      {
        name: 'idx_group_challenges_difficulty',
        fields: ['difficultyLevel']
      }
    ],
    validate: {
      endDateAfterStartDate() {
        if (this.endDate <= this.startDate) {
          throw new Error('End date must be after start date');
        }
      }
    }
  });

  GroupChallenge.associate = (models) => {
    // Belongs to User (creator)
    GroupChallenge.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    // One-to-many relationships
    GroupChallenge.hasMany(models.ChallengeTask, {
      foreignKey: 'challengeId',
      as: 'challengeTasks',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    GroupChallenge.hasMany(models.ChallengeParticipant, {
      foreignKey: 'challengeId',
      as: 'participants',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    GroupChallenge.hasMany(models.ChallengeProgress, {
      foreignKey: 'challengeId',
      as: 'progress',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });
  };

  return GroupChallenge;
};