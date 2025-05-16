const mongoose = require('mongoose');

const DriverBooking = new mongoose.Schema({
  bookingId: {
    type: String,
    unique: true,
    required: [true, 'Booking ID is required'],
    match: [/^WAVED\d+$/, 'Booking ID must follow WAVED format'],
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  vehicleType: { type: mongoose.Schema.Types.ObjectId, ref: 'VehicleType', required: true },
  pickupLocation: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true },
  },
  dropoffLocation: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true },
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'],
    default: 'pending',
  },
  price: {
    total: { type: Number, default: 0, min: 0 },
    breakdown: {
      baseFare: { type: Number, default: 0 },
      distanceCost: { type: Number, default: 0 },
      timeCost: { type: Number, default: 0 },
      surgeCost: { type: Number, default: 0 },
      nightSurchargeCost: { type: Number, default: 0 },
      tax: { type: Number, default: 0 },
    },
  },
  distance: { type: Number, default: 0, min: 0 },
  estimatedTime: { type: Number, default: 0, min: 0 },
  isNightBooking: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

DriverBooking.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('DriverBooking', DriverBooking);