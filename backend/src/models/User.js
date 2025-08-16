// backend/src/models/User.js
import sequelize from '../sequelize.js';
import { DataTypes } from 'sequelize';

const User = sequelize.define('User', {
  id: { type: DataTypes.STRING, primaryKey: true },
  name: DataTypes.STRING,
  email: { type: DataTypes.STRING, unique: true },
  role: { 
    type: DataTypes.ENUM('buyer', 'seller', 'admin'), 
    allowNull: false,
    defaultValue: 'buyer'
  }
});

export default User;
