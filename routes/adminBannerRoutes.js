const express = require('express');
const router = express.Router();
const adminBannerController = require('../controllers/adminBannerController');
const { adminAuth } = require('../middleware/adminAuth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * @swagger
 * tags:
 *   name: Admin Banners
 *   description: Banner management endpoints for admin
 */

// Create upload directories if they don't exist
const promotionalBannerDir = path.join(__dirname, '..', 'uploads', 'promotional-banners');
const companyBannerDir = path.join(__dirname, '..', 'uploads', 'company-banners');

[promotionalBannerDir, companyBannerDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Configure multer for promotional banners
const promotionalBannerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, promotionalBannerDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// Configure multer for company banners
const companyBannerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, companyBannerDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Not an image! Please upload an image file.'), false);
    }
};

const promotionalBannerUpload = multer({

    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
}).single('bannerImage');

const companyBannerUpload = multer({
    
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
}).single('bannerImage');

/**
 * @swagger
 * /api/admin/banners/promotional:
 *   post:
 *     summary: Upload a new promotional banner
 *     tags: [Admin Banners]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - bannerImage
 *               - title
 *               - description
 *               - startDate
 *               - endDate
 *             properties:
 *               bannerImage:
 *                 type: string
 *                 format: binary
 *                 description: Banner image file
 *               title:
 *                 type: string
 *                 description: Banner title
 *               description:
 *                 type: string
 *                 description: Banner description
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: Banner display start date
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: Banner display end date
 *     responses:
 *       201:
 *         description: Banner uploaded successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/promotional', adminAuth, promotionalBannerUpload, adminBannerController.uploadPromotionalBanner);

/**
 * @swagger
 * /api/admin/banners/promotional:
 *   get:
 *     summary: Get all promotional banners
 *     tags: [Admin Banners]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of promotional banners retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/promotional', adminAuth, adminBannerController.getAllPromotionalBanners);

// Company Banner Routes
/**
 * @swagger
 * /api/admin/banners/company:
 *   post:
 *     summary: Upload a new company banner
 *     tags: [Admin Banners]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - bannerImage
 *               - title
 *               - description
 *             properties:
 *               bannerImage:
 *                 type: string
 *                 format: binary
 *                 description: Banner image file
 *               title:
 *                 type: string
 *                 description: Banner title
 *               description:
 *                 type: string
 *                 description: Banner description
 *     responses:
 *       201:
 *         description: Banner uploaded successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/company', adminAuth, companyBannerUpload, adminBannerController.uploadCompanyBanner);

/**
 * @swagger
 * /api/admin/banners/company:
 *   get:
 *     summary: Get all company banners
 *     tags: [Admin Banners]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of company banners retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/company', adminAuth, adminBannerController.getAllCompanyBanners);
// router.get('/downloadfilesimages', adminBannerController.downloadfiles);
module.exports = router;
