// backend/src/routes/decisions.js
import { Router } from 'express';
import { Auction, Notification } from '../models/index.js';
import { redis } from '../redis.js';
import { randomUUID } from 'crypto';
import { buildInvoice } from '../pdf.js';

// Helper: save notification in DB and emit via socket
async function notifyAndSave(io, userId, type, payload = {}) {
  const id = randomUUID();
  await Notification.create({ id, userId, type, payload });
  io.to(`user:${userId}`).emit('notify', { id, userId, type, payload });
}

export default function makeDecisionRoutes(io){
  const r = Router();

  // SELLER decision: accept | reject | counter
  r.post('/:id/decision', async (req, res) => {
    const { action, amount } = req.body; // action: accept | reject | counter
    const auctionId = req.params.id;

    const a = await Auction.findByPk(auctionId);
    if(!a) return res.status(404).json({error:'Auction not found'});

    const highest = await redis.get(`auction:${auctionId}:high`).then(x=>x?JSON.parse(x):null);
    if(!highest) return res.status(400).json({error:'No bids'});

    if(action === 'accept'){
      a.status = 'closed';
      await a.save();

      // Build invoice PDF (we keep “emails” as labels in PDF; they’re identifiers in this mode)
      const invoiceBuf = await buildInvoice({
        buyerEmail: `${highest.bidderId}`,
        sellerEmail: `${a.sellerId}`,
        itemName: a.itemName,
        amount: highest.amount,
        invoiceNo: randomUUID()
      });
      const invoiceBase64 = invoiceBuf.toString('base64');

      // Notify buyer + seller with invoice in payload
      await notifyAndSave(io, highest.bidderId, 'accepted', {
        auctionId,
        amount: highest.amount,
        message: `Your bid for ${a.itemName} was accepted.`,
        invoiceBase64
      });
      await notifyAndSave(io, a.sellerId, 'accepted', {
        auctionId,
        amount: highest.amount,
        message: `You accepted a bid of ₹${highest.amount} for ${a.itemName}.`,
        invoiceBase64
      });

      return res.json({ ok: true });
    }

    if(action === 'reject'){
      a.status = 'closed';
      await a.save();
      await notifyAndSave(io, highest.bidderId, 'rejected', {
        auctionId,
        message: `Your bid for ${a.itemName} was rejected.`
      });
      return res.json({ ok: true });
    }

    if(action === 'counter'){
      if(!(amount > 0)) return res.status(400).json({error:'Amount required'});
      await redis.set(`auction:${auctionId}:counter`, JSON.stringify({
        amount,
        sellerId: a.sellerId,
        bidderId: highest.bidderId
      }));
      // in-app notify top bidder
      await notifyAndSave(io, highest.bidderId, 'counter', {
        auctionId,
        amount,
        message: `Seller countered ₹${amount} for ${a.itemName}.`
      });
      return res.json({ ok: true });
    }

    res.status(400).json({error:'Invalid action'});
  });

  // BUYER decision on seller's counter: accept | reject
  r.post('/:id/counter/decision', async (req, res) => {
    const auctionId = req.params.id;
    const { action, bidderId } = req.body; // bidderId is the acting user (top bidder)
    const a = await Auction.findByPk(auctionId);
    if(!a) return res.status(404).json({error:'Auction not found'});

    const raw = await redis.get(`auction:${auctionId}:counter`);
    if(!raw) return res.status(400).json({error:'No counter pending'});
    const counter = JSON.parse(raw);

    if(counter.bidderId !== bidderId){
      return res.status(403).json({error:'Only the top bidder can respond to this counter'});
    }

    if(action === 'accept'){
      a.status = 'closed';
      await a.save();
      await redis.del(`auction:${auctionId}:counter`);

      // Build invoice for the counter amount
      const invoiceBuf = await buildInvoice({
        buyerEmail: `${bidderId}`,
        sellerEmail: `${counter.sellerId}`,
        itemName: a.itemName,
        amount: counter.amount,
        invoiceNo: randomUUID()
      });
      const invoiceBase64 = invoiceBuf.toString('base64');

      // notify both with invoice
      await notifyAndSave(io, counter.sellerId, 'counter_accepted', {
        auctionId,
        amount: counter.amount,
        message: `Buyer accepted your counter for ${a.itemName} at ₹${counter.amount}.`,
        invoiceBase64
      });
      await notifyAndSave(io, bidderId, 'accepted', {
        auctionId,
        amount: counter.amount,
        message: `You accepted the seller's counter for ${a.itemName} at ₹${counter.amount}.`,
        invoiceBase64
      });

      return res.json({ ok: true });
    }

    if(action === 'reject'){
      await redis.del(`auction:${auctionId}:counter`);
      await notifyAndSave(io, counter.sellerId, 'counter_rejected', {
        auctionId,
        message: `Buyer rejected your counter for ${a.itemName}.`
      });
      await notifyAndSave(io, bidderId, 'rejected', {
        auctionId,
        message: `You rejected the seller's counter for ${a.itemName}.`
      });
      return res.json({ ok: true });
    }

    res.status(400).json({error:'Invalid action'});
  });

  // Read pending counter for UI
  r.get('/:id/counter', async (req, res) => {
    const raw = await redis.get(`auction:${req.params.id}:counter`);
    res.json(raw ? JSON.parse(raw) : null);
  });

  return r;
}
