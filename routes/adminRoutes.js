const express = require("express");
const router = express.Router();
const { adminAuth } = require("../middleware/adminAuth");
const adminController = require("../controllers/adminController");
const adminServiceController = require("../controllers/adminServiceController");
const adminSettingsController = require("../controllers/adminSettingsController");
const adminReportController = require("../controllers/adminReportController");
const bannerController = require("../controllers/bannerController");
const userServiceController = require("../controllers/userServiceController");
const { upload, processFilePath } = require("../middleware/upload");
const SubCategory = require("../models/SubCategory");
const Product = require("../models/product");

// Auth routes
router.post("/login", adminController.loginAdmin);
router.post("/create", adminAuth, adminController.createAdmin);

// Dashboard and analytics
router.get("/dashboard", adminAuth, adminController.getDashboardAnalytics);

// User Management
router.get("/users", adminAuth, adminController.getAllUsers);

// Partner management
router.get("/partners", adminAuth, adminController.getAllPartners);
router.get("/partners/:partnerId", adminAuth, adminController.getPartnerDetails);
router.put("/partners/:partnerId/status" , adminController.updatePartnerStatus);
router.get("/partners/kyc/pending", adminAuth, adminController.getPendingKYC);
router.get("/partners/:partnerId/kyc", adminAuth, adminController.getPartnerKYC);
router.put("/partners/:partnerId/kyc", adminAuth, adminController.verifyPartnerKYC);

// Service Category Management
router.post("/service-category", adminAuth, upload.single('icon'), processFilePath, adminServiceController.createCategory);
router.get("/service-categories", adminAuth, adminServiceController.getAllCategories);
router.get("/categories", adminAuth, adminServiceController.getAllCategoriesWithDetails);
router.get("/categories-with-details", adminAuth, adminServiceController.getAllCategoriesWithDetails);
router.get("/categories-with-sub-categories", adminAuth, adminServiceController.getAllCategoriesWithDetails);
router.put("/service-category/:categoryId", adminAuth, upload.single('icon'), processFilePath, adminServiceController.updateServiceCategory);
router.delete("/service-category/:categoryId", adminAuth, adminServiceController.deleteServiceCategory);

// Sub-Category Management
router.post("/sub-category", adminAuth, upload.single('image'), processFilePath, adminController.addSubCategory);
router.put("/sub-category/:subcategoryId", adminAuth, upload.single('image'), processFilePath, adminController.updateSubCategory);
router.delete("/sub-category/:subcategoryId", adminAuth, adminController.deleteSubCategory);


// Service Management
router.post("/service", adminAuth, upload.single('icon'), processFilePath, adminServiceController.createService);
router.get("/services", adminAuth, adminServiceController.getAllServices);
router.get("/category/:categoryId/services", adminAuth, adminServiceController.getServicesByCategory);
router.put("/service/:serviceId", adminAuth, upload.single('icon'), processFilePath, adminServiceController.updateService);
router.delete("/service/:serviceId", adminAuth, adminServiceController.deleteService);

// Sub-Service Management
// router.post("/sub-service", adminAuth, upload.any(),  adminServiceController.createSubService);
router.post("/sub-service", adminAuth, upload.array("images", 4), adminServiceController.createSubService);
router.post("/service/:serviceId/sub-service", adminAuth,  upload.array("images", 4), adminServiceController.addSubService);
router.put("/service/:serviceId/sub-service/:subServiceId", adminAuth,   upload.array("images", 4), adminServiceController.updateSubService);
router.delete("/service/:serviceId/sub-service/:subServiceId", adminAuth, adminServiceController.deleteSubService);
router.post("/service/:serviceId/sub-service/create", adminAuth, upload.single('icon'), processFilePath, adminServiceController.createSubService);

// Service Analytics
router.get("/services/:categoryId/analytics", adminAuth, adminServiceController.getServiceAnalytics);

// Booking Management
router.get("/users/:userId/bookings", adminAuth, adminController.getUserBookings);
router.put("/bookings/:bookingId/complete", adminAuth, adminController.completeBooking);
// router.post("/book-subservice", adminAuth, userServiceController.bookSubService);

// Banner Management
router.post("/banners", adminAuth, upload.single('image'), processFilePath, bannerController.uploadBanner);
router.get("/banners", adminAuth, bannerController.getAllBanners);
router.put("/banners/:bannerId", adminAuth, upload.single('image'), processFilePath, bannerController.updateBanner);
router.delete("/banners/:bannerId", adminAuth, bannerController.deleteBanner);

// Review Management
router.get("/reviews", adminAuth, adminController.getAllReviews);
// Update review status
router.put("/reviews/:reviewId/status", adminAuth, adminController.updateReviewStatus);

// Settings management
router.get("/settings", adminAuth, adminSettingsController.getAllSettings);
router.put("/settings", adminAuth, adminSettingsController.updateSettings);
router.get("/settings/commission", adminAuth, adminSettingsController.getCommissionGuidelines);
router.put("/settings/commission", adminAuth, adminSettingsController.updateCommissionGuidelines);
router.get("/settings/support", adminAuth, adminSettingsController.getSupportSettings); 
router.put("/settings/support", adminAuth, adminSettingsController.updateSupportSettings);

// Reports and analytics
router.get("/reports/revenue", adminAuth, adminReportController.getRevenueAnalytics);
router.get("/reports/partners/performance", adminAuth, adminReportController.getPartnerPerformance);
router.get("/reports/users", adminAuth, adminReportController.getUserAnalytics);
router.get("/reports/transactions", adminAuth, adminReportController.getTransactionReport);

// Get all categories with sub-categories, services, and sub-services
router.get("/categories", adminAuth, adminServiceController.getAllCategoriesWithDetails);




// Admin Routes
router.post('/products', upload.single('image'),adminAuth, adminServiceController.addProduct); // Add product
router.get('/products',adminAuth, adminServiceController.getAllProducts); // Get all products
router.put('/products/:id', upload.single('image'),adminAuth,  adminServiceController.updateProduct); // Update product
router.delete('/products/:id', adminAuth, adminServiceController.deleteProduct); // Delete product


//change the status of partner 
router.put('/partner/:partnerId/status', adminAuth, adminServiceController.updatePartnerStatus);

module.exports = router;
