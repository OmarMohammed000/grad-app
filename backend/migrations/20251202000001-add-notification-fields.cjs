'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add new fields to notifications table
    await queryInterface.addColumn('notifications', 'title', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'Short notification title'
    });

    await queryInterface.addColumn('notifications', 'relatedEntityType', {
      type: Sequelize.ENUM('task', 'habit', 'challenge', 'challenge_task'),
      allowNull: true,
      comment: 'Type of related entity for deep linking'
    });

    await queryInterface.addColumn('notifications', 'relatedEntityId', {
      type: Sequelize.UUID,
      allowNull: true,
      comment: 'ID of the related entity'
    });

    await queryInterface.addColumn('notifications', 'scheduledFor', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'When notification should be sent (for future scheduling)'
    });

    await queryInterface.addColumn('notifications', 'sentAt', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'When notification was actually sent'
    });

    // For PostgreSQL, we need to drop and recreate the type column with ENUM
    // First, add a temporary column with the new ENUM type
    await queryInterface.addColumn('notifications', 'type_new', {
      type: Sequelize.ENUM(
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
      defaultValue: 'verification_result',
      comment: 'Type of notification'
    });

    // Copy data from old column to new column
    await queryInterface.sequelize.query(`
      UPDATE notifications 
      SET type_new = CASE 
        WHEN type = 'verification_result' THEN 'verification_result'::enum_notifications_type_new
        WHEN type = 'challenge_invite' THEN 'challenge_invite'::enum_notifications_type_new
        ELSE 'verification_result'::enum_notifications_type_new
      END
    `);

    // Drop old column
    await queryInterface.removeColumn('notifications', 'type');

    // Rename new column to type
    await queryInterface.renameColumn('notifications', 'type_new', 'type');

    // Add indexes for better query performance
    await queryInterface.addIndex('notifications', ['scheduledFor'], {
      name: 'idx_notifications_scheduled_for'
    });

    await queryInterface.addIndex('notifications', ['sentAt'], {
      name: 'idx_notifications_sent_at'
    });

    await queryInterface.addIndex('notifications', ['relatedEntityId'], {
      name: 'idx_notifications_related_entity_id'
    });

    await queryInterface.addIndex('notifications', ['relatedEntityType'], {
      name: 'idx_notifications_related_entity_type'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes
    await queryInterface.removeIndex('notifications', 'idx_notifications_scheduled_for');
    await queryInterface.removeIndex('notifications', 'idx_notifications_sent_at');
    await queryInterface.removeIndex('notifications', 'idx_notifications_related_entity_id');
    await queryInterface.removeIndex('notifications', 'idx_notifications_related_entity_type');

    // Remove columns
    await queryInterface.removeColumn('notifications', 'title');
    await queryInterface.removeColumn('notifications', 'relatedEntityType');
    await queryInterface.removeColumn('notifications', 'relatedEntityId');
    await queryInterface.removeColumn('notifications', 'scheduledFor');
    await queryInterface.removeColumn('notifications', 'sentAt');

    // Revert type column to STRING
    await queryInterface.addColumn('notifications', 'type_temp', {
      type: Sequelize.STRING(50),
      allowNull: false,
      defaultValue: 'verification_result',
      comment: 'Type of notification (e.g., verification_result, challenge_invite)'
    });

    await queryInterface.sequelize.query(`
      UPDATE notifications SET type_temp = type::text
    `);

    await queryInterface.removeColumn('notifications', 'type');
    await queryInterface.renameColumn('notifications', 'type_temp', 'type');
  }
};
