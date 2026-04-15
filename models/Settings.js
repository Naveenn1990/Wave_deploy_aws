const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  platformFee: {
    type: Number,
    required: true,
    default: 10 // Default platform fee percentage
  },
  taxRate: {
    type: Number,
    required: true,
    default: 18 // Default GST percentage
  },
  minimumOrderValue: {
    type: Number,
    required: true,
    default: 100
  },
  maximumRadius: {
    type: Number,
    required: true,
    default: 10 // Default radius in kilometers
  },
  supportEmail: {
    type: String,
    required: true,
    default: 'support@wave.com'
  },
  supportPhone: {
    type: String,
    required: true,
    default: '+91-XXXXXXXXXX'
  },
  workingHours: {
    start: {
      type: String,
      default: '09:00'
    },
    end: {
      type: String,
      default: '21:00'
    }
  },
  maintenanceMode: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
