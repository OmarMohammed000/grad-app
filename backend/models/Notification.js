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
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Type of notification (e.g., verification_result, challenge_invite)'
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
