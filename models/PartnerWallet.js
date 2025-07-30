const mongoose = require('mongoose');

// Transaction Schema
const transactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["credit", "debit"],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  description: String,
  reference: String,
  balance: {
    type: Number,
    required: true,
  },
  transactionId: {
    type: String,
    unique: true
  }
}, { timestamps: true });

// Partner Wallet Schema
const partnerWalletSchema = new mongoose.Schema({
  partner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Partner",
    required: true,
  },
  walletId: {
    type: String,
    unique: true
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
  walletSeq: { type: Number, default: 0 },
  transactionSeq: { type: Number, default: 0 }
}, { timestamps: true });

// Generate a unique transaction ID
async function generateUniqueTransactionId() {
  let attempt = 0;
  while (attempt < 10) {
    const randomId = `WPWT${Math.floor(1000 + Math.random() * 9000)}`; // WPWT1000 to WPWT9999

    const exists = await mongoose.model('PartnerWallet').findOne({
      'transactions.transactionId': randomId
    });

    if (!exists) return randomId;

    attempt++;
  }
  throw new Error("Failed to generate unique transactionId after multiple attempts");
}

// Pre-save hook for wallet ID generation
partnerWalletSchema.pre('save', async function (next) {
  const wallet = this;

  if (!wallet.isNew) return next();

  try {
    const lastWallet = await mongoose.model('PartnerWallet')
      .findOne({}, {}, { sort: { 'createdAt': -1 } })
      .select('walletId')
      .lean();

    const lastSeq = lastWallet?.walletId
      ? parseInt(lastWallet.walletId.replace('WPW', ''))
      : 0;

    wallet.walletId = `WPW${(lastSeq + 1).toString().padStart(4, '0')}`;
    next();
  } catch (err) {
    next(err);
  }
});

// Pre-save hook for generating unique transaction IDs
partnerWalletSchema.pre('save', async function (next) {
  const wallet = this;

  if (!wallet.isModified('transactions')) return next();

  try {
    for (let txn of wallet.transactions) {
      if (!txn.transactionId) {
        txn.transactionId = await generateUniqueTransactionId();
      }
    }

    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("PartnerWallet", partnerWalletSchema);
