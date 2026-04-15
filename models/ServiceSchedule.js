const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  isBooked: {
    type: Boolean,
    default: false
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  }
});

const serviceScheduleSchema = new mongoose.Schema({
  partner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Partner',
    required: true
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  workingHours: {
    start: {
      type: String,
      required: true
    },
    end: {
      type: String,
      required: true
    }
  },
  breakTime: [{
    start: String,
    end: String
  }],
  timeSlots: [timeSlotSchema],
  maxBookingsPerSlot: {
    type: Number,
    default: 1
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  availabilityNotes: String,
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Indexes for better query performance
serviceScheduleSchema.index({ partner: 1, date: 1 });
serviceScheduleSchema.index({ service: 1, date: 1 });

// Method to check slot availability
serviceScheduleSchema.methods.isSlotAvailable = function(startTime, endTime) {
  const requestedStart = new Date(startTime);
  const requestedEnd = new Date(endTime);
  
  return this.timeSlots.every(slot => {
    if (slot.isBooked) return true;
    
    const slotStart = new Date(slot.startTime);
    const slotEnd = new Date(slot.endTime);
    
    return requestedStart >= slotEnd || requestedEnd <= slotStart;
  });
};

// Method to book a time slot
serviceScheduleSchema.methods.bookSlot = async function(startTime, endTime, bookingId) {
  if (!this.isSlotAvailable(startTime, endTime)) {
    throw new Error('Time slot not available');
  }
  
  this.timeSlots.push({
    startTime: new Date(startTime),
    endTime: new Date(endTime),
    isBooked: true,
    bookingId
  });
  
  await this.save();
  return true;
};

// Static method to generate time slots
serviceScheduleSchema.statics.generateTimeSlots = function(start, end, duration) {
  const slots = [];
  let currentTime = new Date(start);
  const endTime = new Date(end);
  
  while (currentTime < endTime) {
    const slotEnd = new Date(currentTime.getTime() + duration * 60000);
    slots.push({
      startTime: new Date(currentTime),
      endTime: slotEnd,
      isBooked: false
    });
    currentTime = slotEnd;
  }
  
  return slots;
};

module.exports = mongoose.model('ServiceSchedule', serviceScheduleSchema);
