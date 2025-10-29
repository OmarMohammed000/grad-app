'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ranks', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
        comment: 'Rank name (E-Rank, D-Rank, etc.)'
      },
      minLevel: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Minimum level required for this rank'
      },
      maxLevel: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Maximum level for this rank (null for highest rank)'
      },
      color: {
        type: Sequelize.STRING(7),
        allowNull: false,
        defaultValue: '#808080',
        comment: 'Hex color code for UI display'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Rank description for users'
      },
      orderIndex: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        comment: 'Order for sorting ranks'
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
    await queryInterface.addIndex('ranks', ['orderIndex'], {
      name: 'idx_ranks_order'
    });

    await queryInterface.addIndex('ranks', ['minLevel'], {
      name: 'idx_ranks_min_level'
    });

    // Insert default ranks
    await queryInterface.bulkInsert('ranks', [
      {
        name: 'E-Rank',
        minLevel: 1,
        maxLevel: 10,
        color: '#808080',
        description: 'The starting rank for all Hunters. Basic level abilities.',
        orderIndex: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'D-Rank',
        minLevel: 11,
        maxLevel: 20,
        color: '#8B4513',
        description: 'Proven competence in basic tasks. Slightly above average.',
        orderIndex: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'C-Rank',
        minLevel: 21,
        maxLevel: 35,
        color: '#CD7F32',
        description: 'Experienced Hunter with solid skills and reliability.',
        orderIndex: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'B-Rank',
        minLevel: 36,
        maxLevel: 50,
        color: '#C0C0C0',
        description: 'High-level Hunter with advanced abilities and leadership.',
        orderIndex: 4,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'A-Rank',
        minLevel: 51,
        maxLevel: 70,
        color: '#FFD700',
        description: 'Elite Hunter with exceptional skills and experience.',
        orderIndex: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'S-Rank',
        minLevel: 71,
        maxLevel: 99,
        color: '#9932CC',
        description: 'Top-tier Hunter among the strongest in the world.',
        orderIndex: 6,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'National Level',
        minLevel: 100,
        maxLevel: null,
        color: '#DC143C',
        description: 'Beyond S-Rank. The absolute pinnacle of human potential.',
        orderIndex: 7,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ranks');
  }
};
