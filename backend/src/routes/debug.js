import { Router } from 'express';
import { sendEmail } from '../email.js';

const r = Router();

r.post('/email', async (req, res) => {
  try {
    const to = process.env.TEST_EMAIL || req.body?.to;
    if (!to) return res.status(400).json({ ok:false, error:'Set TEST_EMAIL or pass {to} in body' });
    await sendEmail({
      to,
      subject: 'Auction test email',
      text: 'If you see this, email sending works.',
    });
    res.json({ ok:true });
  } catch (e) {
    res.status(500).json({ ok:false, error: e.message });
  }
});

export default r;
