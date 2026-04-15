const express = require("express");
const router = express.Router();
const referralController = require("../controllers/ReferralAmountController");
const { adminAuth } = require("../middleware/adminAuth");
// Route to add or update referral amount
router.post("/referral-amount",adminAuth, referralController.addOrUpdateReferralAmount);

// Route to get referral amount
router.get("/referral-amount", referralController.getReferralAmount);

module.exports = router;
