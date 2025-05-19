// const mongoose = require('mongoose');

// const DriverBooking = new mongoose.Schema({
//   bookingId: {
//     type: String,
//     unique: true,
//     required: [true, 'Booking ID is required'],
//     match: [/^WAVED\d+$/, 'Booking ID must follow WAVED format'],
//   },
//   userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
//   vehicleType: { type: mongoose.Schema.Types.ObjectId, ref: 'VehicleType', required: true },
//   pickupLocation: {
//     type: { type: String, enum: ['Point'], default: 'Point' },
//     coordinates: { type: [Number], required: true },
//   },
//   dropoffLocation: {
//     type: { type: String, enum: ['Point'], default: 'Point' },
//     coordinates: { type: [Number]},
//   },
//   status: {
//     type: String,
//     enum: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'],
//     default: 'pending',
//   },
//   price: {
//     total: { type: Number, default: 0, min: 0 },
//     breakdown: {
//       baseFare: { type: Number, default: 0 },
//       distanceCost: { type: Number, default: 0 },
//       timeCost: { type: Number, default: 0 },
//       surgeCost: { type: Number, default: 0 },
//       nightSurchargeCost: { type: Number, default: 0 },
//       tax: { type: Number, default: 0 },
//     },
//   },
//   distance: { type: Number, default: 0, min: 0 },
//   estimatedTime: { type: Number, default: 0, min: 0 },
//   isNightBooking: { type: Boolean, default: false },
//   createdAt: { type: Date, default: Date.now },
//   updatedAt: { type: Date, default: Date.now },
// });

// DriverBooking.pre('save', function (next) {
//   this.updatedAt = Date.now();
//   next();
// });

// module.exports = mongoose.model('DriverBooking', DriverBooking);
const mongoose = require('mongoose');

const DriverBooking = new mongoose.Schema({
  bookingId: {
    type: String,
    unique: true, 
    match: [/^WAVED\d+$/, 'Booking ID must follow WAVED format'],
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  vehicleType: { type: mongoose.Schema.Types.ObjectId, ref: 'VehicleType', required: true },
  pickupLocation: {
    address: { type: String, required: true },
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true },
  },
  dropoffLocation: {
    address: { type: String },
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number] },
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'],
    default: 'pending',
  },
  bookingDetails: {
    date: { type: Date, required: true },
    time: { type: String, required: true },
    passengers: { type: Number, default: 1, min: 1, max: 12 },
    luggage: { type: Number, default: 0 },
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
  distance: { type: Number, default: 0, min: 0 }, // in km
  estimatedTime: { type: Number, default: 0, min: 0 }, // in minutes
  isNightBooking: { type: Boolean, default: false },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: String,
  notes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Add 2dsphere index for geospatial queries
DriverBooking.index({ 'pickupLocation.coordinates': '2dsphere' });
DriverBooking.index({ 'dropoffLocation.coordinates': '2dsphere' });

DriverBooking.pre('save', function (next) {
  this.updatedAt = Date.now();
  
  // Generate booking ID if not present
  if (!this.bookingId) {
    this.bookingId = `WAVED${Math.floor(100000 + Math.random() * 900000)}`;
  }
  
  // Check if booking is during night hours (10PM to 6AM)
  const bookingTime = new Date(this.bookingDetails.date);
  const [hours, minutes] = this.bookingDetails.time.split(':').map(Number);
  bookingTime.setHours(hours, minutes);
  
  const bookingHour = bookingTime.getHours();
  this.isNightBooking = bookingHour >= 22 || bookingHour < 6;
  
  next();
});

module.exports = mongoose.model('DriverBooking', DriverBooking);