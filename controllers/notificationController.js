const User = require('../models/User');
const Admin = require('../models/admin');
const admin = require('../config/firebase');

const updateFCMToken = async (req, res) => {
  try {
    const { fcmToken, isAdmin } = req.body;
    const userId = req.user.id;

    if (isAdmin) {
      await Admin.findByIdAndUpdate(userId, { fcmToken });
    } else {
      await User.findByIdAndUpdate(userId, { fcmToken });
    }

    res.status(200).json({ success: true, message: 'FCM token updated' });
  } catch (error) {
    console.error('Error updating FCM token:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    let user;
    if (isAdmin) {
      user = await Admin.findById(userId).select('notifications');
    } else {
      user = await User.findById(userId).select('notifications');
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const sortedNotifications = user.notifications.sort(
      (a, b) => b.date - a.date
    );

    res.status(200).json({ success: true, notifications: sortedNotifications });
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const markNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (isAdmin) {
      await Admin.findByIdAndUpdate(userId, {
        $set: { 'notifications.$[].seen': true }
      });
    } else {
      await User.findByIdAndUpdate(userId, {
        $set: { 'notifications.$[].seen': true }
      });
    }

    res.status(200).json({ success: true, message: 'Notifications marked as read' });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const markNotificationAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;
    const isAdmin = req.user.role === 'admin';

    if (isAdmin) {
      await Admin.findOneAndUpdate(
        { _id: userId, 'notifications._id': notificationId },
        { $set: { 'notifications.$.seen': true } }
      );
    } else {
      await User.findOneAndUpdate(
        { _id: userId, 'notifications._id': notificationId },
        { $set: { 'notifications.$.seen': true } }
      );
    }

    res.status(200).json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const sendTestNotification = async (req, res) => {
  try {
    const { userId, isAdmin } = req.body;
    const senderId = req.user.id;

    let user;
    if (isAdmin) {
      user = await Admin.findById(userId);
    } else {
      user = await User.findById(userId);
    }

    if (!user || !user.fcmToken) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found or has no FCM token' 
      });
    }

    const message = {
      notification: {
        title: 'Test Notification',
        body: 'This is a test notification from the server'
      },
      data: {
        type: 'test_notification',
        senderId: senderId.toString()
      },
      token: user.fcmToken
    };

    await admin.messaging().send(message);

    res.status(200).json({ success: true, message: 'Test notification sent' });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};



module.exports = {
  updateFCMToken,
  getNotifications,
  markNotificationsAsRead,
  markNotificationAsRead,
  sendTestNotification
};