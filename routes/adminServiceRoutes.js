const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/adminAuth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const adminBookingController = require('../controllers/adminBookingController');
const adminController = require('../controllers/adminController'); 
const { getAllSubServices } = require('../controllers/adminServiceController');
const { createOffer, editOffer, deleteOffer, getAllOffers } = require('../controllers/offerController');
const { upload, processFilePath } = require("../middleware/upload");
/**
 * @swagger
 * tags:
 *   name: Admin Services
 *   description: Service management endpoints for admin
 */

// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, 'uploads/'); // Directory where images will be stored
//     },
//     filename: (req, file, cb) => {
//         cb(null, Date.now() + path.extname(file.originalname)); // Append timestamp to filename
//     }
// });
// const upload = multer({ storage: storage }); // Initialize multer


// Create uploads directory if it doesn't exist
// const uploadDir = path.join(__dirname, '..', 'uploads');
// if (!fs.existsSync(uploadDir)) {
//     fs.mkdirSync(uploadDir, { recursive: true });
// }

// Basic multer setup
// const upload = multer({
//     dest: uploadDir,
//     limits: {
//         fileSize: 5 * 1024 * 1024 // 5MB
//     }
// }).single('icon');

// Import controllers
const {
    createCategory,
    getAllCategories,
    createService,
    getAllServices,
    createSubService,
    getServicesByCategory
} = require('../controllers/adminServiceController');

// Middleware to handle file uploads
const handleFileUpload = (req, res, next) => {
    upload(req, res, function(err) {
        // Log the entire request for debugging
        console.log('Request headers:', req.headers);
        console.log('Request body:', req.body);
        console.log('Files:', req.files);
        console.log('File:', req.file);

        if (err instanceof multer.MulterError) {
            // A Multer error occurred
            console.error('Multer error:', err);
            return res.status(400).json({
                success: false,
                message: err.message,
                code: err.code,
                field: err.field
            });
        } else if (err) {
            // An unknown error occurred
            console.error('Unknown error:', err);
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }

        // If no file was uploaded
        if (!req.file) {
            console.log('No file uploaded');
            return res.status(400).json({
                success: false,
                message: 'Please upload an icon file'
            });
        }

        console.log('Uploaded File Details:', req.file);
        console.log('File Name:', req.file.originalname);
        console.log('File Type:', req.file.mimetype);
        console.log('File Size:', req.file.size);
        console.log('File Path:', req.file.path);

        next();
    });
};

// Apply admin auth to all routes
router.use(adminAuth);

/**
 * @swagger
 * /api/admin/service-category:
 *   post:
 *     summary: Create a new service category
 *     tags: [Admin Services]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - icon
 *             properties:
 *               name:
 *                 type: string
 *                 description: Category name
 *               icon:
 *                 type: string
 *                 format: binary
 *                 description: Category icon
 *     responses:
 *       201:
 *         description: Category created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/service-category', handleFileUpload, createCategory);

/**
 * @swagger
 * /api/admin/service-categories:
 *   get:
 *     summary: Get all service categories
 *     tags: [Admin Services]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of categories retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/service-categories', getAllCategories);

/**
 * @swagger
 * /api/admin/service:
 *   post:
 *     summary: Create a new service
 *     tags: [Admin Services]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - categoryId
 *               - description
 *               - price
 *               - icon
 *             properties:
 *               name:
 *                 type: string
 *                 description: Service name
 *               categoryId:
 *                 type: string
 *                 description: Category ID
 *               description:
 *                 type: string
 *                 description: Service description
 *               price:
 *                 type: number
 *                 description: Service price
 *               icon:
 *                 type: string
 *                 format: binary
 *                 description: Service icon
 *     responses:
 *       201:
 *         description: Service created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/service', handleFileUpload, createService);

/**
 * @swagger
 * /api/admin/services:
 *   get:
 *     summary: Get all services
 *     tags: [Admin Services]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of services retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/services', getAllServices);

/**
 * @swagger
 * /api/admin/service/{serviceId}/sub-service:
 *   post:
 *     summary: Create a new sub-service
 *     tags: [Admin Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the parent service
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - price
 *               - icon
 *             properties:
 *               name:
 *                 type: string
 *                 description: Sub-service name
 *               description:
 *                 type: string
 *                 description: Sub-service description
 *               price:
 *                 type: number
 *                 description: Sub-service price
 *               icon:
 *                 type: string
 *                 format: binary
 *                 description: Sub-service icon
 *     responses:
 *       201:
 *         description: Sub-service created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Parent service not found
 *       500:
 *         description: Server error
 */
router.post('/service/:serviceId/sub-service', handleFileUpload, createSubService);

/**
 * @swagger
 * /api/admin/category/{categoryId}/services:
 *   get:
 *     summary: Get services by category
 *     tags: [Admin Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     responses:
 *       200:
 *         description: List of services retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Category not found
 *       500:
 *         description: Server error
 */
router.get('/category/:categoryId/services', getServicesByCategory);

/**
 * @swagger
 * /api/admin/services/sub-services:
 *   get:
 *     summary: Get all sub-services
 *     tags: [Admin Services]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all sub-services retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/sub-services', getAllSubServices);

// Admin Booking Management routes
router.get('/bookings', adminBookingController.getAllBookings);
// router.get('/bookings/:bookingId', adminBookingController.getBookingDetails);
// router.put('/bookings/:bookingId/status', adminBookingController.updateBookingStatus);

// const adminController = require('../controllers/adminController'); 
router.put('/user-status', adminController.updateUserStatus);


// Create Offer with image upload
router.post('/offers', upload.single('promotionalImage'), processFilePath,createOffer);


// Edit Offer
router.put('/offers/:id', upload.single('promotionalImage'), processFilePath,  editOffer);

// Delete Offer
router.delete('/offers/:id', deleteOffer);


// Fetch All Offers
router.get('/offers', getAllOffers); // New route to fetch all offers

module.exports = router;


