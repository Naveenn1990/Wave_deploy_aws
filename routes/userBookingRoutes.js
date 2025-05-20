const express = require('express');
const router = express.Router();
const { isAuthenticatedUser } = require('../middleware/auth');
const {
  createBooking,
  getUserBookings,
  getBookingById,
  getBookingsByStatus,
  getAllBookings
} = require('../controllers/bookingController');

const {driverBooking,getByUserId,}=require('../controllers/DriverBooking');
const travelBooking = require('../controllers/travelBooking');


/**
 * @swagger
 * tags:
 *   name: User Bookings
 *   description: Booking management endpoints for users
 */

/**
 * @swagger
 * /api/user/bookings:
 *   post:
 *     summary: Create a new booking
 *     tags: [User Bookings]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serviceId
 *               - date
 *               - time
 *               - address
 *             properties:
 *               serviceId:
 *                 type: string
 *                 description: ID of the service to book
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Booking date (YYYY-MM-DD)
 *               time:
 *                 type: string
 *                 description: Booking time (HH:mm)
 *               address:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   zip:
 *                     type: string
 *     responses:
 *       201:
 *         description: Booking created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/bookings', isAuthenticatedUser, createBooking);

/**
 * @swagger
 * /api/user/all-bookings:
 *   get:
 *     summary: Get all bookings without pagination
 *     tags: [User Bookings]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of all bookings retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/all-bookings', isAuthenticatedUser, getAllBookings);

/**
 * @swagger
 * /api/user/bookings:
 *   get:
 *     summary: Get all bookings for the user
 *     tags: [User Bookings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, completed, cancelled]
 *         description: Optional status filter
 *     responses:
 *       200:
 *         description: List of bookings retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/bookings', isAuthenticatedUser, getUserBookings);

/**
 * @swagger
 * /api/user/bookings/{bookingId}:
 *   get:
 *     summary: Get a specific booking by ID
 *     tags: [User Bookings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the booking to retrieve
 *     responses:
 *       200:
 *         description: Booking details retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 */
router.get('/bookings/:bookingId', isAuthenticatedUser, getBookingById);

/**
 * @swagger
 * /api/user/bookings/status/{status}:
 *   get:
 *     summary: Get bookings by status
 *     tags: [User Bookings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, completed, cancelled]
 *         description: Booking status to filter by
 *     responses:
 *       200:
 *         description: List of bookings retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/bookings/status/:status', isAuthenticatedUser, getBookingsByStatus);

router.post("/driverbooking",isAuthenticatedUser,driverBooking);
router.get("/getbookingbyuser",isAuthenticatedUser,getByUserId);

//Travel Bookings : 

// Create booking
router.post('/booktravel', isAuthenticatedUser, travelBooking.createTTBooking);
router.post('/bookdriver', isAuthenticatedUser, travelBooking.createDriverBooking);

// Get booking by ID
// router.get('/:id', isAuthenticatedUser, travelBooking.getBooking);

// Update booking status
// router.patch('/:id/status', isAuthenticatedUser, travelBooking.updateBookingStatus);

// Get user bookings
router.get('/travelbookings', isAuthenticatedUser, travelBooking.getUserTravelBookings);

module.exports = router;
