const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { sendOTP } = require("../utils/sendOTP");
const path = require("path");
const Booking = require("../models/booking"); // Ensure the correct model is imported
const SubService = require("../models/SubService");

// Register new user
// Register new user
exports.register = async (req, res) => {
  try {
    const { name, email, phone, password, confirmPassword } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email, phone, password, and confirm password are required",
      });
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    // Find the user by phone number
    let user = await User.findOne({ phone });

    // If user exists but is not verified, prevent registration
    if (user && !user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Phone number is not verified",
      });
    }

    if (user) {
      user.name = name;
      user.email = email;
      user.password = password;
      
      // Mark profile as complete since required fields are provided
      user.isProfileComplete = true;

      await user.save();
    } else {
      user = new User({
        name,
        email,
        phone,
        password,
        isVerified: true,
        isProfileComplete: true, // Set to true on successful profile completion
      });

      await user.save();
    }

    // Generate token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({
      success: true,
      message: "Registration successful",
      user: {
        userId: user._id,
        token,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isVerified: user.isVerified,
        isProfileComplete: user.isProfileComplete,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Error during registration",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};


// Login with password
exports.loginWithPassword = async (req, res) => {
  try {
    console.log("Request Body:", req.body);
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find user
    const user = await User.findOne({ email }).select("+password"); // Ensure password is selected
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    // Verify password
    if (!user.password) {
      return res
        .status(500)
        .json({ success: false, message: "User does not have a password set" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        token,
        userId: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isVerified: user.isVerified,
        profilePicture: user.profilePicture || "",
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message, // Send actual error message
    });
  }
};

// Send OTP for login
exports.sendLoginOTP = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    // Find user
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No user found with this phone number",
      });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const tempOTPExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    user.tempOTP = otp;
    user.tempOTPExpiry = tempOTPExpiry;
    await user.save();

    console.log(`OTP generated for ${phone}: ${otp}`); // For debugging

    // Send OTP
    await sendOTP(phone, otp);

    res.json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("Send OTP Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send OTP",
    });
  }
};

// Verify OTP and login
exports.verifyLoginOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    console.log(`Verifying OTP for ${phone}: ${otp}`); // Debugging

    const user = await User.findOne({
      phone,
      tempOTP: otp,
      tempOTPExpiry: { $gt: new Date() },
    }).select("+name +email +isVerified"); // Explicitly selecting fields

    if (!user) {
      console.log("User not found or OTP mismatch"); // Debugging
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    // Clear OTP
    user.tempOTP = undefined;
    user.tempOTPExpiry = undefined;

    // Update verification status if not already verified
    if (!user.isVerified) {
      user.isVerified = true;
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();
    console.log("User verified and logged in:", user);

    // Generate token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      success: true,
      user: user,
      // {
      //   token,
      //   _id: user._id,
      //   name: user.name,
      //   email: user.email,
      //   phone: user.phone,
      //   isVerified: user.isVerified,
      // },
    });
  } catch (error) {
    console.error("OTP Verification Error:", error);
    res.status(500).json({
      success: false,
      message: "OTP verification failed",
    });
  }
};

// Send OTP for forgot password
exports.sendForgotPasswordOTP = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    // Find user
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No user found with this phone number",
      });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const tempOTPExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    user.tempOTP = otp;
    user.tempOTPExpiry = tempOTPExpiry;
    await user.save();

    console.log(`Forgot password OTP generated for ${phone}: ${otp}`); // For debugging

    // Send OTP
    await sendOTP(phone, otp);

    res.json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("Send Forgot Password OTP Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send OTP",
    });
  }
};

// Reset password with OTP verification
exports.resetPassword = async (req, res) => {
  try {
    const { phone, otp, newPassword, confirmPassword } = req.body;

    if (!phone || !otp || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    const user = await User.findOne({ phone }).select(
      "+tempOTP +tempOTPExpiry"
    );
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify OTP
    if (!user.tempOTP || user.tempOTP !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // Check OTP expiry
    if (!user.tempOTPExpiry || user.tempOTPExpiry < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired",
      });
    }

    // Update password
    user.password = newPassword;
    user.tempOTP = undefined;
    user.tempOTPExpiry = undefined;
    await user.save();

    res.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reset password",
    });
  }
};

// Get user profile
exports.getProfile = async (req, res, next) => {
  try {
    console.log("Getting profile for user:", req.user._id);

    if (!req.user || !req.user._id) {
      throw new Error("User not authenticated");
    }

    const user = await User.findById(req.user._id)
      .select("-password -tempOTP -tempOTPExpiry")
      .lean();

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    console.log("Found user profile:", {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
    });

    res.json({
      success: true,
      user,
      // : {
      //   name: user.name,
      //   email: user.email,
      //   phone: user.phone,
      //   address: user.address,
      //   landmark: user.landmark,
      //   addressType: user.addressType,
      //   isVerified: user.isVerified,
      //   status: user.status,
      //   createdAt: user.createdAt,
      //   updatedAt: user.updatedAt,
      // },
    });
  } catch (error) {
    console.error("Get Profile Error:", {
      error: error.message,
      stack: error.stack,
      userId: req.user?._id,
    });

    // Pass error to express error handler
    next(error);
  }
};

// Update profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const updates = { name, email };
    console.log("Req BOdy", req.body);
    // Handle profile picture if uploaded
    if (req.file) {
      updates.profilePicture = path.basename(req.file.path);
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true }
    ).select("-password -tempOTP -otpExpiry");

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating profile",
    });
  }
};

// Add address
// exports.addAddress = async (req, res) => {
//   try {
//     const { address, landmark, addressType } = req.body;

//     if (!address) {
//       return res.status(400).json({
//         success: false,
//         message: "Address is required",
//       });
//     }

//     const user = await User.findById(req.user._id);
//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     // Update user's address fields
//     user.address = address;
//     user.landmark = landmark || "";
//     user.addressType = addressType || "home";

//     await user.save();

//     res.json({
//       success: true,
//       address: {
//         address: user.address,
//         landmark: user.landmark,
//         addressType: user.addressType,
//       },
//     });
//   } catch (error) {
//     console.error("Add Address Error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error adding address",
//       details:
//         process.env.NODE_ENV === "development" ? error.message : undefined,
//     });
//   }
// };

// Add address
exports.addAddress = async (req, res) => {
  try {
    const { address, landmark, addressType } = req.body;

    if (!address) {
      return res.status(400).json({
        success: false,
        message: "Address is required",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Add new address to the addresses array
    user.addresses.push({
      address,
      landmark: landmark || "",
      addressType: addressType || "home",
    });

    await user.save();

    res.json({
      success: true,
      message: "Address added successfully",
      addresses: user.addresses, // Return updated addresses array
    });
  } catch (error) {
    console.error("Add Address Error:", error);
    res.status(500).json({
      success: false,
      message: "Error adding address",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Update address
exports.updateAddress = async (req, res) => {
  try {
    const { addressLine1, addressLine2, city, state, postalCode, country } =
      req.body;

    // Construct full address
    const fullAddress = [
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
    ]
      .filter(Boolean)
      .join(", ");

    if (!fullAddress) {
      return res.status(400).json({
        success: false,
        message: "At least one address field is required",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update user's address
    user.address = fullAddress;

    await user.save();

    res.json({
      success: true,
      address: {
        address: user.address,
        landmark: user.landmark,
        addressType: user.addressType,
      },
    });
  } catch (error) {
    console.error("Update Address Error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating address",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Delete address
exports.deleteAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Clear address fields
    user.address = "";
    user.landmark = "";
    user.addressType = "home"; // Reset to default

    await user.save();

    res.json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (error) {
    console.error("Delete Address Error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting address",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get user details by ID
exports.getUserDetails = async (req, res) => {
  try {
    const userId = req.params.userId;

    const user = await User.findById(userId)
      .select("-password -tempOTP -tempOTPExpiry")
      .lean(); // Convert to plain JavaScript object

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Handle the case where old users might have address in the root level
    if (user.address && !user.addresses) {
      user.addresses = [
        {
          address: user.address,
          landmark: user.landmark,
          addressType: user.addressType || "home",
        },
      ];
      // Remove old fields
      delete user.address;
      delete user.landmark;
      delete user.addressType;
    }

    res.json({
      success: true,
      user: {
        // _id: user._id,
        userId: user._id, // Adding userId as requested
        name: user.name || "",
        email: user.email || "",
        phone: user.phone,
        isVerified: user.isVerified,
        // addresses: user.addresses || [],
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("Get User Details Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user details",
    });
  }
};
