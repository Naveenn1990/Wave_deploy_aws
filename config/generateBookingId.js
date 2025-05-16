const Counter = require('../models/Counter');

const generateBookingId = async () => {
  try {
    const counter = await Counter.findOneAndUpdate(
      { _id: 'booking' },
      { $inc: { sequence: 1 } },
      { upsert: true, new: true }
    );
    const sequence = counter.sequence;
    const paddedSequence = sequence.toString().padStart(3, '0'); // e.g., '001'
    return `WAVED${paddedSequence}`; // e.g., 'WAVED001'
  } catch (error) {
    throw new Error('Failed to generate booking ID');
  }
};

module.exports = generateBookingId;