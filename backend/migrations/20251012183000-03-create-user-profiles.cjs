'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_profiles', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      displayName: {
        type: Sequelize.STRING(100),
        allowNull: false,
        defaultValue: 'Hunter',
        comment: 'User chosen display name'
      },
      firstName: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      lastName: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      avatarUrl: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Profile picture URL'
      },
      bio: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'User biography/description'
      },
      dateOfBirth: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      timezone: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'UTC',
        comment: 'User timezone for scheduling'
      },
      language: {
        type: Sequelize.STRING(5),
        allowNull: false,
        defaultValue: 'en',
        comment: 'Preferred language (ISO code)'
      },
      theme: {
        type: Sequelize.ENUM('light', 'dark', 'auto'),
        allowNull: false,
        defaultValue: 'auto',
        comment: 'UI theme preference'
      },
      notificationsEnabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Push notification preference'
      },
      emailNotifications: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Email notification preference'
      },
      soundEnabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Sound effects preference'
      },
      isPublicProfile: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Profile visibility to other users'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes
    await queryInterface.addIndex('user_profiles', ['userId'], {
      name: 'idx_user_profiles_user_id',
      unique: true
    });

    await queryInterface.addIndex('user_profiles', ['displayName'], {
      name: 'idx_user_profiles_display_name'
    });

    await queryInterface.addIndex('user_profiles', ['isPublicProfile'], {
      name: 'idx_user_profiles_is_public'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('user_profiles');
  }
};
