const mongoose = require("mongoose");
const admin = require("firebase-admin");
const Partner = require("./Partner");
const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User", // Ensure user reference is correct
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
      enum: ["info", "alert", "message"],
      default: "info",
    },
  },
  { timestamps: true }
);

// Post-save hook for real-time updates
notificationSchema.post("save", async function (doc) {
  const userIdString = doc.userId.toString();
  // io.to(userIdString).emit("new-notification", doc, (response) => {
  //   console.log("Acknowledgment from client:", response);
  //   if (response && response.userId) {
  //     console.log("User ID from client:", response.userId);
  //   } else {
  //     console.log("No acknowledgment received from client", userIdString);
  //   }
  // });
  let partner = await Partner.findById(userIdString);
  if (partner?.fcmtoken) {
    const userMessage = {
      notification: {
        title: doc.title,
        body: doc.message,
      },
      data: {
        type: doc.title,
        title: doc.title,
        body: doc.message,
        timestamp: new Date().toISOString(),
        // partnerName: partner.name
      },
      token: partner.fcmtoken,
      android: {
        priority: "high",
        ttl: 60 * 60 * 24, // 24 hours retention
      },
      apns: {
        payload: {
          aps: {
            contentAvailable: true,
          },
        },
        headers: {
          "apns-priority": "5",
        },
      },
    };
    console.log("send message");

    await admin.messaging().send(userMessage);
  }
});

module.exports = mongoose.model("Notification", notificationSchema);
