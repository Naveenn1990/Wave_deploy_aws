const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  profilePicture: {
    type: String,
  },
  name: {
    type: String,
    trim: true,
    required: false
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    required: false
  },
  password: {
    type: String,
    minlength: 6
  },
  addresses: [{
    address: { type: String, trim: true },
    lat: { type: String },
    lng: { type: String },
    landmark: { type: String, trim: true },
    addressType: { type: String, trim: true }
  }],
  tempOTP: String,
  tempOTPExpiry: Date,
  isVerified: {
    type: Boolean,
    default: false
  },
  isProfileComplete: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'blocked'],
    default: 'active'
  },
  // notifications:[],
  fcmToken: {type: String},
  // notifications: [{
  //   message: { type: String, required: true },
  //   booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  //   seen: { type: Boolean, default: false },
  //   date: { type: Date, default: Date.now }
  // }],
  reviews: [
    {
      partner: { type: mongoose.Schema.Types.ObjectId, ref: "Partner" },
      booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
      rating: { type: Number, required: true },
      comment: { type: String, required: true },
      createdAt: { type: Date, default: Date.now }
    }
  ]
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre("save", async function (next) {
  try {
    if (this.isModified("password")) {
      this.password = await bcrypt.hash(this.password, 10);
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
