import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Wrestler = sequelize.define('Wrestler', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    school: {
      type: DataTypes.STRING
    },
    weight_class: {
      type: DataTypes.STRING
    },
    rank: {
      type: DataTypes.INTEGER
    },
    source: {
      type: DataTypes.STRING
    },
    last_updated: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'wrestlers',
    timestamps: false,
    indexes: [
      {
        fields: ['name', 'weight_class', 'source'],
        unique: true,
        name: 'unique_wrestler_per_source'
      },
      { fields: ['name'] },
      { fields: ['weight_class'] },
      { fields: ['source'] }
    ]
  });

  return Wrestler;
};
