import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Task = sequelize.define('Task', {
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
      comment: 'Task title/name'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Detailed task description'
    },
    status: {
      type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
      comment: 'Current task status'
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      allowNull: false,
      defaultValue: 'medium',
      comment: 'Task priority level'
    },
    difficulty: {
      type: DataTypes.ENUM('easy', 'medium', 'hard', 'extreme'),
      allowNull: false,
      defaultValue: 'medium',
      comment: 'Task difficulty affecting XP reward'
    },
    xpReward: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 25,
      validate: {
        min: 1
      },
      comment: 'XP awarded upon completion'
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: [],
      comment: 'Array of tags for categorization'
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Optional deadline for task'
    },
    reminderTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When to send reminder notification'
    },
    estimatedDuration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Estimated time in minutes'
    },
    actualDuration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Actual time spent in minutes'
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Task location (optional)'
    },
    isRecurring: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Whether task repeats (creates new instances)'
    },
    recurringPattern: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Recurring pattern details (frequency, interval, etc.)'
    },
    parentTaskId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'tasks',
        key: 'id'
      },
      comment: 'Parent task for subtasks'
    },
    orderIndex: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Order within user task list'
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'tasks',
    timestamps: true,
    indexes: [
      {
        name: 'idx_tasks_user_id',
        fields: ['userId']
      },
      {
        name: 'idx_tasks_status',
        fields: ['status']
      },
      {
        name: 'idx_tasks_user_status',
        fields: ['userId', 'status']
      },
      {
        name: 'idx_tasks_due_date',
        fields: ['dueDate']
      },
      {
        name: 'idx_tasks_priority',
        fields: ['priority']
      },
      {
        name: 'idx_tasks_parent_task_id',
        fields: ['parentTaskId']
      },
      {
        name: 'idx_tasks_tags',
        fields: ['tags'],
        using: 'gin'
      },
      {
        name: 'idx_tasks_created_at',
        fields: ['createdAt']
      }
    ]
  });

  Task.associate = (models) => {
    // Belongs to User
    Task.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    // Self-referential relationship for subtasks
    Task.belongsTo(models.Task, {
      foreignKey: 'parentTaskId',
      as: 'parentTask',
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    Task.hasMany(models.Task, {
      foreignKey: 'parentTaskId',
      as: 'subtasks',
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // One-to-many with TaskCompletion
    Task.hasMany(models.TaskCompletion, {
      foreignKey: 'taskId',
      as: 'completions',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });
  };

  return Task;
};