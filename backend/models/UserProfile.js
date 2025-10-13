import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const UserProfile = sequelize.define('UserProfile', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    displayName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'Hunter',
      comment: 'User chosen display name'
    },
    firstName: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    lastName: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    avatarUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Profile picture URL'
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'User biography/description'
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    timezone: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'UTC',
      comment: 'User timezone for scheduling'
    },
    language: {
      type: DataTypes.STRING(5),
      allowNull: false,
      defaultValue: 'en',
      comment: 'Preferred language (ISO code)'
    },
    theme: {
      type: DataTypes.ENUM('light', 'dark', 'auto'),
      allowNull: false,
      defaultValue: 'auto',
      comment: 'UI theme preference'
    },
    notificationsEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Push notification preference'
    },
    emailNotifications: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Email notification preference'
    },
    soundEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Sound effects preference'
    },
    isPublicProfile: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Profile visibility to other users'
    }
  }, {
    tableName: 'user_profiles',
    timestamps: true,
    indexes: [
      {
        name: 'idx_user_profiles_user_id',
        unique: true,
        fields: ['userId']
      },
      {
        name: 'idx_user_profiles_display_name',
        fields: ['displayName']
      },
      {
        name: 'idx_user_profiles_is_public',
        fields: ['isPublicProfile']
      }
    ]
  });

  UserProfile.associate = (models) => {
    // Belongs to User
    UserProfile.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });
  };

  return UserProfile;
};