const express = require('express');
const router = express.Router(); 
const { adminAuth } = require("../middleware/adminAuth");
const notificationController = require('../controllers/notificationController');

// Update FCM token
router.post('/token', adminAuth, notificationController.updateFCMToken);

// Get notifications
router.get('/', adminAuth, notificationController.getNotifications);

// Mark notifications as read
router.put('/mark-read', adminAuth, notificationController.markNotificationsAsRead);

// Mark single notification as read
router.put('/:id/mark-read', adminAuth, notificationController.markNotificationAsRead);

// Test notification (admin only)
router.post('/test', adminAuth, notificationController.sendTestNotification);

module.exports = router;