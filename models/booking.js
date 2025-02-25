const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true,
  },
  landmark: {
    type: String,
    default: ""
  },
  pincode: {
    type: String,
    required: true,
  }
}, { _id: false }); // Prevent MongoDB from creating _id for subdocument

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subService: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubService",
      required: true,
    },
    scheduledDate: {
      type: Date,
      required: true,
    },
    scheduledTime: {
      type: String,
      required: true,
    },
    location: {
      type: locationSchema,
      required: true
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentMode: {
      type: String,
      enum: ['credit card', 'cash', 'paypal', 'bank transfer'], 
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "in_progress", "completed", "cancelled", "accepted"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    cancellationReason: String,
    cancellationTime: Date,
    review: {
      rating: {
        type: Number, 
        min: 1,
        max: 5
      },
      comment: String,
      createdAt: Date
    },
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Partner', // Reference to the Partner model
      required: false
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Remove any existing indexes
bookingSchema.on('index', function(err) {
  if (err) {
    console.error('Booking index error: %s', err);
  } else {
    console.info('Booking indexing complete');
  }
});

// Only create basic indexes, no geospatial indexes
bookingSchema.index({ user: 1, status: 1 });
bookingSchema.index({ subService: 1 });
bookingSchema.index({ scheduledDate: 1 });
bookingSchema.index({ status: 1 });

// Check if model already exists before defining
const Booking = mongoose.models.Booking || mongoose.model("Booking", bookingSchema);

module.exports = Booking;
