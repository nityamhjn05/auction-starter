// backend/src/routes/index.js

import { Router } from 'express';
import makeAuctions from './auctions.js';
import makeBids from './bids.js';
import makeDecisions from './decisions.js';
import notifications from './notifications.js';
import makeCron from './cron.js';    
import debug from './debug.js';

import makeManualEnd from './end.js';   // manual “End Now” endpoint

export default function buildRoutes(io){
  const r = Router();
  r.use('/auctions', makeAuctions(io));
  r.use('/auctions', makeBids(io));
  r.use('/auctions', makeDecisions(io));
  r.use('/auctions', makeManualEnd(io));  // POST /api/auctions/:id/end-now
  r.use('/notifications', notifications);
  r.use('/cron', makeCron(io));
  r.use('/debug', debug);

  return r;
}
