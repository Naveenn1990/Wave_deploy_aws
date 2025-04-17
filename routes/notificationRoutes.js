const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');

// @route   POST /api/notifications/token
// @desc    Update FCM token for a user
// @access  Private
router.post('/token', authMiddleware, notificationController.updateFCMToken);

// @route   GET /api/notifications
// @desc    Get all notifications for a user
// @access  Private
router.get('/', authMiddleware, notificationController.getNotifications);

// @route   PUT /api/notifications/mark-read
// @desc    Mark notifications as read
// @access  Private
router.put('/mark-read', authMiddleware, notificationController.markNotificationsAsRead);

// @route   PUT /api/notifications/:id/mark-read
// @desc    Mark a single notification as read
// @access  Private
router.put('/:id/mark-read', authMiddleware, notificationController.markNotificationAsRead);

// @route   POST /api/notifications/test
// @desc    Send a test notification (admin only)
// @access  Private (Admin)
router.post('/test', authMiddleware, notificationController.sendTestNotification);

router.post("/initiate-call",authMiddleware,notificationController.initiateCall);
router.post("/end-call",authMiddleware,notificationController.endCall);
// router.post("/initiate-call",notificationController.initiateCall);


module.exports = router;