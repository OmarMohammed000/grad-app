import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const HabitCompletion = sequelize.define('HabitCompletion', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    habitId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'habits',
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
    completedDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: 'Date habit was completed (YYYY-MM-DD)'
    },
    xpEarned: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0
      },
      comment: 'XP awarded at time of completion'
    },
    completionTime: {
      type: DataTypes.TIME,
      allowNull: true,
      comment: 'Time of day habit was completed'
    },
    streakCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: 'Streak count at time of completion'
    },
    habitSnapshot: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Snapshot of habit data at completion time'
    }
  }, {
    tableName: 'habit_completions',
    timestamps: true,
    indexes: [
      {
        name: 'idx_habit_completions_habit_id',
        fields: ['habitId']
      },
      {
        name: 'idx_habit_completions_user_id',
        fields: ['userId']
      },
      {
        name: 'idx_habit_completions_completed_date',
        fields: ['completedDate']
      },
      {
        name: 'idx_habit_completions_user_date',
        fields: ['userId', 'completedDate']
      },
      {
        name: 'idx_habit_completions_habit_date',
        fields: ['habitId', 'completedDate']
      }
    ],
    // Add unique constraint: one completion per habit per day
    uniqueKeys: {
      unique_habit_completion_per_day: {
        fields: ['habitId', 'completedDate']
      }
    }
  });

  HabitCompletion.associate = (models) => {
    // Belongs to Habit
    HabitCompletion.belongsTo(models.Habit, {
      foreignKey: 'habitId',
      as: 'habit',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    // Belongs to User
    HabitCompletion.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });
  };

  return HabitCompletion;
};