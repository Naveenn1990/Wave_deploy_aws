const express = require("express");
const {
  getUserTransactions,
} = require("../controllers/userTranscationController");

const router = express.Router();

// **Get All Transactions for a User**
router.get("/:userId", getUserTransactions);

module.exports = router;
