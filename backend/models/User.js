import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Hashed password using bcrypt'
    },
    googleId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
      comment: 'Google OAuth identifier'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true
    },
    refreshToken: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Hashed refresh token for JWT authentication'
    },
    role: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'user',
      validate: {
        isIn: [['user', 'admin']]
      },
      comment: 'User role: user or admin'
    }
  }, {
    tableName: 'users',
    timestamps: true,
    indexes: [
      {
        name: 'idx_users_email',
        unique: true,
        fields: ['email']
      },
      {
        name: 'idx_users_google_id',
        unique: true,
        fields: ['googleId']
      },
      {
        name: 'idx_users_is_active',
        fields: ['isActive']
      }
    ]
  });

  User.associate = (models) => {
    // One-to-one relationships
    User.hasOne(models.UserProfile, {
      foreignKey: 'userId',
      as: 'profile',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    User.hasOne(models.Character, {
      foreignKey: 'userId',
      as: 'character',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    // One-to-many relationships
    User.hasMany(models.Task, {
      foreignKey: 'userId',
      as: 'tasks',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    User.hasMany(models.Habit, {
      foreignKey: 'userId',
      as: 'habits',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    User.hasMany(models.TaskCompletion, {
      foreignKey: 'userId',
      as: 'taskCompletions',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    User.hasMany(models.HabitCompletion, {
      foreignKey: 'userId',
      as: 'habitCompletions',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    User.hasMany(models.GroupChallenge, {
      foreignKey: 'createdBy',
      as: 'createdChallenges',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    User.hasMany(models.ChallengeParticipant, {
      foreignKey: 'userId',
      as: 'challengeParticipations',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    User.hasMany(models.ChallengeTaskCompletion, {
      foreignKey: 'userId',
      as: 'challengeTaskCompletions',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    User.hasMany(models.ChallengeTaskCompletion, {
      foreignKey: 'verifiedBy',
      as: 'verifiedCompletions',
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    User.hasMany(models.ChallengeProgress, {
      foreignKey: 'userId',
      as: 'challengeProgress',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    User.hasMany(models.ActivityLog, {
      foreignKey: 'userId',
      as: 'activityLogs',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    User.hasMany(models.ChallengeParticipant, {
      foreignKey: 'invitedBy',
      as: 'invitedParticipants',
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  };

  return User;
};