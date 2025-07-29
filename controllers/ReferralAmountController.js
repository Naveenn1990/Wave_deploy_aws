const ReferralAmount = require("../models/ReferralAmount");

// Add or Update Referral Amount
exports.addOrUpdateReferralAmount = async (req, res) => {
  try {
    const data = req.body;

    // Check if a document already exists
    const existing = await ReferralAmount.findOne();

    if (existing) {
      // Update the existing document
      const updated = await ReferralAmount.findByIdAndUpdate(
        existing._id,
        data,
        { new: true }
      );
      return res.status(200).json({
        success: true,
        message: "Referral amount updated successfully",
        data: updated,
      });
    } else {
      // Create new document
      const created = await ReferralAmount.create(data);
      return res.status(200).json({
        success: true,
        message: "Referral amount added successfully",
        data: created,
      });
    }
  } catch (error) {
    console.error("ReferralAmount Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get Referral Amount
exports.getReferralAmount = async (req, res) => {
  try {
    const data = await ReferralAmount.findOne();
  
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("ReferralAmount Fetch Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
