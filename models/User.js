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
    landmark: { type: String, trim: true },
    addressType: { type: String, trim: true }
  }],
  tempOTP: String,
  tempOTPExpiry: Date,
  isVerified: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'blocked'],
    default: 'active'
  },
  // ✅ Corrected Reviews Field
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

// ✅ Correct Model Definition to Prevent Duplication
module.exports = mongoose.models.User || mongoose.model("User", userSchema);
