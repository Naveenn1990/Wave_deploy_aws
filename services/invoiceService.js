const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generateInvoice = async (booking, user) => {
  const doc = new PDFDocument();
  const invoicePath = path.join(__dirname, '../invoices', `${booking.bookingId}.pdf`);
  const writeStream = fs.createWriteStream(invoicePath);
  doc.pipe(writeStream);

  // Add invoice header
  doc.fontSize(20).text('Invoice', { align: 'center' });
  doc.moveDown();
  
  // Booking details
  doc.fontSize(14).text(`Booking ID: ${booking.bookingId}`);
  doc.text(`Date: ${new Date().toLocaleDateString()}`);
  doc.moveDown();
  
  // Customer info
  doc.fontSize(12).text('Customer Information:', { underline: true });
  doc.text(`Name: ${user.name}`);
  doc.text(`Email: ${user.email}`);
  doc.text(`Phone: ${user.phone}`);
  doc.moveDown();
  
  // Booking details
  doc.text('Booking Details:', { underline: true });
  doc.text(`Pickup: ${booking.pickupLocation.address}`);
  if (booking.dropoffLocation) {
    doc.text(`Dropoff: ${booking.dropoffLocation.address}`);
  }
  doc.text(`Date: ${new Date(booking.bookingDetails.date).toLocaleDateString()}`);
  doc.text(`Time: ${booking.bookingDetails.time}`);
  doc.text(`Passengers: ${booking.bookingDetails.passengers}`);
  doc.moveDown();
  
  // Price breakdown
  doc.text('Price Breakdown:', { underline: true });
  doc.text(`Base Fare: ₹${booking.price.breakdown.baseFare.toFixed(2)}`);
  doc.text(`Distance (${booking.distance} km): ₹${booking.price.breakdown.distanceCost.toFixed(2)}`);
  doc.text(`Time (${booking.estimatedTime} min): ₹${booking.price.breakdown.timeCost.toFixed(2)}`);
  if (booking.isNightBooking) {
    doc.text(`Night Surcharge: ₹${booking.price.breakdown.nightSurchargeCost.toFixed(2)}`);
  }
  doc.text(`Tax (5%): ₹${booking.price.breakdown.tax.toFixed(2)}`);
  doc.moveDown();
  doc.fontSize(14).text(`Total: ₹${booking.price.total.toFixed(2)}`, { align: 'right' });
  
  doc.end();

  return new Promise((resolve, reject) => {
    writeStream.on('finish', () => {
      resolve({
        path: invoicePath,
        url: `/invoices/${booking.bookingId}.pdf`
      });
    });
    writeStream.on('error', reject);
  });
};

module.exports = { generateInvoice };