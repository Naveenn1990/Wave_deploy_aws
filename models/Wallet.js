const mongoose = require("mongoose");

const WalletSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
  balance: { type: Number, required: true, default: 0 },
  transactions: [
    {
      transactionId: { type: String, required: true,},
      amount: { type: Number, required: true },
      type: { type: String, enum: ["Credit", "Debit"], required: true },
      date: { type: Date, default: Date.now },
    },
  ],
});

const Wallet = mongoose.model("Wallet", WalletSchema);
module.exports = Wallet;
