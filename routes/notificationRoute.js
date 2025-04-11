const express = require('express');
const router = express.Router(); 
const { adminAuth } = require("../middleware/adminAuth");
const { isAuthenticatedUser } = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

// Update FCM token
router.post('/token/', isAuthenticatedUser, notificationController.updateFCMToken);
// router.post('/token', adminAuth, notificationController.updateFCMToken);
// router.post('/token', adminAuth, notificationController.updateFCMToken);

// Get notifications
router.get('/', isAuthenticatedUser, notificationController.getNotifications);

// Mark notifications as read
router.put('/mark-read', isAuthenticatedUser, notificationController.markNotificationsAsRead);

// Mark single notification as read
router.put('/:id/mark-read', isAuthenticatedUser, notificationController.markNotificationAsRead);

// Test notification (admin only)
router.post('/test', isAuthenticatedUser, notificationController.sendTestNotification);

module.exports = router;