const transactionController = require("../controllers/phonePay");
const express = require('express');
const router = express.Router();

router.post("/addpaymentphonepay", transactionController.addPaymentPhone);

router.post("/makepayment", transactionController.makepayment);
router.put("/updateStatuspayment/:id", transactionController.updateStatuspayment);
router.get("/getallpayment", transactionController.getallpayment);
router.post("/payment-callback", transactionController.paymentcallback);
router.get("/checkPayment/:id/:userId", transactionController.checkPayment);
module.exports = router;