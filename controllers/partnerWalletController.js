const Partner = require('../models/Partner');
const Booking = require('../models/booking');
const SubService = require('../models/SubService');
const PartnerWallet = require("../models/PartnerWallet");
const { v4: uuidv4 } = require("uuid");



exports.topUpPartnerWallet = async (req, res) => {
  try {
    const { partnerId, amount, type } = req.body;

    // Validate input
    if (!partnerId || !amount || !type) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Find or create partner wallet
    let wallet = await PartnerWallet.findOne({ partnerId });
    if (!wallet) {
      wallet = new PartnerWallet({ partnerId, balance: 0, transactions: [] });
    }

    // Check for sufficient balance on debit
    if (type === 'Debit' && wallet.balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Create new transaction
    const newTransaction = {
      transactionId: uuidv4(),
      amount,
      type,
      date: new Date(),
    };

    // Update wallet balance and transactions
    wallet.transactions.push(newTransaction);
    wallet.balance += type === 'Credit' ? amount : -amount;

    // Save wallet
    await wallet.save();

    res.status(201).json({ message: 'Transaction successful', wallet });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.transactionsWallet = async (req, res) => {
  try {
    const { partnerId } = req.params;

    // Validate input
    if (!partnerId) {
      return res.status(400).json({ message: 'Partner ID is required' });
    }

    // Retrieve partner wallet
    const wallet = await PartnerWallet.findOne({ partnerId });

    if (!wallet) {
      return res.status(404).json({ message: 'Wallet not found' });
    }

    // Return transactions
    res.status(200).json({ transactions: wallet.transactions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
