import { DataTypes } from 'sequelize';
import sequelize from '../sequelize.js';

const Bid = sequelize.define('Bid', {
  id: { type: DataTypes.STRING, primaryKey: true },
  auctionId: { type: DataTypes.STRING, allowNull: false },
  bidderId: { type: DataTypes.STRING, allowNull: false },
  amount: DataTypes.INTEGER,
});

export default Bid;
