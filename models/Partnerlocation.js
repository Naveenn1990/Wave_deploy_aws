const mongoose = require("mongoose");

const partnerLocationSchema = new mongoose.Schema({
  partner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Partner",
    required: true,
  },
  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: [Number], // [longitude, latitude]
  },
  status: {
    type: String,
    enum: ["online", "offline", "busy"],
    default: "offline",
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

// Create 2dsphere index for geospatial queries
partnerLocationSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("PartnerLocation", partnerLocationSchema);
