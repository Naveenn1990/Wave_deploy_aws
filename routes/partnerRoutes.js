const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/partnerAuth");
const { adminAuth } = require("../middleware/adminAuth");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const partnerServiceController = require("../controllers/partnerServiceController");
const partnerAuthController = require("../controllers/partnerAuthController");
const partnerWalletController = require("../controllers/partnerWalletController");

// Create upload directories if they don't exist
const uploadDir = path.join(__dirname, "..", "uploads");
const profilesDir = path.join(uploadDir, "profiles");
const kycDir = path.join(uploadDir, "kyc");
const bookingPhotosDir = path.join(uploadDir, "booking-photos");
const bookingVideosDir = path.join(uploadDir, "booking-videos");

// Create directories with recursive option
fs.mkdirSync(uploadDir, { recursive: true });
fs.mkdirSync(profilesDir, { recursive: true });
fs.mkdirSync(kycDir, { recursive: true });
fs.mkdirSync(bookingPhotosDir, { recursive: true });
fs.mkdirSync(bookingVideosDir, { recursive: true });

// Import controllers
const {
  getAvailableServices,
  selectService,
  getCurrentService,
  getServiceHistory,
  updateServiceStatus,
  getMatchingBookings,
  acceptBooking,
sendOtpWithNotification,
verifyOtpbooking,
sendSmsOtp,
} = partnerServiceController;

const {
  sendLoginOTP,
  resendOTP,
  verifyLoginOTP,
  getProfile,
  updateProfile,
  completeProfile,
  completeKYC,
  getAllPartnerProfile,
  updateKYCStatus,
  updateLocation
} = require("../controllers/partnerAuthController");

const {acceptBookingDriver,rejectBookingDriver,getByDriverId}=require('../controllers/DriverBooking')

const {
  getAllCategories,
} = require("../controllers/partnerDropdownController");



const upload = multer({

  limits: {
    fileSize: (file) =>
      file.fieldname === "videos" ? 100 * 1024 * 1024 : 5 * 1024 * 1024, // 100MB for videos, 5MB for images
  },

});

// Partner Authentication Routes
router.post("/auth/send-otp", sendLoginOTP);
router.post("/auth/resend-otp", resendOTP);
router.post("/auth/verify-otp", verifyLoginOTP);

// Partner Profile Routes (Protected)
router.get("/profile", auth, getProfile);
router.get("/partnersprofile", getAllPartnerProfile);

router.put(
  "/profile/update",
  auth,
  (req, res, next) => {
    upload.single("profilePicture")(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({
          success: false,
          message: `Upload error: ${err.message}`,
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }
      next();
    });
  },
  updateProfile
);

router.post(
  "/profile/complete",
  auth,
 upload.single("profilePicture"),

  completeProfile
);



router.get("/getAllReferralpartner", adminAuth, partnerAuthController.getAllReferralpartner);

// Partner KYC Routes (Protected)
router.post(
  "/kyc/complete",
  auth,
  (req, res, next) => {
    upload.fields([
      { name: "panCard", maxCount: 1 },
      { name: "aadhaar", maxCount: 1 },
      { name: "aadhaarback", maxCount: 1 },
      { name: "chequeImage", maxCount: 1 },
      { name: "drivingLicence", maxCount: 1 },
      { name: "bill", maxCount: 1 },
    ])(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({
          success: false,
          message: `Upload error: ${err.message}`,
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }
      // Log the files received
      // console.log("Files received:", req.files);
      next();
    });
  },
  completeKYC
);

// Admin route to update KYC status (Protected, Admin Only)
router.put("/kyc/:partnerId/status", adminAuth, updateKYCStatus);

router.get('/referralcode/:referralCode',auth,partnerAuthController.getReferralCode);
// Partner Service Routes (Protected)
router.get("/services/available", auth, getAvailableServices);
router.post("/services/select", auth, selectService);
router.get("/services/current", auth, getCurrentService);
router.get("/services/history", auth, getServiceHistory);
router.put("/services/status", auth, updateServiceStatus);
router.get("/bookings/matching", auth, getMatchingBookings);
router.put(
  "/bookings/:bookingId/accept",
  partnerServiceController.acceptBooking
);
router.put(
  "/bookings/:bookingId/reject",
  partnerServiceController.rejectBooking
);

