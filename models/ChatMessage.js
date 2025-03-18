const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'senderType'
  },
  senderType: {
    type: String,
    required: true,
    enum: ['User', 'Partner']
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'recipientType'
  },
  recipientType: {
    type: String,
    required: true,
    enum: ['User', 'Partner']
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  message: {
    type: String,
    required: true
  },
  attachments: [{
    type: String,
    url: String,
    mimeType: String
  }],
  readAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for better query performance
chatMessageSchema.index({ senderId: 1, recipientId: 1 });
chatMessageSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);