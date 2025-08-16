import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export async function makeInvoicePdf({ auction, highest }) {
  const out = path.join(process.cwd(), `invoice-${auction.id}.pdf`);
  const doc = new PDFDocument();
  const stream = fs.createWriteStream(out);
  doc.pipe(stream);
  doc.fontSize(20).text('Auction Invoice', { align: 'center' }).moveDown();
  doc.fontSize(12).text(`Item: ${auction.name}`);
  doc.text(`Seller: ${auction.sellerEmail}`);
  doc.text(`Buyer: ${highest.bidderEmail}`);
  doc.text(`Amount: ₹${highest.amount}`);
  doc.end();
  await new Promise(res => stream.on('finish', res));
  return out;
}
