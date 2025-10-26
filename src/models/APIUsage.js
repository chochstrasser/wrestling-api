import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const APIUsage = sequelize.define('APIUsage', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    requests: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: 'api_usage',
    timestamps: false
  });

  return APIUsage;
};
