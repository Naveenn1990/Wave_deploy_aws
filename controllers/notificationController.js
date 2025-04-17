const User = require('../models/User');
const Admin = require('../models/admin');
const admin = require('../config/firebase');
const callTimers = new Map();

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

const initiateCall = async (req, res) => {
  const { callerId, receiverId, callId } = req.body;

  try {
    // Validate caller authentication
    if (req.user.id !== callerId) {
      return res.status(403).json({ success: false, message: 'Unauthorized caller' });
    }

    // Fetch receiver's FCM token from MongoDB
    const isReceiverAdmin = req.body.isReceiverAdmin || false;
    let receiver;
    if (isReceiverAdmin) {
      receiver = await Admin.findById(receiverId);
    } else {
      receiver = await User.findById(receiverId);
    }

    if (!receiver || !receiver.fcmToken) {
      return res.status(404).json({ success: false, message: 'Receiver not found or has no FCM token' });
    }

    // Initialize call in Firestore
    const startTime = Date.now();
    await admin.firestore().collection('calls').doc(callId).set({
      callerId,
      receiverId,
      startTime,
      duration: 0,
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Start timer to update duration
    const timer = setInterval(async () => {
      const callDoc = await admin.firestore().collection('calls').doc(callId).get();
      if (!callDoc.exists || callDoc.data().status !== 'active') {
        clearInterval(timer);
        callTimers.delete(callId);
        return;
      }

      const currentDuration = Math.floor((Date.now() - startTime) / 1000); // Duration in seconds
      await admin.firestore().collection('calls').doc(callId).update({
        duration: currentDuration
      });
    }, 1000);

    callTimers.set(callId, timer);

    // Send FCM notification to receiver
    const message = {
      notification: {
        title: 'Incoming Call',
        body: `Call from ${callerId}`
      },
      data: {
        callId,
        callerId,
        type: 'incoming_call'
      },
      token: receiver.fcmToken
    };

    await admin.messaging().send(message);

    res.status(200).json({ success: true, message: 'Call initiated and notification sent' });
  } catch (error) {
    console.error('Error initiating call:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const endCall = async (req, res) => {
  const { callId } = req.body;

  try {
    const callDoc = await admin.firestore().collection('calls').doc(callId).get();
    if (!callDoc.exists) {
      return res.status(404).json({ success: false, message: 'Call not found' });
    }

    const callData = callDoc.data();
    if (req.user.id !== callData.callerId && req.user.id !== callData.receiverId) {
      return res.status(403).json({ success: false, message: 'Unauthorized to end this call' });
    }

    // Stop timer
    const timer = callTimers.get(callId);
    if (timer) {
      clearInterval(timer);
      callTimers.delete(callId);
    }

    // Finalize duration and update call status
    const finalDuration = Math.floor((Date.now() - callData.startTime) / 1000);
    await admin.firestore().collection('calls').doc(callId).update({
      status: 'ended',
      duration: finalDuration,
      endTime: admin.firestore.FieldValue.serverTimestamp()
    });

    // Notify both users
    const users = await Promise.all([
      callData.callerId.startsWith('admin') 
        ? Admin.findById(callData.callerId)
        : User.findById(callData.callerId),
      callData.receiverId.startsWith('admin') 
        ? Admin.findById(callData.receiverId)
        : User.findById(callData.receiverId)
    ]);

    const notifications = users
      .filter(user => user && user.fcmToken)
      .map(user => ({
        notification: {
          title: 'Call Ended',
          body: `Call duration: ${finalDuration} seconds`
        },
        data: {
          callId,
          type: 'call_ended'
        },
        token: user.fcmToken
      }));

    await Promise.all(notifications.map(msg => admin.messaging().send(msg)));

    res.status(200).json({ 
      success: true, 
      message: 'Call ended', 
      duration: finalDuration 
    });
  } catch (error) {
    console.error('Error ending call:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  updateFCMToken,
  getNotifications,
  markNotificationsAsRead,
  markNotificationAsRead,
  sendTestNotification,
  initiateCall,
  endCall
};