const jwt = require("jsonwebtoken");
const Partner = require("../models/PartnerModel");

exports.auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: "Authentication required" 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const partner = await Partner.findById(decoded.id);

    if (!partner) {
      return res.status(401).json({ 
        success: false,
        message: "Partner not found. Please authenticate again." 
      });
    }

    if (partner.status === 'blocked' || partner.profileStatus === 'inactive') {
      return res.status(403).json({ 
        success: false,
        message: "Your account has been blocked or deactivated. Please contact support for assistance.",
        blocked: true,
        kycStatus: partner.kyc?.status || 'pending',
        profileStatus: partner.profileStatus
      });
    }

    req.partner = partner;
    req.token = token;
    next();
  } catch (error) {
    console.error("Auth Error:", error);
    res.status(401).json({ 
      success: false,
      message: "Please authenticate" 
    });
  }
};