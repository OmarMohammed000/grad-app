import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const ChallengeTask = sequelize.define('ChallengeTask', {
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
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Challenge task title'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Detailed task description'
    },
    taskType: {
      type: DataTypes.ENUM('required', 'optional', 'bonus'),
      allowNull: false,
      defaultValue: 'required',
      comment: 'Whether task is mandatory for challenge completion'
    },
    pointValue: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 0
      },
      comment: 'Points toward challenge progress'
    },
    xpReward: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10,
      validate: {
        min: 0
      },
      comment: 'XP awarded to user character'
    },
    difficulty: {
      type: DataTypes.ENUM('easy', 'medium', 'hard', 'extreme'),
      allowNull: false,
      defaultValue: 'medium',
      comment: 'Task difficulty level'
    },
    isRepeatable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Can be completed multiple times'
    },
    maxCompletions: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1
      },
      comment: 'Maximum completions if repeatable'
    },
    orderIndex: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Display order within challenge'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Whether task is currently available'
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: [],
      comment: 'Task categorization tags'
    },
    // TODO: Verification system not yet implemented
    // requiresProof: {
    //   type: DataTypes.BOOLEAN,
    //   allowNull: false,
    //   defaultValue: false,
    //   comment: 'Whether completion requires proof'
    // },
    // proofInstructions: {
    //   type: DataTypes.TEXT,
    //   allowNull: true,
    //   comment: 'Instructions for providing proof'
    // },
    estimatedDuration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Estimated time in minutes'
    },
    availableFrom: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When task becomes available (for phased challenges)'
    },
    availableUntil: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When task is no longer available'
    },
    prerequisites: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      allowNull: true,
      comment: 'Array of task IDs that must be completed first'
    },
    completionCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Total times this task has been completed'
    }
  }, {
    tableName: 'challenge_tasks',
    timestamps: true,
    indexes: [
      {
        name: 'idx_challenge_tasks_challenge_id',
        fields: ['challengeId']
      },
      {
        name: 'idx_challenge_tasks_task_type',
        fields: ['taskType']
      },
      {
        name: 'idx_challenge_tasks_is_active',
        fields: ['isActive']
      },
      {
        name: 'idx_challenge_tasks_challenge_active',
        fields: ['challengeId', 'isActive']
      },
      {
        name: 'idx_challenge_tasks_order_index',
        fields: ['orderIndex']
      },
      {
        name: 'idx_challenge_tasks_available_from',
        fields: ['availableFrom']
      },
      {
        name: 'idx_challenge_tasks_available_until',
        fields: ['availableUntil']
      },
      {
        name: 'idx_challenge_tasks_tags',
        fields: ['tags'],
        using: 'gin'
      }
    ]
  });

  ChallengeTask.associate = (models) => {
    // Belongs to GroupChallenge
    ChallengeTask.belongsTo(models.GroupChallenge, {
      foreignKey: 'challengeId',
      as: 'challenge',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    // One-to-many with ChallengeTaskCompletion
    ChallengeTask.hasMany(models.ChallengeTaskCompletion, {
      foreignKey: 'challengeTaskId',
      as: 'completions',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });
  };

  return ChallengeTask;
};