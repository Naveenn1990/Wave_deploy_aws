const Transaction = require("../models/Transaction");

// **Get All Transactions for a Specific User**
exports.getUserTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.params.userId })
      .populate("booking", "service date")
      .sort({ createdAt: -1 });

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
