import { DataTypes } from 'sequelize';
import sequelize from '../sequelize.js';

const Notification = sequelize.define('Notification', {
  id: { type: DataTypes.STRING, primaryKey: true },
  userId: { type: DataTypes.STRING, allowNull: false },
  type: DataTypes.STRING,
  payload: DataTypes.JSON,
  readAt: DataTypes.DATE
});

export default Notification;
