import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    api_key: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    plan: {
      type: DataTypes.STRING,
      defaultValue: 'free' // free/pro/business
    }
  }, {
    tableName: 'users',
    timestamps: false,
    indexes: [
      { fields: ['email'] },
      { fields: ['api_key'] }
    ]
  });

  return User;
};
