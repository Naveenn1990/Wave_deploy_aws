const mongoose = require("mongoose");

const partnerProfileSchema = new mongoose.Schema({
  partner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Partner",
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  contactNumber: {
    type: String,
    trim: true,
  },
  whatsappNumber: {
    type: String,
    trim: true,
  },
  qualification: {
    type: String,
    required: true,
  },
  experience: {
    type: Number, // in years
    required: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceCategory',
    required: true
  },
  subcategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubCategory',
    required: true
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  modeOfService: {
    type: String,
    required: true,
    enum: ["online", "offline", "both"],
    default: "both",
  },
  profilePicture: String,
  isVerified: {
    type: String,
    enum: ["pending", "verified", "rejected"],
    default: "pending"
  },
  // KYC Details
  kyc: {
    panCard: String,
    aadhaar: String
  },
  // Bank Details
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    accountHolderName: String,
    bankName: String,
    chequeImage: String
  },
  // Service Categories
  serviceCategories: [{
    mainCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceCategory",
      required: true
    },
    subCategories: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceCategory"
    }]
  }],
  verificationStatus: {
    type: String,
    enum: ["pending", "Approved", "Rejected"],
    default: "pending"
  },
  status: {
    type: String,
    enum: ["pending", "Approved", "Rejected"],
    default: "inactive"
  },
  dutyStatus: {
    type: String,
    enum: ["on", "off"],
    default: "off"
  }
}, {
  timestamps: true
});

const PartnerProfile = mongoose.model("PartnerProfile", partnerProfileSchema);

module.exports = PartnerProfile;
