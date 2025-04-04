const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/adminAuth');
const adminBookingController = require('../controllers/adminBookingController');

/**
 * @swagger
 * /api/admin/bookings:
 *   get:
 *     summary: Get all bookings (Admin only)
 *     tags: [Admin Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all bookings
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/bookings', adminAuth, adminBookingController.getAllBookings);

// Add a test route to verify controller is loaded
router.get('/test', (req, res) => {
    // console.log('adminBookingController:', adminBookingController);
    res.json({ message: 'Test route working' });
});

module.exports = router;