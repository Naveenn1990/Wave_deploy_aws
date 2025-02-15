const mongoose = require("mongoose");

const bankAccountSchema = new mongoose.Schema({
  accountNumber: {
    type: String,
    required: true
  },
  ifscCode: {
    type: String,
    required: true,
    uppercase: true
  },
  accountName: {
    type: String,
    required: true
  },
  bankName: {
    type: String,
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

const partnerSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["pending", "under_review", "approved", "rejected", "blocked"],
      default: "pending",
    },
    kycStatus: {
      type: String,
      enum: ["pending", "under_review", "verified", "rejected"],
      default: "pending",
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    tempOTP: String,
    otpExpiry: Date,
    profileCompleted: {
      type: Boolean,
      default: false,
    },
    profile: {
      name: {
        type: String,
        trim: true,
      },
      email: {
        type: String,
        trim: true,
        lowercase: true,
      },
      whatsappNumber: {
        type: String,
        trim: true,
      },
      highestQualification: {
        type: String,
        trim: true,
      },
      experience: {
        type: String,
        trim: true,
      },
      profilePicture: String,
    },
    kycDetails: {
      panCard: String,
      aadhaarCard: String,
      cancelledCheque: String,
      bankDetails: {
        accountNumber: String,
        ifscCode: String,
        accountHolderName: String,
      },
      isVerified: {
        type: Boolean,
        default: false,
      },
      submittedAt: Date,
    },
    bankAccounts: [bankAccountSchema],
    walletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PartnerWallet"
    },
    lastWithdrawal: {
      amount: Number,
      date: Date,
      status: {
        type: String,
        enum: ["pending", "processing", "completed", "failed"],
      }
    },
    withdrawalSettings: {
      minAmount: {
        type: Number,
        default: 100
      },
      autoWithdrawal: {
        type: Boolean,
        default: false
      },
      autoWithdrawalThreshold: {
        type: Number,
        default: 1000
      }
    }
  },
  {
    timestamps: true,
  }
);

// Create wallet for new partner
partnerSchema.post("save", async function (doc) {
  if (!doc.walletId) {
    const PartnerWallet = mongoose.model("PartnerWallet");
    const wallet = new PartnerWallet({
      partner: doc._id,
      balance: 0
    });
    await wallet.save();
    doc.walletId = wallet._id;
    await doc.save();
  }
});

module.exports = mongoose.models.Partner || mongoose.model("Partner", partnerSchema);
