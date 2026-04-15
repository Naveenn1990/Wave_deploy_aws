const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/bannerController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { adminAuth } = require('../middleware/adminAuth');

/**
 * @swagger
 * tags:
 *   name: Banners
 *   description: Banner management endpoints
 */

// Create uploads/banners directory if it doesn't exist
const uploadDir = path.join(__dirname, '..', 'uploads', 'banners');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer specifically for banners
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
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

const bannerUpload = multer({
  
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
}).single('bannerImage');

/**
 * @swagger
 * /api/banners/active:
 *   get:
 *     summary: Get all active banners
 *     tags: [Banners]
 *     responses:
 *       200:
 *         description: List of active banners retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/active', bannerController.getActiveBanners);

/**
 * @swagger
 * /api/banners:
 *   post:
 *     summary: Upload a new banner
 *     tags: [Banners]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - bannerImage
 *               - title
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
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', adminAuth, (req, res, next) => {
    bannerUpload(req, res, (err) => {
        if (err) {
            return res.status(400).json({ 
                success: false, 
                message: err.message || 'Error uploading banner'
            });
        }
        next();
    });
}, bannerController.uploadBanner);

/**
 * @swagger
 * /api/banners:
 *   get:
 *     summary: Get all banners
 *     tags: [Banners]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of banners retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', adminAuth, bannerController.getAllBanners);

/**
 * @swagger
 * /api/banners/{bannerId}:
 *   put:
 *     summary: Update a banner
 *     tags: [Banners]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bannerId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the banner to update
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
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
 *       200:
 *         description: Banner updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Banner not found
 *       500:
 *         description: Server error
 */
router.put('/:id', adminAuth, (req, res, next) => {
    bannerUpload(req, res, (err) => {
        if (err) {
            return res.status(400).json({ 
                success: false, 
                message: err.message || 'Error uploading banner'
            });
        }
        next();
    });
}, bannerController.updateBanner);

/**
 * @swagger
 * /api/banners/{bannerId}:
 *   delete:
 *     summary: Delete a banner
 *     tags: [Banners]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bannerId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the banner to delete
 *     responses:
 *       200:
 *         description: Banner deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Banner not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', adminAuth, bannerController.deleteBanner);

module.exports = router;
