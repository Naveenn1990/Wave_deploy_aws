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
  // Internal counters
  walletSeq: { type: Number, default: 0 },
  transactionSeq: { type: Number, default: 0 }
}, { timestamps: true });

// Pre-save hook for wallet ID generation
partnerWalletSchema.pre('save', async function(next) {
  const wallet = this;
  
  if (!wallet.isNew) return next();

  try {
    // Find the last wallet to get sequence
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

// Pre-save hook for transaction ID generation
partnerWalletSchema.pre('save', async function(next) {
  const wallet = this;
  
  if (!wallet.isModified('transactions')) return next();

  try {
    // Get existing max transaction ID across all wallets
    const lastTransaction = await mongoose.model('PartnerWallet').aggregate([
      { $unwind: "$transactions" },
      { $sort: { "transactions.createdAt": -1 } },
      { $limit: 1 },
      { $project: { lastId: "$transactions.transactionId" } }
    ]);

    const lastSeq = lastTransaction[0]?.lastId 
      ? parseInt(lastTransaction[0].lastId.replace('WPWT', ''))
      : 0;

    // Generate IDs for new transactions
    wallet.transactions
      .filter(t => !t.transactionId)
      .forEach((t, index) => {
        t.transactionId = `WPWT${(lastSeq + index + 1).toString().padStart(4, '0')}`;
      });

    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("PartnerWallet", partnerWalletSchema);