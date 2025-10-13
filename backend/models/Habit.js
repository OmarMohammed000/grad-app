import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Habit = sequelize.define('Habit', {
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
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Habit name'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Habit description and details'
    },
    difficulty: {
      type: DataTypes.ENUM('easy', 'medium', 'hard', 'extreme'),
      allowNull: false,
      defaultValue: 'medium',
      comment: 'Habit difficulty affecting XP reward'
    },
    xpReward: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 15,
      validate: {
        min: 1
      },
      comment: 'XP awarded for each completion'
    },
    frequency: {
      type: DataTypes.ENUM('daily', 'weekly', 'custom'),
      allowNull: false,
      defaultValue: 'daily',
      comment: 'How often habit should be performed'
    },
    targetDays: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      allowNull: true,
      comment: 'Array of weekday numbers [0-6] where 0=Sunday'
    },
    targetCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1
      },
      comment: 'How many times per period'
    },
    currentStreak: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      },
      comment: 'Current consecutive completion streak'
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
    totalCompletions: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      },
      comment: 'Total times habit was completed'
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: [],
      comment: 'Array of tags for categorization'
    },
    reminderTime: {
      type: DataTypes.TIME,
      allowNull: true,
      comment: 'Daily reminder time'
    },
    reminderDays: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      allowNull: true,
      comment: 'Which days to send reminders [0-6]'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Whether habit is currently being tracked'
    },
    color: {
      type: DataTypes.STRING(7),
      allowNull: true,
      comment: 'Hex color for habit display'
    },
    icon: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Icon identifier for habit'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'User notes about the habit'
    },
    lastCompletedDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: 'Most recent completion date'
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: 'When user started tracking this habit'
    }
  }, {
    tableName: 'habits',
    timestamps: true,
    indexes: [
      {
        name: 'idx_habits_user_id',
        fields: ['userId']
      },
      {
        name: 'idx_habits_is_active',
        fields: ['isActive']
      },
      {
        name: 'idx_habits_user_active',
        fields: ['userId', 'isActive']
      },
      {
        name: 'idx_habits_frequency',
        fields: ['frequency']
      },
      {
        name: 'idx_habits_tags',
        fields: ['tags'],
        using: 'gin'
      },
      {
        name: 'idx_habits_last_completed_date',
        fields: ['lastCompletedDate']
      }
    ]
  });

  Habit.associate = (models) => {
    // Belongs to User
    Habit.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    // One-to-many with HabitCompletion
    Habit.hasMany(models.HabitCompletion, {
      foreignKey: 'habitId',
      as: 'completions',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });
  };

  return Habit;
};