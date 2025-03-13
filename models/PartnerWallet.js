const mongoose = require('mongoose');

// Define the Transaction Schema
const transactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["credit", "debit"], // Ensure enum values are in lowercase
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    description: String,
    reference: {
      type: String,
      required: true,
    },
    balance: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);
 
const partnerWalletSchema = new mongoose.Schema(
  {
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Partner",
      required: true,
    },
    balance: {
      type: Number,
      default: 0,
    },
    transactions: [transactionSchema],
    status: {
      type: String,
      enum: ["active", "blocked"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

// Methods for wallet operations
partnerWalletSchema.methods.credit = async function (amount, description, reference) {
  this.balance += amount;
  this.transactions.push({
    type: "credit",
    amount,
    description,
    reference,
    balance: this.balance,
  });
  await this.save();
  return this;
};

partnerWalletSchema.methods.debit = async function (amount, description, reference) {
  if (this.balance < amount) {
    throw new Error("Insufficient balance");
  }
  this.balance -= amount;
  this.transactions.push({
    type: "debit",
    amount,
    description,
    reference,
    balance: this.balance,
  });
  await this.save();
  return this;
};

module.exports = mongoose.model("PartnerWallet", partnerWalletSchema);
