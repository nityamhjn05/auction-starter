import sgMail from '@sendgrid/mail';
import fs from 'fs';

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export async function sendDealEmail({ auction, highest, invoicePath }) {
  if (!process.env.SENDGRID_API_KEY) {
    console.log('SENDGRID_API_KEY not set; skipping email send.');
    return;
  }
  const subject = `Auction closed: ${auction.name}`;
  const text = `Winning bid: ₹${highest.amount} by ${highest.bidderEmail}`;
  const attachments = invoicePath ? [{
    content: fs.readFileSync(invoicePath).toString('base64'),
    filename: 'invoice.pdf',
    type: 'application/pdf',
    disposition: 'attachment'
  }] : [];
  const to = [highest.bidderEmail, auction.sellerEmail];
  await sgMail.sendMultiple({ to, from: 'no-reply@example.com', subject, text, attachments });
}
