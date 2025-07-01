const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema({
  address: { type: String, required: true },
  landmark: { type: String, default: "" },
  pincode: { type: String },
}, { _id: false });

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
      required: true
    },
    service: { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
    subCategory: { type: mongoose.Schema.Types.ObjectId, ref: "SubCategory" },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "ServiceCategory" },
    scheduledDate: { type: Date, required: true },
    scheduledTime: { type: String, required: true },
    location: { type: locationSchema, required: true },
    amount: { type: Number, required: true },
    payamount: { type: Number,default: 0 },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    paymentMode: {
      type: String,
      enum: ["credit card", "cash", "paypal", "bank transfer","phonepe", "upi",'online'],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "in_progress", "completed", "cancelled", "accepted", "rejected", "paused"],
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
      rating: { type: Number, min: 1, max: 5 },
      comment: String,
      createdAt: Date,
    },
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Partner", // Assigned when the partner accepts the booking
    },

    acceptedAt: Date,
    completedAt: Date,
    otp:{
      type: String,
    },
    pauseDetails: {
      nextScheduledDate: Date,
      nextScheduledTime: String,
      pauseReason: String,
      pausedAt: Date,
    },
    photos: [{ type: String }],
    videos: [{ type: String }],

    // **New Field: Partner Cart (Stores selected products before approval)**
    cart: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        quantity: {
          type: Number,
          required: true,
          default: 1,
        },
        approved: {
          type: Boolean,
          default: false, // User approval required
        },
        addedByPartner: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Partner",
        }
      }
    ],
    chat:[],
    lat: { type: String },
    lng: { type: String },
    rideStart: { type: Boolean, default: false },
    currentBooking: { type: Boolean, default: false },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Remove any existing indexes
bookingSchema.on("index", function(err) {
  if (err) {
    console.error("Booking index error: %s", err);
  } else {
    console.info("Booking indexing complete");
  }
});

// Indexes for performance optimization
bookingSchema.index({ user: 1, status: 1 });
bookingSchema.index({ subService: 1 });
bookingSchema.index({ scheduledDate: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ partner: 1 }); // Index added to efficiently fetch partner's bookings

// Check if model already exists before defining
const Booking = mongoose.models.Booking || mongoose.model("Booking", bookingSchema);

module.exports = Booking;
