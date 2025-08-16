import { DataTypes } from 'sequelize';
import sequelize from '../sequelize.js';

const Auction = sequelize.define('Auction', {
  id: { type: DataTypes.STRING, primaryKey: true },
  sellerId: { type: DataTypes.STRING, allowNull: false },
  itemName: DataTypes.STRING,
  description: DataTypes.TEXT,
  startPrice: DataTypes.INTEGER,
  bidIncrement: DataTypes.INTEGER,
  goLiveAt: DataTypes.DATE,
  endAt: DataTypes.DATE,
  status: { 
    type: DataTypes.ENUM('scheduled', 'live', 'awaiting_seller', 'closed'), 
    defaultValue: 'scheduled' 
  },
  winningBidId: { type: DataTypes.STRING, allowNull: true }
});

export default Auction;