// New route to mark an accepted booking as completed and handle photo/video uploads
router.post(
  "/bookings/:id/complete",
  auth,
  upload.fields([
    { name: "photos", maxCount: 10 },
    { name: "videos", maxCount: 5 },
      { name: "afterVideo", maxCount: 5 },
  ]),
  partnerServiceController.completeBooking
);

// Dropdown data route
router.get("/dropdown/categories", getAllCategories);

// Route to get all completed bookings for a partner
router.get(
  "/bookings/completed",
  auth,
  partnerServiceController.getCompletedBookings
);

// Route to get all pending bookings for a partner
router.get(
  "/bookings/pending",
  auth,
  partnerServiceController.getPendingBookings
);

// Route to get all rejected bookings for a partner
router.get(
  "/bookings/rejected",
  auth,
  partnerServiceController.getRejectedBookings
);
// Route to select a service and category
router.post(
  "/select-category-and-service",
  auth,
  partnerAuthController.selectCategoryAndServices
);

// Route to get all accepted bookings for a partner
router.get(
  "/bookings/accepted/:partnerId",
  auth,
  partnerServiceController.getPartnerBookings
);

// Route to pause a booking
router.post(
  "/bookings/:bookingId/pause",

  partnerServiceController.pauseBooking
);

// Routes for paused bookings
router.get(
  "/bookings/paused",
  auth,
  partnerServiceController.getPausedBookings
);
router.post(
  "/bookings/:bookingId/resume",
  auth,
  partnerServiceController.resumeBooking
);

// Route to top up wallet
router.post("/partner/wallet/topup", auth, partnerWalletController.topUpWallet);
// Route to get wallet transactions
router.get(
  "/partner/:partnerId/transactions",
  auth,
  partnerWalletController.transactionsWallet
);

router.get(
  "/products/:category",
  auth,
  partnerServiceController.getProductsByCategory
); // Get products by category
// router.put('/products/use/:id', auth, partnerServiceController.useProduct); // Use product (decrease stock)
// router.put('/products/return/:id', auth, partnerServiceController.returnProduct); // Return product (increase stock)
router.post("/products/add", auth, partnerServiceController.addToCart); // Add new product
router.put('/product/removecart',auth,partnerServiceController.removeCart);

router.put("/products/addmanulcart",upload.any(), auth, partnerServiceController.AddManulProductCart); // Get cart items

router.get("/bookings", auth, partnerServiceController.allpartnerBookings);

router.get("/bookings", auth, partnerServiceController.allpartnerBookings);

router.get(
  "/bookingbyid/:bookingId",
  auth,
  partnerServiceController.getBookingBybookid
);

// Route to get user reviews
router.get("/reviews/user", auth, partnerServiceController.getUserReviews);

// Route to review user
router.post("/reviews/user", auth, partnerServiceController.reviewUser);
router.put('/upload/review-video',upload.any(),auth,partnerServiceController.reviewVideo);
router.get("/getWalletbypartner", auth, partnerAuthController.getWallet);
router.put("/updateTokenFmc",auth,partnerAuthController.updateTokenFmc);
router.put("/updateLocation",auth,partnerAuthController.updateLocation);
router.put("/regigiste-fee",auth,partnerAuthController.completePaymentVendor)
router.post(
  "/addtransactionwallet",
  auth,
  partnerAuthController.addtransactionwallet
);
router.get(
  "/getAllwalletTransaction",
  auth,
  partnerAuthController.getAllwalletTransaction
);

router.put("/acceptdriver",auth,acceptBookingDriver);
router.put("/rejectdriver",auth,rejectBookingDriver);
router.get("/getByDriver",auth,getByDriverId);
router.post("/sendOtpWithNotification", auth, sendOtpWithNotification);
router.post("/verifyOtpbooking", auth, verifyOtpbooking);
router.post("/sendSmsOtp", auth, sendSmsOtp);

module.exports = router;
