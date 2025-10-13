import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Rank = sequelize.define('Rank', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: 'Rank name (E-Rank, D-Rank, etc.)'
    },
    minLevel: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Minimum level required for this rank'
    },
    maxLevel: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Maximum level for this rank (null for highest rank)'
    },
    color: {
      type: DataTypes.STRING(7),
      allowNull: false,
      defaultValue: '#808080',
      comment: 'Hex color code for UI display'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Rank description for users'
    },
    orderIndex: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      comment: 'Order for sorting ranks'
    }
  }, {
    tableName: 'ranks',
    timestamps: true,
    indexes: [
      {
        name: 'idx_ranks_order',
        fields: ['orderIndex']
      },
      {
        name: 'idx_ranks_min_level',
        fields: ['minLevel']
      }
    ]
  });

  Rank.associate = (models) => {
    // One-to-many relationship
    Rank.hasMany(models.Character, {
      foreignKey: 'rankId',
      as: 'characters',
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    });
  };

  return Rank;
};