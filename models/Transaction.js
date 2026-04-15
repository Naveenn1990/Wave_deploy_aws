const mongoose = require("mongoose");


const transactionSchema = new mongoose.Schema(
  {
    wallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PartnerWallet",
      required: true,
    },
    type: {
      type: String,
      enum: ["credit", "debit"], // Credit for top-up, Debit for spending
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    description: String,
    reference: {
      type: String, // Could be an order ID, payment ID, etc.
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      required: true,
      default: "success",
    },
    paymentMethod: String, // Optional (e.g., "Stripe", "Razorpay")
  },
  { timestamps: true }
);

const Transaction = mongoose.model("Transaction", transactionSchema);
