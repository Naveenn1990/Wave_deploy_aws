const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Partner',
    required: true
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  tokenNumber: {
    type: String,
    required: true,
    unique: true
  },
  userId:{
     type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  issue: {
    type: String,
    required: true
  },
  feedback:{
    type:String
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'resolved', 'closed'],
    default: 'pending'
  },
  proof:{
    type:String
  },
  resolution: {
    type: String
  },
  resolvedAt: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('Token', tokenSchema);
