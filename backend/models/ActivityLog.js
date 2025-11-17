import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const ActivityLog = sequelize.define('ActivityLog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    activityType: {
      type: DataTypes.ENUM(
        'task_completed', 'task_created', 'task_updated', 'task_deleted', 'task_uncompleted',
        'habit_completed', 'habit_created', 'habit_updated', 'habit_deleted', 'habit_uncompleted',
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
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Human-readable description of activity'
    },
    xpGained: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'XP gained from this activity'
    },
    levelBefore: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'User level before activity (for level-up events)'
    },
    levelAfter: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'User level after activity (for level-up events)'
    },
    rankBefore: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'User rank before activity (for rank-up events)'
    },
    rankAfter: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'User rank after activity (for rank-up events)'
    },
    relatedTaskId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'tasks',
        key: 'id'
      },
      comment: 'Related task (if applicable)'
    },
    relatedHabitId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'habits',
        key: 'id'
      },
      comment: 'Related habit (if applicable)'
    },
    relatedChallengeId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'group_challenges',
        key: 'id'
      },
      comment: 'Related challenge (if applicable)'
    },
    relatedUserId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'Related user (for social activities)'
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Additional flexible data for the activity'
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Whether activity is visible to other users'
    },
    importance: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'milestone'),
      allowNull: false,
      defaultValue: 'medium',
      comment: 'Activity importance level for filtering'
    },
    deviceInfo: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Device/platform where activity occurred'
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Location where activity occurred (if relevant)'
    }
  }, {
    tableName: 'activity_logs',
    timestamps: true,
    indexes: [
      {
        name: 'idx_activity_logs_user_id',
        fields: ['userId']
      },
      {
        name: 'idx_activity_logs_activity_type',
        fields: ['activityType']
      },
      {
        name: 'idx_activity_logs_user_activity',
        fields: ['userId', 'activityType']
      },
      {
        name: 'idx_activity_logs_created_at',
        fields: ['createdAt']
      },
      {
        name: 'idx_activity_logs_user_created',
        fields: ['userId', 'createdAt']
      },
      {
        name: 'idx_activity_logs_is_public',
        fields: ['isPublic']
      },
      {
        name: 'idx_activity_logs_importance',
        fields: ['importance']
      },
      {
        name: 'idx_activity_logs_related_task_id',
        fields: ['relatedTaskId']
      },
      {
        name: 'idx_activity_logs_related_habit_id',
        fields: ['relatedHabitId']
      },
      {
        name: 'idx_activity_logs_related_challenge_id',
        fields: ['relatedChallengeId']
      },
      {
        name: 'idx_activity_logs_metadata',
        fields: ['metadata'],
        using: 'gin'
      }
    ]
  });

  ActivityLog.associate = (models) => {
    // Belongs to User (main user)
    ActivityLog.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    // Related User (for social activities)
    ActivityLog.belongsTo(models.User, {
      foreignKey: 'relatedUserId',
      as: 'relatedUser',
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Related Task
    ActivityLog.belongsTo(models.Task, {
      foreignKey: 'relatedTaskId',
      as: 'relatedTask',
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Related Habit
    ActivityLog.belongsTo(models.Habit, {
      foreignKey: 'relatedHabitId',
      as: 'relatedHabit',
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Related Challenge
    ActivityLog.belongsTo(models.GroupChallenge, {
      foreignKey: 'relatedChallengeId',
      as: 'relatedChallenge',
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  };

  return ActivityLog;
};