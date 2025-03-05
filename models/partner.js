const mongoose = require("mongoose");

// Partner Model
const partnerSchema = new mongoose.Schema(
  {
    bookings: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
    }],

    kyc : {
      panCard : String,
      aadhaar : String,
      chequeImage : String,
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
      },
      remarks: String // For admin to provide feedback if rejected
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
      address: {
        type: String,
        required: function () {
          return this.profileCompleted;
        }
      },
      landmark: {
        type: String,
        required: function () {
          return this.profileCompleted;
        }
      },
      pincode: {
        type: String,
        required: function () {
          return this.profileCompleted;
        }
      },
    },
    profilePicture: String,

    // Add OTP fields
    tempOTP: {
      type: String,
      select: false, // Ensure it is only retrieved when explicitly selected
    },
    otpExpiry: {
      type: Date,
      select: false, // Ensures it is fetched only when explicitly requested
    },

    // Partner Cart - Stores selected products before approval
    cart: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        quantity: {
          type: Number,
          required: true,
          default: 1,
        },
        approved: {
          type: Boolean,
          default: false,
        },
      },
    ],
  },
  { timestamps: true }
);

const PartnerModel = mongoose.model("Partner", partnerSchema);
module.exports = PartnerModel;
