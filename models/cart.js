const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [{
      subservice: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubService", 
        required: true,
      },
      quantity: {
        type: Number,
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
        type: {
          type: String,
          default: "Point",
        },
        coordinates: [Number], // [longitude, latitude]
        address: String,
      },
    }],
    totalAmount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for quick user cart lookup
cartSchema.index({ user: 1 });

const Cart = mongoose.model("Cart", cartSchema);

module.exports = Cart;
