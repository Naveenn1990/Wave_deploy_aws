const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/userAuth");
const userAccountController = require("../controllers/userAccountController");

// Company Info routes
router.get("/about", userAccountController.getAboutInfo);
router.get("/terms", userAccountController.getTermsAndConditions);

// Support routes
router.post("/support", auth, userAccountController.submitSupportRequest);
router.get("/support/history", auth, userAccountController.getSupportHistory);

// Quotation routes
router.get("/quotations", auth, userAccountController.getQuotations);
router.put("/quotations/:quotationId/accept", auth, userAccountController.acceptQuotation);
router.put("/quotations/:quotationId/reject", auth, userAccountController.rejectQuotation);

// Token routes
router.get("/tokens", auth, userAccountController.getTokens);

// Payment History routes
router.get("/payments", auth, userAccountController.getPaymentHistory);

// Logout route
router.post("/logout", auth, userAccountController.logout);

module.exports = router;
