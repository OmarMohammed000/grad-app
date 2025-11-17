'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add 'task_uncompleted' and 'habit_uncompleted' to the activityType enum
    // PostgreSQL requires adding enum values one at a time
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_activity_logs_activityType" ADD VALUE IF NOT EXISTS 'task_uncompleted';
    `);
    
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_activity_logs_activityType" ADD VALUE IF NOT EXISTS 'habit_uncompleted';
    `);
  },

  async down(queryInterface, Sequelize) {
    // Note: PostgreSQL does not support removing enum values directly
    // To properly remove them, you would need to:
    // 1. Create a new enum without these values
    // 2. Update all rows to use the new enum
    // 3. Drop the old enum
    // 4. Rename the new enum
    // This is complex and risky, so we'll leave a comment instead
    
    // For safety, we'll just log a warning
    console.warn('Cannot remove enum values in PostgreSQL. Manual intervention required if needed.');
    
    // If you really need to remove them, you would need to:
    // 1. Check if any rows use these values
    // 2. Update those rows to a different activityType
    // 3. Then recreate the enum type
    
    // For now, we'll leave the enum values in place
  }
};

