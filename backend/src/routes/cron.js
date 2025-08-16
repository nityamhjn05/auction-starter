// backend/src/routes/cron.js
import { Router } from 'express';


export default function makeCronRoutes(io){
  const r = Router();
  // manual tick endpoint (useful in dev)
  r.get('/tick', async (_req, res) => {
    try {
      await cronTick(io);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });
  return r;
}

