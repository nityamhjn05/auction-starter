import { Router } from 'express';
import { Notification } from '../models/index.js';

const r = Router();

r.get('/', async (req, res) => {
  const userId = req.query.userId || 'buyer-1';
  const rows = await Notification.findAll({ where: { userId }, order: [['createdAt','DESC']] });
  res.json(rows.map(x=>({ id: x.id, type: x.type, payload: x.payload })));
});

export default r;
