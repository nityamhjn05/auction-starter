// backend/src/routes/decisions.js
import { Router } from 'express';
import { Auction } from '../models/index.js';
import { redis } from '../redis.js';
import { randomUUID } from 'crypto';
import { sendEmail } from '../email.js';
import { buildInvoice } from '../pdf.js';

export default function makeDecisionRoutes(io){
  const r = Router();

  // SELLER decision: accept | reject | counter
  r.post('/:id/decision', async (req, res) => {
    const { action, amount } = req.body;
    const auctionId = req.params.id;
    const a = await Auction.findByPk(auctionId);
    if(!a) return res.status(404).json({error:'Auction not found'});

    const highest = await redis.get(`auction:${auctionId}:high`).then(x=>x?JSON.parse(x):null);
    if(!highest) return res.status(400).json({error:'No bids'});

    if(action === 'accept'){
      a.status = 'closed';
      await a.save();

      // socket notifs
      io.to(`user:${highest.bidderId}`).emit('notify', { type:'accepted', auctionId, payload:{ amount: highest.amount } });

      // email + invoice
      try{
        const invoice = await buildInvoice({
          buyerEmail: `${highest.bidderId}@example.com`,
          sellerEmail: `${a.sellerId}@example.com`,
          itemName: a.itemName,
          amount: highest.amount,
          invoiceNo: randomUUID()
        });
        const att = [{ content: invoice.toString('base64'), filename: 'invoice.pdf', type: 'application/pdf', disposition:'attachment' }];
        await sendEmail({ to: `${highest.bidderId}@example.com`, subject: 'Bid accepted', text: `Your bid for ${a.itemName} is accepted. Amount: ₹${highest.amount}.`, attachments: att });
        await sendEmail({ to: `${a.sellerId}@example.com`, subject: 'You accepted a bid', text: `You accepted a bid of ₹${highest.amount} for ${a.itemName}.`, attachments: att });
      }catch(e){
        console.error('[email:on-seller-accept]', e.message);
      }

      return res.json({ ok: true });
    }
    
    if(action === 'reject'){
      a.status = 'closed';
      await a.save();
      io.to(`user:${highest.bidderId}`).emit('notify', { type:'rejected', auctionId });
      return res.json({ ok: true });
    }

    if(action === 'counter'){
      if(!(amount > 0)) return res.status(400).json({error:'Amount required'});
      // persist the counter
      await redis.set(`auction:${auctionId}:counter`, JSON.stringify({
        amount,
        sellerId: a.sellerId,
        bidderId: highest.bidderId
      }));
      // notify top bidder
      io.to(`user:${highest.bidderId}`).emit('notify', { type:'counter', auctionId, payload:{ amount } });
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
      // close auction at the counter amount
      a.status = 'closed';
      await a.save();
      await redis.del(`auction:${auctionId}:counter`);

      // socket notifs
      io.to(`user:${counter.sellerId}`).emit('notify', { type:'counter_accepted', auctionId, payload:{ amount: counter.amount } });
      io.to(`user:${bidderId}`).emit('notify', { type:'accepted', auctionId, payload:{ amount: counter.amount } });

      // email + invoice (BUYER ACCEPTED COUNTER) ⭐
      try{
        const invoice = await buildInvoice({
          buyerEmail: `${bidderId}@example.com`,
          sellerEmail: `${counter.sellerId}@example.com`,
          itemName: a.itemName,
          amount: counter.amount,
          invoiceNo: randomUUID()
        });
        const att = [{ content: invoice.toString('base64'), filename: 'invoice.pdf', type: 'application/pdf', disposition:'attachment' }];

        await sendEmail({
          to: `${bidderId}@example.com`,
          subject: `Counter accepted for ${a.itemName}`,
          text: `You accepted the seller's counter of ₹${counter.amount} for ${a.itemName}.`,
          attachments: att
        });
        await sendEmail({
          to: `${counter.sellerId}@example.com`,
          subject: `Buyer accepted your counter for ${a.itemName}`,
          text: `Your counter of ₹${counter.amount} for ${a.itemName} was accepted by ${bidderId}.`,
          attachments: att
        });
      }catch(e){
        console.error('[email:on-counter-accept]', e.message);
      }

      return res.json({ ok: true });
    }

    if(action === 'reject'){
      await redis.del(`auction:${auctionId}:counter`);
      io.to(`user:${counter.sellerId}`).emit('notify', { type:'counter_rejected', auctionId });
      io.to(`user:${bidderId}`).emit('notify', { type:'rejected', auctionId });
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
