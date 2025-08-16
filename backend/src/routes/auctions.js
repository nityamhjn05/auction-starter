// backend/src/routes/auctions.js
import { Router } from 'express';
import { z } from 'zod';
import { Auction } from '../models/index.js';
import { redis } from '../redis.js';
import dayjs from 'dayjs';
import { randomUUID } from 'crypto';

export default function makeAuctionsRoutes(io){
  const r = Router();

  const AuctionSchema = z.object({
    sellerId: z.string(),
    itemName: z.string(),
    description: z.string().optional().default(''),
    startPrice: z.number().int().nonnegative(),
    bidIncrement: z.number().int().positive(),
    goLiveAt: z.coerce.date(),
    endAt: z.coerce.date()
  });

  // create
  r.post('/', async (req, res) => {
    try{
      const input = AuctionSchema.parse(req.body);
      const id = randomUUID();
      const now = dayjs();
      const status = now.isBefore(input.goLiveAt) ? 'scheduled' : (now.isBefore(input.endAt) ? 'live' : 'closed');
      const a = await Auction.create({ id, ...input, status });
      res.json(a);
    }catch(e){ res.status(400).json({ error: e.message }); }
  });

  // list
  r.get('/', async (req, res) => {
    const where = {};
    if(req.query.status) where.status = req.query.status;
    const rows = await Auction.findAll({ where, order: [['goLiveAt','DESC']] });
    const out = await Promise.all(rows.map(async a => {
      const high = await redis.get(`auction:${a.id}:high`);
      return { ...a.toJSON(), highest: high?JSON.parse(high):null };
    }));
    res.json(out);
  });

  // get one
  r.get('/:id', async (req, res) => {
    const a = await Auction.findByPk(req.params.id);
    if(!a) return res.status(404).json({error:'Not found'});
    const high = await redis.get(`auction:${a.id}:high`);
    res.json({ ...a.toJSON(), highest: high?JSON.parse(high):null });
  });

  // --- NEW: end-now (manual close → awaiting_seller) ---
  r.post('/:id/end-now', async (req, res) => {
    const a = await Auction.findByPk(req.params.id);
    if(!a) return res.status(404).json({ error: 'Auction not found' });
    if(a.status === 'closed') return res.status(400).json({ error: 'Auction already closed' });

    // move to awaiting_seller so seller can accept/reject/counter
    a.status = 'awaiting_seller';
    await a.save();

    // notify room so all clients update immediately
    io.to(`auction:${a.id}`).emit('auction:ended', { auctionId: a.id });

    res.json({ ok: true, id: a.id, status: a.status });
  });

  return r;
}
