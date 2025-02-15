const PartnerWallet = require("../models/PartnerWallet");
const PartnerProfile = require("../models/PartnerProfile");
const { createRazorpayOrder } = require("../utils/razorpay");

// Get wallet details
exports.getWalletDetails = async (req, res) => {
  try {
    const wallet = await PartnerWallet.findOne({ partner: req.partner._id })
      .select("-transactions");

    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    res.json(wallet);
  } catch (error) {
    console.error("Get Wallet Details Error:", error);
    res.status(500).json({ message: "Error fetching wallet details" });
  }
};

// Get transaction history
exports.getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 10, type } = req.query;
    const wallet = await PartnerWallet.findOne({ partner: req.partner._id });

    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    let transactions = wallet.transactions;
    if (type) {
      transactions = transactions.filter(t => t.type === type);
    }

    const total = transactions.length;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    transactions = transactions
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(startIndex, endIndex);

    res.json({
      transactions,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error("Get Transactions Error:", error);
    res.status(500).json({ message: "Error fetching transactions" });
  }
};

// Initiate wallet recharge
exports.initiateRecharge = async (req, res) => {
  try {
    const { amount } = req.body;
    const minAmount = 100; // Minimum recharge amount

    if (!amount || amount < minAmount) {
      return res.status(400).json({ 
        message: `Minimum recharge amount is ₹${minAmount}` 
      });
    }

    const order = await createRazorpayOrder({
      amount: amount * 100, // Convert to paise
      currency: "INR",
      receipt: `recharge_${req.partner._id}_${Date.now()}`
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (error) {
    console.error("Initiate Recharge Error:", error);
    res.status(500).json({ message: "Error initiating recharge" });
  }
};

// Verify recharge and credit wallet
exports.verifyRecharge = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    // Verify payment signature
    const isValid = verifyPaymentSignature({
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      signature: razorpay_signature
    });

    if (!isValid) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    // Get payment details
    const payment = await getRazorpayPayment(razorpay_payment_id);
    const amount = payment.amount / 100; // Convert from paise to rupees

    // Credit wallet
    const wallet = await PartnerWallet.findOne({ partner: req.partner._id });
    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    await wallet.credit(
      amount,
      "Wallet recharge",
      razorpay_payment_id
    );

    res.json({
      message: "Wallet recharged successfully",
      amount,
      balance: wallet.balance
    });
  } catch (error) {
    console.error("Verify Recharge Error:", error);
    res.status(500).json({ message: "Error verifying recharge" });
  }
};

// Get wallet statistics
exports.getWalletStats = async (req, res) => {
  try {
    const wallet = await PartnerWallet.findOne({ partner: req.partner._id });
    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const startOfMonth = new Date(today.setDate(1));

    const stats = {
      currentBalance: wallet.balance,
      today: {
        credits: 0,
        debits: 0
      },
      thisWeek: {
        credits: 0,
        debits: 0
      },
      thisMonth: {
        credits: 0,
        debits: 0
      }
    };

    wallet.transactions.forEach(transaction => {
      const amount = transaction.amount;
      const date = new Date(transaction.createdAt);

      if (date >= startOfDay) {
        if (transaction.type === "credit") {
          stats.today.credits += amount;
        } else {
          stats.today.debits += amount;
        }
      }

      if (date >= startOfWeek) {
        if (transaction.type === "credit") {
          stats.thisWeek.credits += amount;
        } else {
          stats.thisWeek.debits += amount;
        }
      }

      if (date >= startOfMonth) {
        if (transaction.type === "credit") {
          stats.thisMonth.credits += amount;
        } else {
          stats.thisMonth.debits += amount;
        }
      }
    });

    res.json(stats);
  } catch (error) {
    console.error("Get Wallet Stats Error:", error);
    res.status(500).json({ message: "Error fetching wallet statistics" });
  }
};
