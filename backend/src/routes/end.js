// backend/src/routes/end.js
import { Router } from 'express';
import { Auction, Notification } from '../models/index.js';
import { redis } from '../redis.js';
import { randomUUID } from 'crypto';

export default function makeManualEndRoutes(io){
  const r = Router();

  // Force-end a specific auction (seller/admin tool)
  r.post('/:id/end-now', async (req, res) => {
    const auctionId = req.params.id;
    const a = await Auction.findByPk(auctionId);
    if (!a) return res.status(404).json({ error: 'Auction not found' });

    // If already past live, just return current status
    if (a.status === 'awaiting_seller' || a.status === 'closed') {
      return res.json({ ok: true, status: a.status });
    }

    // Flip to awaiting_seller immediately
    a.status = 'awaiting_seller';
    await a.save();

    // Highest bid (if any)
    const high = await redis.get(`auction:${a.id}:high`).then(x => x ? JSON.parse(x) : null);

    // Notify room -> AuctionRoom will flip UI
    io.to(`auction:${a.id}`).emit('auction:ended', { auctionId: a.id });

    // Notify seller to take action
    try {
      const nid = randomUUID();
      await Notification.create({
        id: nid, userId: a.sellerId, type: 'awaiting_seller',
        payload: { auctionId: a.id, message: `Auction ended. Review highest bid for ${a.itemName}` }
      });
      io.to(`user:${a.sellerId}`).emit('notify', {
        id: nid, type: 'awaiting_seller',
        payload: { auctionId: a.id, message: `Auction ended. Review highest bid for ${a.itemName}` }
      });
    } catch {}

    // Notify highest bidder (if any)
    if (high?.bidderId) {
      try {
        const nid = randomUUID();
        await Notification.create({
          id: nid, userId: high.bidderId, type: 'auction_ended_top',
          payload: { auctionId: a.id, amount: high.amount, message: `Auction ended. You are highest at ₹${high.amount}` }
        });
        io.to(`user:${high.bidderId}`).emit('notify', {
          id: nid, type: 'auction_ended_top',
          payload: { auctionId: a.id, amount: high.amount, message: `Auction ended. You are highest at ₹${high.amount}` }
        });
      } catch {}
    }

    res.json({ ok: true, status: a.status });
  });

  return r;
}
