import { DataTypes } from 'sequelize';
import sequelize from '../sequelize.js';

const CounterOffer = sequelize.define('CounterOffer', {
  id: { type: DataTypes.STRING, primaryKey: true },
  auctionId: { type: DataTypes.STRING, allowNull: false },
  sellerId: { type: DataTypes.STRING, allowNull: false },
  bidderId: { type: DataTypes.STRING, allowNull: false },
  amount: DataTypes.INTEGER,
  status: { 
    type: DataTypes.ENUM('pending', 'accepted', 'rejected'), 
    defaultValue: 'pending' 
  }
});

export default CounterOffer;
