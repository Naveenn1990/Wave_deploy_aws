const express = require('express');
const router = express.Router();
const {
  createNotification,
  getUserNotifications,
  markAsRead
} = require('../controllers/notificationController');

router.post('/', createNotification);
router.get('/:userId', getUserNotifications);
router.patch('/:id/read', markAsRead);

module.exports = router;