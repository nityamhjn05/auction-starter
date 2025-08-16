import sg from '@sendgrid/mail';

const API_KEY = process.env.SENDGRID_API_KEY || '';
const FROM = process.env.EMAIL_FROM || 'Auction <no-reply@example.com>';

const enabled = API_KEY && API_KEY.startsWith('SG.');
if (enabled) {
  sg.setApiKey(API_KEY);
  console.log('[email] SendGrid enabled, from:', FROM);
} else {
  console.log('[email] DRY-RUN (no real emails). Set SENDGRID_API_KEY starting with "SG." to enable.');
  console.log('[email] FROM:', FROM);
}

export async function sendEmail({ to, subject, text, attachments }) {
  if (!enabled) {
    console.log('[email:dry-run]', { to, subject, text, attachments: attachments?.map(a => a.filename) });
    return;
  }
  try {
    const msg = { from: FROM, to, subject, text, attachments };
    await sg.send(msg);
    console.log('[email:sent]', { to, subject, attachments: attachments?.map(a => a.filename) });
  } catch (err) {
    // Surface the SendGrid error details
    const body = err?.response?.body;
    console.error('[email:error]', err?.message || err, body || '');
    throw err;
  }
}
