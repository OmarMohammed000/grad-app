import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Notification = sequelize.define('Notification', {
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
      },
      comment: 'User who receives the notification'
    },
    type: {
      type: DataTypes.ENUM(
        'task_deadline_nearing',
        'habit_streak_expiring',
        'challenge_task_created',
        'challenge_task_deadline',
        'challenge_ending_soon',
        'challenge_invitation',
        'challenge_completed',
        'inactive_user_reminder',
        'verification_result',
        'challenge_invite'
      ),
      allowNull: false,
      comment: 'Type of notification'
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Short notification title'
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Notification message content'
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Whether the notification has been read'
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Additional data related to the notification'
    },
    relatedEntityType: {
      type: DataTypes.ENUM('task', 'habit', 'challenge', 'challenge_task'),
      allowNull: true,
      comment: 'Type of related entity for deep linking'
    },
    relatedEntityId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'ID of the related entity'
    },
    scheduledFor: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When notification should be sent (for future scheduling)'
    },
    sentAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When notification was actually sent'
    }
  }, {
    tableName: 'notifications',
    timestamps: true,
    indexes: [
      {
        name: 'idx_notifications_user_id',
        fields: ['userId']
      },
      {
        name: 'idx_notifications_is_read',
        fields: ['isRead']
      },
      {
        name: 'idx_notifications_scheduled_for',
        fields: ['scheduledFor']
      },
      {
        name: 'idx_notifications_sent_at',
        fields: ['sentAt']
      },
      {
        name: 'idx_notifications_related_entity_id',
        fields: ['relatedEntityId']
      },
      {
        name: 'idx_notifications_related_entity_type',
        fields: ['relatedEntityType']
      }
    ]
  });

  Notification.associate = (models) => {
    Notification.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });
  };

  return Notification;
};
