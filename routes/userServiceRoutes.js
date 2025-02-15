const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/userAuth");
const userServiceController = require("../controllers/userServiceController");
const {
  createBooking,
  getUserBookings,
  getBookingDetails,
  updateBooking,
  cancelBooking,
  addReview,
  getAllBookings
} = require("../controllers/bookingController");
const {
  addToCart,
  getCart,
  removeFromCart,
  updateCartItem,
  clearCart,
} = require("../controllers/cartController");

/**
 * @swagger
 * tags:
 *   name: User Services
 *   description: Service browsing and cart management endpoints for users
 */

/**
 * @swagger
 * /api/user/service-hierarchy:
 *   get:
 *     summary: Get complete service hierarchy
 *     tags: [User Services]
 *     responses:
 *       200:
 *         description: Service hierarchy retrieved successfully
 *       500:
 *         description: Server error
 */
router.get("/service-hierarchy", userServiceController.getServiceHierarchy);

/**
 * @swagger
 * /api/user/all-services:
 *   get:
 *     summary: Get all services (debug endpoint)
 *     tags: [User Services]
 *     responses:
 *       200:
 *         description: All services retrieved successfully
 *       500:
 *         description: Server error
 */
router.get("/all-services", userServiceController.getAllServices);

/**
 * @swagger
 * /api/user/categories:
 *   get:
 *     summary: Get all service categories
 *     tags: [User Services]
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *       500:
 *         description: Server error
 */
router.get("/categories", userServiceController.getCategories);

/**
 * @swagger
 * /api/user/category/{categoryId}/services:
 *   get:
 *     summary: Get services by category
 *     tags: [User Services]
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the category
 *     responses:
 *       200:
 *         description: Services retrieved successfully
 *       404:
 *         description: Category not found
 *       500:
 *         description: Server error
 */
router.get(
  "/category/:categoryId/services",
  userServiceController.getCategoryServices
);

/**
 * @swagger
 * /api/user/service/{serviceId}:
 *   get:
 *     summary: Get service details
 *     tags: [User Services]
 *     parameters:
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the service
 *     responses:
 *       200:
 *         description: Service details retrieved successfully
 *       404:
 *         description: Service not found
 *       500:
 *         description: Server error
 */
router.get("/service/:serviceId", userServiceController.getServiceDetails);

/**
 * @swagger
 * /api/user/search:
 *   get:
 *     summary: Search services
 *     tags: [User Services]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *       500:
 *         description: Server error
 */
router.get("/search", userServiceController.searchServices);

/**
 * @swagger
 * /api/user/popular:
 *   get:
 *     summary: Get popular services
 *     tags: [User Services]
 *     responses:
 *       200:
 *         description: Popular services retrieved successfully
 *       500:
 *         description: Server error
 */
router.get("/popular", userServiceController.getPopularServices);

// Cart routes
/**
 * @swagger
 * /api/user/cart:
 *   post:
 *     summary: Add item to cart
 *     tags: [User Services]
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
 *               - quantity
 *             properties:
 *               serviceId:
 *                 type: string
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *     responses:
 *       201:
 *         description: Item added to cart successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/cart", auth, addToCart);

/**
 * @swagger
 * /api/user/cart:
 *   get:
 *     summary: Get user's cart
 *     tags: [User Services]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Cart retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/cart", auth, getCart);

/**
 * @swagger
 * /api/user/cart/{itemId}:
 *   put:
 *     summary: Update cart item quantity
 *     tags: [User Services]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the cart item
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *     responses:
 *       200:
 *         description: Cart item updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Cart item not found
 *       500:
 *         description: Server error
 */
router.put("/cart/:itemId", auth, updateCartItem);

/**
 * @swagger
 * /api/user/cart/{itemId}:
 *   delete:
 *     summary: Remove item from cart
 *     tags: [User Services]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the cart item
 *     responses:
 *       200:
 *         description: Item removed from cart successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Cart item not found
 *       500:
 *         description: Server error
 */
router.delete("/cart/:itemId", auth, removeFromCart);

/**
 * @swagger
 * /api/user/cart:
 *   delete:
 *     summary: Clear cart
 *     tags: [User Services]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.delete("/cart", auth, clearCart);

// User Booking routes
router.post("/bookings", auth, createBooking);
router.get("/bookings", auth, getUserBookings);
router.get("/bookings/:bookingId", auth, getBookingDetails);
router.put("/bookings/:bookingId", auth, updateBooking);
router.put("/bookings/:bookingId/cancel", auth, cancelBooking);
router.post("/bookings/:bookingId/review", auth, addReview);

module.exports = router;
