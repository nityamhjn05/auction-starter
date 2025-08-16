import PDFDocument from 'pdfkit';

export function buildInvoice({ buyerEmail, sellerEmail, itemName, amount, invoiceNo }) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const chunks = [];
  doc.on('data', c => chunks.push(c));

  return new Promise((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    doc.fontSize(20).text('Auction Invoice', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Invoice #: ${invoiceNo}`);
    doc.text(`Buyer: ${buyerEmail}`);
    doc.text(`Seller: ${sellerEmail}`);
    doc.text(`Item: ${itemName}`);
    doc.text(`Amount Paid: ₹${amount}`);
    doc.end();
  });
}
