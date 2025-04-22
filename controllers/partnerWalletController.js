const Partner = require("../models/PartnerModel");
const Booking = require("../models/booking");
const SubService = require("../models/SubService");
const Wallet = require("../models/Wallet");
const { v4: uuidv4 } = require("uuid");

exports.topUpWallet = async (req, res) => {
  try {
    const { partnerId } = req.params;
    const { amount, type, description, reference } = req.body; // Extract type from req.body

    console.log("req params", req.params);
    console.log("req body", req.body);

    if (!partnerId || !amount || !type || !reference) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const lowerType = type.toLowerCase(); // Ensure lowercase values for enum
    if (!["credit", "debit"].includes(lowerType)) {
      return res.status(400).json({ message: "Invalid transaction type" });
    }

    let wallet = await PartnerWallet.findOne({ partner: partnerId });

    if (!wallet) {
      wallet = new PartnerWallet({ partner: partnerId, balance: 0, transactions: [] });
    }

    // Use schema methods for credit/debit
    if (lowerType === "credit") {
      await wallet.credit(amount, description, reference);
    } else if (lowerType === "debit") {
      if (wallet.balance < amount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      await wallet.debit(amount, description, reference);
    }

    res.status(201).json({ message: "Transaction successful", wallet });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.transactionsWallet = async (req, res) => {
  try {
    const { partnerId } = req.params; // Use params instead of body

    if (!partnerId) {
      return res.status(400).json({ message: "Missing partner ID" });
    }

    // Retrieve partner wallet
    const wallet = await PartnerWallet.findOne({ partner: partnerId });

    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    res.status(200).json({ transactions: wallet.transactions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

