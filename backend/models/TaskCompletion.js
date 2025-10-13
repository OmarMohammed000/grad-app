import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const TaskCompletion = sequelize.define('TaskCompletion', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    taskId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'tasks',
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
    xpEarned: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0
      },
      comment: 'XP awarded at time of completion'
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'When task was completed'
    },
    durationMinutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Actual time spent on task'
    },
 
    taskSnapshot: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Snapshot of task data at completion time'
    }
  }, {
    tableName: 'task_completions',
    timestamps: true,
    indexes: [
      {
        name: 'idx_task_completions_task_id',
        fields: ['taskId']
      },
      {
        name: 'idx_task_completions_user_id',
        fields: ['userId']
      },
      {
        name: 'idx_task_completions_completed_at',
        fields: ['completedAt']
      },
      {
        name: 'idx_task_completions_user_completed',
        fields: ['userId', 'completedAt']
      },
      {
        name: 'idx_task_completions_xp_earned',
        fields: ['xpEarned']
      }
    ]
  });

  TaskCompletion.associate = (models) => {
    // Belongs to Task
    TaskCompletion.belongsTo(models.Task, {
      foreignKey: 'taskId',
      as: 'task',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    // Belongs to User
    TaskCompletion.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });
  };

  return TaskCompletion;
};