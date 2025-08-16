// backend/src/routes/bids.js
import { Router } from 'express';
import { z } from 'zod';
import dayjs from 'dayjs';
import { randomUUID } from 'crypto';
import { Auction, Bid, Notification } from '../models/index.js';
import { redis } from '../redis.js';

export default function makeBidRoutes(io) {
  const r = Router();

  const BidSchema = z.object({
    amount: z.number().int().positive(),
    bidderId: z.string()
  });

  // Place a bid
  r.post('/:id/bids', async (req, res) => {
    try {
      const { amount, bidderId } = BidSchema.parse(req.body);
      const auctionId = req.params.id;

      const a = await Auction.findByPk(auctionId);
      if (!a) return res.status(404).json({ error: 'Auction not found' });

      const now = dayjs();
      if (!(now.isAfter(a.goLiveAt) && now.isBefore(a.endAt))) {
        return res.status(400).json({ error: 'Auction not live' });
      }

      // Optimistic concurrency on "highest" using Redis WATCH/MULTI
      const key = `auction:${auctionId}:high`;
      let ok = false;
      let cur; // previous highest
      let min;

      while (!ok) {
        await redis.watch(key);
        const raw = await redis.get(key);
        cur = raw ? JSON.parse(raw) : null;

        min = (cur ? cur.amount : a.startPrice) + a.bidIncrement;
        if (amount < min) {
          await redis.unwatch();
          return res.status(400).json({ error: `Bid too low. Min ${min}` });
        }

        const tx = redis.multi();
        tx.set(key, JSON.stringify({ amount, bidderId }));
        const exec = await tx.exec(); // null if key changed
        ok = !!exec;
      }

      // Persist bid row
      const id = randomUUID();
      const b = await Bid.create({ id, auctionId, bidderId, amount });

      // Broadcast real-time highest to everyone in the room
      io.to(`auction:${auctionId}`).emit('bid:update', {
        auctionId, amount, bidderId, bidId: b.id
      });

      // Notify SELLER that a new bid arrived (persist + emit)
      try {
        const nidSeller = randomUUID();
        await Notification.create({
          id: nidSeller,
          userId: a.sellerId,
          type: 'new_bid',
          payload: {
            auctionId,
            amount,
            bidderId,
            message: `New bid ₹${amount} on ${a.itemName}`
          }
        });
        io.to(`user:${a.sellerId}`).emit('notify', {
          id: nidSeller,
          type: 'new_bid',
          payload: {
            auctionId,
            amount,
            bidderId,
            message: `New bid ₹${amount} on ${a.itemName}`
          }
        });
      } catch { /* non-fatal */ }

      // Notify PREVIOUS highest they were outbid (only if different user)
      if (cur && cur.bidderId && cur.bidderId !== bidderId) {
        try {
          const nidPrev = randomUUID();
          await Notification.create({
            id: nidPrev,
            userId: cur.bidderId,
            type: 'outbid',
            payload: {
              auctionId,
              amount,
              message: `You were outbid on ${a.itemName}`
            }
          });
          io.to(`user:${cur.bidderId}`).emit('notify', {
            id: nidPrev,
            type: 'outbid',
            payload: {
              auctionId,
              amount,
              message: `You were outbid on ${a.itemName}`
            }
          });
        } catch { /* non-fatal */ }
      }

      // (Optional) Toast for participants in room
      io.to(`auction:${auctionId}`).emit('notify', {
        type: 'new_bid_room',
        payload: { auctionId, amount, bidderId, message: `New highest bid ₹${amount}` }
      });

      res.json({ ok: true, id: b.id });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  return r;
}
