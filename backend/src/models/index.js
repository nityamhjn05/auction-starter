// backend/src/models/index.js
import sequelize from '../sequelize.js';
import User from './User.js';
import Auction from './Auction.js';
import Bid from './Bid.js';
import Notification from './Notification.js';
import CounterOffer from './CounterOffer.js';

Auction.hasMany(Bid, { foreignKey: 'auctionId' });
Bid.belongsTo(Auction, { foreignKey: 'auctionId' });

export { sequelize, User, Auction, Bid, Notification, CounterOffer };
export default { sequelize, User, Auction, Bid, Notification, CounterOffer };
