const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendBookingConfirmation = async (user, booking, invoice) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject: 'Your Tempo Traveller Booking Confirmation',
    html: `
      <h1>Booking Confirmation #${booking.bookingId}</h1>
      <p>Thank you for booking with us!</p>
      <h2>Booking Details</h2>
      <p><strong>Pickup:</strong> ${booking.pickupLocation.address}</p>
      ${booking.dropoffLocation ? `<p><strong>Dropoff:</strong> ${booking.dropoffLocation.address}</p>` : ''}
      <p><strong>Date & Time:</strong> ${new Date(booking.bookingDetails.date).toLocaleDateString()} at ${booking.bookingDetails.time}</p>
      <p><strong>Vehicle:</strong> Tempo Traveller</p>
      <p><strong>Passengers:</strong> ${booking.bookingDetails.passengers}</p>
      <p><strong>Total Amount:</strong> ₹${booking.price.total.toFixed(2)}</p>
      <p>Download your invoice: <a href="${invoice.url}">Invoice PDF</a></p>
    `
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendBookingConfirmation };