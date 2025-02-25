const Partner = require("../models/Partner");
const PartnerProfile = require("../models/PartnerProfile");
const PartnerWallet = require("../models/PartnerWallet");
const jwt = require("jsonwebtoken");
const { sendOTP } = require("../utils/sendOTP");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const path = require("path");
const ServiceCategory = require("../models/ServiceCategory"); 
const SubCategory = require("../models/SubCategory"); 
const Service = require("../models/Service");
const mongoose = require('mongoose');
// Send OTP for partner login/registration
exports.sendLoginOTP = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    // Try to find partner by phone
    let partner = await Partner.findOne({ phone });
    if (!partner) {
      // If partner does not exist, create a new partner record.
      partner = new Partner({ phone });
      await partner.save();
      console.log("New partner created for phone:", phone);
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes

    // Save OTP and expiry
    partner = await Partner.findOneAndUpdate(
      { phone },
      {
        $set: {
          tempOTP: otp,
          otpExpiry: otpExpiry,
        },
      },
      { new: true }
    );

    // Send OTP via SMS
    await sendOTP(phone, otp);

    // Debug log
    console.log("Generated OTP:", { phone, otp, expiry: otpExpiry });

    res.json({
      success: true,
      message: "OTP sent successfully",
      phone,
    });
  } catch (error) {
    console.error("Send Partner OTP Error:", error);
    res.status(500).json({
      success: false,
      message: "Error sending OTP",
    });
  }
};

// Verify OTP and login partner
exports.verifyLoginOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: "Phone and OTP are required",
      });
    }

    // Debug log
    console.log("Verifying OTP:", { phone, otp });

    const partner = await Partner.findOne({ phone })
      .select("+tempOTP +otpExpiry")
      .populate("walletId"); // Populate wallet details

    // Debug log
    console.log("Found Partner:", partner);

    if (!partner) {
      return res.status(400).json({
        success: false,
        message: "Partner not found",
      });
    }

    // Check if OTP is expired
    if (partner.otpExpiry && partner.otpExpiry < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired",
      });
    }

    // Verify OTP
    if (partner.tempOTP !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // Clear OTP fields after successful verification
    partner.tempOTP = undefined;
    partner.otpExpiry = undefined;
    await partner.save();

    // Generate JWT token
    const token = jwt.sign({ id: partner._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    // Prepare response with minimal partner details
    const response = {
      success: true,
      message: "Login successful",
      partner: {
        _id: partner._id,
        phone: partner.phone,
        status: partner.status,
        kycStatus: partner.kycStatus,
        profileCompleted: partner.profileCompleted,
        profile: partner.profile,
        token,
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({
      success: false,
      message: "Error during login",
      error: error.message,
    });
  }
};

// Resend OTP for partner
exports.resendOTP = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    const partner = await Partner.findOne({ phone });
    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Partner not found",
      });
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // Save new OTP
    await Partner.findOneAndUpdate(
      { phone },
      {
        $set: {
          tempOTP: otp,
          otpExpiry: otpExpiry,
        },
      },
      { new: true }
    );

    // Send OTP via SMS
    await sendOTP(phone, otp);

    res.json({
      success: true,
      message: "OTP resent successfully",
      phone,
    });
  } catch (error) {
    console.error("Resend Partner OTP Error:", error);
    res.status(500).json({
      success: false,
      message: "Error resending OTP",
    });
  }
};

// Complete partner profile
exports.completeProfile = async (req, res) => {
  try {
    console.log("Received request body:", req.body);
    console.log("Received files:", req.file);

    const {
      name,
      email,
      whatsappNumber,
      qualification,
      experience,
      category,
      service,
      modeOfService,
      contactNumber,
      subcategory,
    } = req.body;

    if (!name || !email || !service || !subcategory) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // Validate service ID and ensure it belongs to the correct subcategory
    const validService = await Service.findOne({ _id: new mongoose.Types.ObjectId(service), subcategory: new mongoose.Types.ObjectId(subcategory) });
    console.log("Service Query Result:", validService);
    if (!validService) {
      return res.status(400).json({
        success: false,
        message: "Invalid service ID or service does not belong to the selected subcategory",
      });
    }

    // Handle file upload
    let profilePicturePath = "";
    if (req.file) {
      profilePicturePath = req.file.path;
    }

    const newPartner = new Partner ({
      name,
      email,
      whatsappNumber,
      qualification,
      experience,
      category,
      service,
      modeOfService,
      contactNumber,
      subcategory,
      profilePicture: profilePicturePath,
    });

    await newPartner.save();
    return res.status(201).json({ success: true, message: "Profile completed successfully", data: newPartner });
  } catch (error) {
    console.error("Complete Profile Error:", error.message);
    return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};



// Update KYC details
exports.updateKYC = async (req, res) => {
  try {
    const {
      panNumber,
      panImage,
      aadhaarNumber,
      aadhaarFrontImage,
      aadhaarBackImage,
    } = req.body;

    // Validate required fields
    if (
      !panNumber ||
      !panImage ||
      !aadhaarNumber ||
      !aadhaarFrontImage ||
      !aadhaarBackImage
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all KYC details",
      });
    }

    const profile = await PartnerProfile.findOne({ partner: req.partner._id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    // Update KYC details
    profile.kyc = {
      panCard: {
        number: panNumber,
        image: panImage,
        verified: "pending",
      },
      aadhaarCard: {
        number: aadhaarNumber,
        frontImage: aadhaarFrontImage,
        backImage: aadhaarBackImage,
        verified: "pending",
      },
    };

    await profile.save();

    res.json({
      success: true,
      message: "KYC details updated successfully",
      kyc: profile.kyc,
    });
  } catch (error) {
    console.error("Update KYC Error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating KYC details",
    });
  }
};

// Update bank details
exports.updateBankDetails = async (req, res) => {
  try {
    const {
      accountNumber,
      ifscCode,
      accountHolderName,
      bankName,
      chequeImage,
    } = req.body;

    // Validate required fields
    if (
      !accountNumber ||
      !ifscCode ||
      !accountHolderName ||
      !bankName ||
      !chequeImage
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all bank details",
      });
    }

    const profile = await PartnerProfile.findOne({ partner: req.partner._id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    // Update bank details
    profile.bankDetails = {
      accountNumber,
      ifscCode,
      accountHolderName,
      bankName,
      chequeImage,
      verified: "pending",
    };

    await profile.save();

    res.json({
      success: true,
      message: "Bank details updated successfully",
      bankDetails: profile.bankDetails,
    });
  } catch (error) {
    console.error("Update Bank Details Error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating bank details",
    });
  }
};

