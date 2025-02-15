const mongoose = require("mongoose");

const partnerServiceSchema = new mongoose.Schema(
  {
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Partner",
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceCategory",
      required: true,
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    experience: {
      type: String,
      required: true,
    },
    certificates: [
      {
        type: String, // URLs of certificates
      },
    ],
    availability: {
      days: [
        {
          type: String,
          enum: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ],
        },
      ],
      timeSlots: [
        {
          start: String, // HH:mm format
          end: String, // HH:mm format
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("PartnerService", partnerServiceSchema);
