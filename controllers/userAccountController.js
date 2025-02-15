const User = require("../models/User");
const Support = require("../models/Support");
const Quotation = require("../models/Quotation");
const Token = require("../models/Token");
const Transaction = require("../models/Transaction");

// Get company information
exports.getAboutInfo = async (req, res) => {
  try {
    const aboutInfo = {
      companyName: "Wave",
      description: "Your trusted partner for home services",
      mission: "To provide quality home services at your convenience",
      vision: "To be the leading home service provider in India",
      contact: {
        email: "support@wave.com",
        phone: "+91-XXXXXXXXXX",
        address: "Wave Headquarters, India"
      }
    };
    res.json({ success: true, data: aboutInfo });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching company information" });
  }
};

// Get terms and conditions
exports.getTermsAndConditions = async (req, res) => {
  try {
    const terms = {
      lastUpdated: "2024-01-27",
      sections: [
        {
          title: "Service Usage",
          content: "Terms related to service usage..."
        },
        {
          title: "Payment Terms",
          content: "Terms related to payments..."
        },
        // Add more sections as needed
      ]
    };
    res.json({ success: true, data: terms });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching terms and conditions" });
  }
};

// Submit support request
exports.submitSupportRequest = async (req, res) => {
  try {
    const { bookingId, reason } = req.body;
    const support = new Support({
      user: req.user._id,
      booking: bookingId,
      reason,
      status: 'pending'
    });
    await support.save();
    res.json({ success: true, message: "Support request submitted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error submitting support request" });
  }
};

// Get support history
exports.getSupportHistory = async (req, res) => {
  try {
    const supportRequests = await Support.find({ user: req.user._id })
      .populate('booking')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: supportRequests });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching support history" });
  }
};

// Get quotations
exports.getQuotations = async (req, res) => {
  try {
    const quotations = await Quotation.find({ user: req.user._id })
      .populate('service')
      .populate('partner', 'name rating')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: quotations });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching quotations" });
  }
};

// Accept quotation
exports.acceptQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findOneAndUpdate(
      { _id: req.params.quotationId, user: req.user._id },
      { status: 'accepted' },
      { new: true }
    );
    if (!quotation) {
      return res.status(404).json({ success: false, message: "Quotation not found" });
    }
    res.json({ success: true, data: quotation });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error accepting quotation" });
  }
};

// Reject quotation
exports.rejectQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findOneAndUpdate(
      { _id: req.params.quotationId, user: req.user._id },
      { status: 'rejected' },
      { new: true }
    );
    if (!quotation) {
      return res.status(404).json({ success: false, message: "Quotation not found" });
    }
    res.json({ success: true, data: quotation });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error rejecting quotation" });
  }
};

// Get tokens
exports.getTokens = async (req, res) => {
  try {
    const tokens = await Token.find({ user: req.user._id })
      .populate('booking')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: tokens });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching tokens" });
  }
};

// Get payment history
exports.getPaymentHistory = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id })
      .populate('booking')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching payment history" });
  }
};

// Logout
exports.logout = async (req, res) => {
  try {
    // Clear the user's token (if you're storing it)
    req.user.tokens = req.user.tokens.filter(token => token.token !== req.token);
    await req.user.save();
    res.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error during logout" });
  }
};