// Complete KYC
exports.completeKYC = async (req, res) => {
  try {
    const { accountNumber, ifscCode, accountHolderName, bankName } = req.body;

    // Get filenames from uploaded files
    const panCard = req.files["panCard"]
      ? req.files["panCard"][0].filename
      : null;
    const aadhaar = req.files["aadhaar"]
      ? req.files["aadhaar"][0].filename
      : null;
    const chequeImage = req.files["chequeImage"]
      ? req.files["chequeImage"][0].filename
      : null;

    // Log the received files and body for debugging
    console.log("Files received:", req.files);
    console.log("Body received:", req.body);

    // Validate required fields
    if (
      !accountNumber ||
      !ifscCode ||
      !accountHolderName ||
      !bankName ||
      !panCard ||
      !aadhaar ||
      !chequeImage
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields and documents",
      });
    }

    // Get partner profile
    const profile = await PartnerProfile.findOne({ partner: req.partner._id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Partner profile not found",
      });
    }

    // Update KYC details
    profile.kyc = {
      panCard,
      aadhaar,
    };

    profile.bankDetails = {
      accountNumber,
      ifscCode,
      accountHolderName,
      bankName,
      chequeImage,
    };

    // Set verification status to pending
    profile.isVerified = "pending";
    profile.verificationStatus = "pending";

    await profile.save();

    // Transform the response to include only filenames
    const transformedProfile = {
      ...profile.toJSON(),
      kyc: {
        panCard: profile.kyc.panCard,
        aadhaar: profile.kyc.aadhaar,
      },
      bankDetails: {
        accountNumber: profile.bankDetails.accountNumber,
        ifscCode: profile.bankDetails.ifscCode,
        accountHolderName: profile.bankDetails.accountHolderName,
        bankName: profile.bankDetails.bankName,
        chequeImage: profile.bankDetails.chequeImage,
      },
      verificationStatus: profile.verificationStatus,
    };
    res.json({
      success: true,
      message: "KYC completed successfully",
      profile: transformedProfile,
    });
  } catch (error) {
    console.error("Complete KYC Error:", error);
    res.status(500).json({
      success: false,
      message: "Error completing KYC",
      error: error.message,
    });
  }
};

// Get partner profile
exports.getProfile = async (req, res) => {
  try {
    const profile = await PartnerProfile.findOne({ partner: req.partner._id })
      .populate("category", "name description")
      .populate("service", "name description basePrice duration");

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    res.json({
      success: true,
      profile: {
        id: profile._id,
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        whatsappNumber: profile.whatsappNumber,
        contactNumber: profile.contactNumber,
        qualification: profile.qualification,
        experience: profile.experience,
        category: profile.category,
        service: profile.service,
        modeOfService: profile.modeOfService,
        profilePicture: profile.profilePicture,
        verificationStatus: profile.verificationStatus,
        status: profile.status,
        dutyStatus: profile.dutyStatus,
      },
    });
  } catch (error) {
    console.error("Get Profile Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching profile",
    });
  }
};

// Update partner profile
exports.updateProfile = [
  upload.single("profilePicture"),
  async (req, res) => {
    try {
      const {
        name,
        email,
        whatsappNumber,
        contactNumber,
        qualification,
        experience,
        category,
        service,
        modeOfService,
      } = req.body;

      let profile = await PartnerProfile.findOne({ partner: req.partner._id });
      if (!profile) {
        return res.status(404).json({
          success: false,
          message: "Profile not found",
        });
      }

      // Get the profile picture filename if uploaded
      const profilePicture = req.file ? req.file.filename : undefined;

      // Update only provided fields
      if (name) profile.name = name;
      if (email) profile.email = email;
      if (whatsappNumber) profile.whatsappNumber = whatsappNumber;
      if (contactNumber) profile.contactNumber = contactNumber;
      if (qualification) profile.qualification = qualification;
      if (experience) profile.experience = parseFloat(experience);
      if (category) profile.category = category;
      if (service) profile.service = service;
      if (modeOfService) profile.modeOfService = modeOfService;
      if (profilePicture) profile.profilePicture = profilePicture;

      await profile.save();

      // Populate category and service details
      await profile.populate("category", "name description");
      await profile.populate("service", "name description basePrice duration");

      res.json({
        success: true,
        message: "Profile updated successfully",
        profile: {
          id: profile._id,
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          whatsappNumber: profile.whatsappNumber,
          contactNumber: profile.contactNumber,
          qualification: profile.qualification,
          experience: profile.experience,
          category: profile.category,
          service: profile.service,
          modeOfService: profile.modeOfService,
          profilePicture: profile.profilePicture,
          verificationStatus: profile.verificationStatus,
          status: profile.status,
          dutyStatus: profile.dutyStatus,
        },
      });
    } catch (error) {
      console.error("Update Profile Error:", error);
      res.status(500).json({
        success: false,
        message: "Error updating profile",
        error: error.message,
      });
    }
  },
];
