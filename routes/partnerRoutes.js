const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/partnerauth");
const multer = require("multer");
const path = require("path");
const fs = require('fs');
const crypto = require('crypto');
const partnerServiceController = require('../controllers/partnerServiceController');
const partnerAuthController = require('../controllers/partnerAuthController');


// Create upload directories if they don't exist
const uploadDir = path.join(__dirname, '..', 'uploads');
const profilesDir = path.join(uploadDir, 'profiles');
const kycDir = path.join(uploadDir, 'kyc');
const bookingPhotosDir = path.join(uploadDir, 'booking-photos');

// Create directories with recursive option
fs.mkdirSync(uploadDir, { recursive: true });
fs.mkdirSync(profilesDir, { recursive: true });
fs.mkdirSync(kycDir, { recursive: true });
fs.mkdirSync(bookingPhotosDir, { recursive: true });

// Import controllers
const {
  getAvailableServices,
  selectService,
  getCurrentService,
  getServiceHistory,
  updateServiceStatus,
  getMatchingBookings,
  acceptBooking
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
} = require("../controllers/partnerAuthController");



const {
    completeBooking
  } = require("../controllers/partnerServiceController");

const { getAllCategories } = require("../controllers/partnerDropdownController");

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (file.fieldname === 'profilePicture') {
            cb(null, profilesDir);
        } else if (file.fieldname === 'panCard' || file.fieldname === 'aadhaar' || file.fieldname === 'chequeImage') {
            cb(null, kycDir);
        } else {
            cb(null, bookingPhotosDir);
        }
    },
    filename: function (req, file, cb) {
        const hash = crypto.createHash('md5').update(Date.now().toString()).digest('hex');
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${hash}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'profilePicture') {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Please upload an image file'));
        }
    }
    cb(null, true);
};

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: fileFilter
});

// Partner Authentication Routes
router.post("/auth/send-otp", sendLoginOTP);
router.post("/auth/resend-otp", resendOTP);
router.post("/auth/verify-otp", verifyLoginOTP);

// Partner Profile Routes (Protected)
router.get("/profile", auth, getProfile);
router.get("/partnersprofile", getAllPartnerProfile);

router.put("/profile/update", auth, (req, res, next) => {
    upload.single('profilePicture')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({
                success: false,
                message: `Upload error: ${err.message}`
            });
        } else if (err) {
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }
        next();
    });
}, updateProfile);

router.post("/profile/complete", auth, (req, res, next) => {
    upload.single('profilePicture')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({
                success: false,
                message: `Upload error: ${err.message}`
            });
        } else if (err) {
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }
        next();
    });
}, completeProfile);

// Partner KYC Routes (Protected)
router.post("/kyc/complete", auth, (req, res, next) => {
    upload.fields([
        { name: 'panCard', maxCount: 1 },
        { name: 'aadhaar', maxCount: 1 },
        { name: 'chequeImage', maxCount: 1 }
    ])(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({
                success: false,
                message: `Upload error: ${err.message}`
            });
        } else if (err) {
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }
        // Log the files received
        console.log('Files received:', req.files);
        next();
    });
}, completeKYC);

// Partner Service Routes (Protected)
router.get("/services/available", auth, getAvailableServices);
router.post("/services/select", auth, selectService);
router.get("/services/current", auth, getCurrentService);
router.get("/services/history", auth, getServiceHistory);
router.put("/services/status", auth, updateServiceStatus);
router.get("/bookings/matching", auth, getMatchingBookings);
router.put("/bookings/:bookingId/accept",  partnerServiceController.acceptBooking);
router.put("/bookings/:bookingId/reject",  partnerServiceController.rejectBooking);

// New route to mark an accepted booking as completed and handle photo uploads
router.post('/booking/:id/complete', upload.array('photos', 10), partnerServiceController.completeBooking);

// Dropdown data route
router.get("/dropdown/categories", getAllCategories);


// Route to get all completed bookings for a partner
router.get('/bookings/completed', auth, partnerServiceController.getCompletedBookings);

// Route to get all pending bookings for a partner
router.get('/bookings/pending', auth, partnerServiceController.getPendingBookings);

// Route to get all rejected bookings for a partner
router.get('/bookings/rejected', auth, partnerServiceController.getRejectedBookings);
// Route to select a service and category
router.post('/select-category-and-service', auth, partnerAuthController.selectCategoryAndServices);


// Route to get all accepted bookings for a partner
router.get('/bookings/accepted/:partnerId', auth, partnerServiceController.getPartnerBookings);






module.exports = router;