const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['payment', 'refund'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed'],
    required: true
  },
  paymentId: {
    type: String
  },
  orderId: {
    type: String
  },
  paymentMethod: {
    type: String
  },
  description: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
