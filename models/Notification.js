const mongoose = require('mongoose');
const admin = require('firebase-admin');
const Partner = require('./PartnerModel'); // Adjust path to your Partner model

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Partner', // Changed to Partner to match partner._id
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    type: {
      type: String,
      enum: ['info', 'alert', 'message', 'job'], // Added 'job' for createNotification
      default: 'info',
    },
    skipFcm: {
      type: Boolean,
      default: false, // Flag to skip FCM in post-save hook
    },
  },
  { timestamps: true },
);

// Post-save hook for real-time FCM notifications
notificationSchema.post('save', async function (doc) {
  try {
    // Skip FCM if flag is set (e.g., createNotification already sent FCM)
    if (doc.skipFcm) {
      console.log(`Skipping FCM for notification ${doc._id} (skipFcm=true)`);
      return;
    }

    const userIdString = doc.userId.toString();
    const partner = await Partner.findById(userIdString);
    if (!partner?.fcmtoken) {
      console.log(`No FCM token for partner: ${userIdString}`);
      return;
    }

    const userMessage = {
      notification: {
        title: doc.title,
        body: doc.message.length > 100 ? doc.message.slice(0, 97) + '...' : doc.message, // Truncate to avoid size issues
      },
      data: {
        type: 'new-notification',
        userId: userIdString,
        title: doc.title,
        message: doc.message.length > 100 ? doc.message.slice(0, 97) + '...' : doc.message,
        timestamp: new Date().toISOString(),
      },
      token: partner.fcmtoken,
      "android": {
        "priority": "high",
        "ttl": 86400
      },
      "apns": {
        "payload": {
          "aps": {
            "contentAvailable": true
          }
        },
        "headers": {
          "apns-priority": "5"
        }
      }
    };

    // Validate payload size (4KB = 4096 bytes)
    const payloadString = JSON.stringify(userMessage);
    const payloadSize = Buffer.byteLength(payloadString, 'utf8');
    if (payloadSize > 4096) {
      console.error(
        `FCM payload too large for partner ${userIdString}: ${payloadSize} bytes`,
      );
      // Fallback to minimal payload
      userMessage.notification.body = userMessage.notification.body.slice(0, 50) + '...';
      userMessage.data.message = userMessage.data.message.slice(0, 50) + '...';
      const fallbackSize = Buffer.byteLength(JSON.stringify(userMessage), 'utf8');
      if (fallbackSize > 4096) {
        console.error(
          `Fallback FCM payload still too large for partner ${userIdString}: ${fallbackSize} bytes`,
        );
        return;
      }
    }

    console.log(`Sending FCM notification to partner: ${userIdString}`);
    await admin.messaging().send(userMessage);
    console.log(`FCM notification sent to partner: ${userIdString}`);
  } catch (error) {
    console.error(
      `Error in post-save hook for notification ${doc._id}:`,
      error.message,
    );
  }
});

module.exports = mongoose.model('Notification', notificationSchema);