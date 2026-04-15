const mongoose = require('mongoose');

const commissionGuidelineSchema = new mongoose.Schema({
  serviceCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceCategory',
    required: true
  },
  baseCommission: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  bonusCommission: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  bonusThreshold: {
    bookings: {
      type: Number,
      default: 50
    },
    rating: {
      type: Number,
      default: 4.5
    }
  },
  effectiveFrom: {
    type: Date,
    required: true
  },
  effectiveTo: {
    type: Date
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, { timestamps: true });

module.exports = mongoose.model('CommissionGuideline', commissionGuidelineSchema);
