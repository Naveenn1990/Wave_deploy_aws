const express = require('express');
const router = express.Router();
const userBannerController = require('../controllers/userBannerController');

// Get active promotional banners
router.get('/promotional', userBannerController.getActivePromotionalBanners);

// Get active company banners
router.get('/company', userBannerController.getActiveCompanyBanners);

module.exports = router;
