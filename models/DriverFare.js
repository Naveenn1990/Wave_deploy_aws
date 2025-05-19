const mongoose = require('mongoose');

const DriverFare = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
    },
    shift: {
        type: String,
        trim: true,
    },
    baseFare: {
        type: Number,
        required: [true, 'Base fare is required'],
        min: 0,
    },
    perKmRate: {
        type: Number,
        required: [true, 'Per km rate is required'],
        min: 0,
    },
    perMinuteRate: {
        type: Number,
        default: 0,
        min: 0,
    },

    surgeMultiplier: {
        type: Number,
        default: 1,
        min: 1,
    },
    nightSurcharge: {
    type: Number,
    default: 1.2, // e.g., 1.2x multiplier for night hours
    min: 1,
  },
});

module.exports = mongoose.model('Driverfare', DriverFare);