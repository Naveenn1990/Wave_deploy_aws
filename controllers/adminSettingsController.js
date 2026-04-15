const Settings = require("../models/Settings");
const CommissionGuideline = require("../models/CommissionGuideline");
const SupportSettings = require("../models/SupportSettings");

// Get all settings
exports.getAllSettings = async (req, res) => {
  try {
    const settings = await Settings.findOne();
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching settings"
    });
  }
};

// Update settings
exports.updateSettings = async (req, res) => {
  try {
    const settings = await Settings.findOneAndUpdate(
      {},
      { $set: req.body },
      { new: true, upsert: true }
    );
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating settings"
    });
  }
};

// Get commission guidelines
exports.getCommissionGuidelines = async (req, res) => {
  try {
    const guidelines = await CommissionGuideline.find();
    res.json({
      success: true,
      data: guidelines
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching commission guidelines"
    });
  }
};

// Update commission guidelines
exports.updateCommissionGuidelines = async (req, res) => {
  try {
    const { guidelines } = req.body;
    
    // Remove existing guidelines
    await CommissionGuideline.deleteMany({});
    
    // Insert new guidelines
    const newGuidelines = await CommissionGuideline.insertMany(guidelines);
    
    res.json({
      success: true,
      data: newGuidelines
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating commission guidelines"
    });
  }
};

// Get support settings
exports.getSupportSettings = async (req, res) => {
  try {
    const settings = await SupportSettings.findOne();
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching support settings"
    });
  }
};

// Update support settings
exports.updateSupportSettings = async (req, res) => {
  try {
    const settings = await SupportSettings.findOneAndUpdate(
      {},
      { $set: req.body },
      { new: true, upsert: true }
    );
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating support settings"
    });
  }
};
