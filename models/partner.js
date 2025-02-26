const mongoose = require("mongoose");

const partnerSchema = new mongoose.Schema(
  {
    kyc : {
      panCard : String,
      aadhaar : String,
      chequeImage : String,
    },
    bankDetails : {
      accountNumber : String,
      ifscCode : String,
      accountHolderName : String,
      bankName : String,
      chequeImage : String,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceCategory",
      required: function () {
        return this.profileCompleted;
      },
    },
    subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubCategory",
      required: function () {
        return this.profileCompleted;
      },
    },
    service: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
        required: function () {
          return this.profileCompleted;
        },
      },
    ],
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    whatsappNumber: String,
    qualification: String,
    experience: String,
    modeOfService: {
      type: String,
      enum: ["online", "offline", "both"],
      required: function () {
        return this.profileCompleted;
      },
    },
    profileCompleted: {
      type: Boolean,
      default: false,
    },
    profile: {
      name: {
        type: String,
        required: function () {
          return this.profileCompleted;
        },
        trim: true,
      },
      email: {
        type: String,
        required: function () {
          return this.profileCompleted;
        },
        trim: true,
        lowercase: true,
      },
    },
    profilePicture: String,

    // ✅ Add OTP fields
    tempOTP: {
      type: String,
      select: false, // Ensure it is only retrieved when explicitly selected
    },
    otpExpiry: {
      type: Date,
      select: false, // Ensures it is fetched only when explicitly requested
    },
  },
  { timestamps: true }
);

const PartnerModel = mongoose.model("Partner", partnerSchema);
module.exports = PartnerModel;
