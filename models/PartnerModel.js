const mongoose = require("mongoose");

// Partner Model
const partnerSchema = new mongoose.Schema(
  {
    bookings: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Booking",
      },
    ],
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    subService: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubService",
    },

    kyc: {
      panCard: String,
      aadhaar: String,
      chequeImage: String,
      drivingLicence: String,
      bill: String,
      status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
      },
      remarks: String,
    },
    bankDetails: {
      accountNumber: String,
      ifscCode: String,
      accountHolderName: String,
      bankName: String,
      chequeImage: String,
    },
    category: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ServiceCategory",
        required: function () {
          return this.profileCompleted;
        },
      },
    ],
    subcategory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubCategory",
        required: function () {
          return this.profileCompleted;
        },
      },
    ],
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
      default: "offline",
    },
    profileCompleted: {
      type: Boolean,
      default: false,
    },
    profileStatus: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
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
        },
      },
      landmark: {
        type: String,
        required: function () {
          return this.profileCompleted;
        },
      },
      pincode: {
        type: String,
        required: function () {
          return this.profileCompleted;
        },
      },
      registerAmount:{
        type: Number,
        default:0
      },
      payId:{
        type:String
      },
      paidBy:{
        type:String,
        default:"Self"
      },
      registerdFee:{
        type:Boolean,
        default:false  
      },
      city: {
        type: String,
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
    fcmtoken: {
      type: String,
    },
    agentName: {
      type: String,
    },
    latitude: {
      type: Number
    },
    longitude: {
      type: Number
    },
    currentLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },

    },
    drive: {
      type: Boolean,
      default: false,
    },
    tempoTraveller: {
      type: Boolean,
      default: false,
    },
    // Add Reviews Field
    reviews: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
        rating: { type: Number, required: true },
        comment: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const Partner = mongoose.model("Partner", partnerSchema);
module.exports = Partner;
