const mongoose = require("mongoose");

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
notificationSchema.post("save", function (doc) {
  const userIdString = doc.userId.toString();
  io.to(userIdString).emit("new-notification", doc, (response) => {
    console.log("Acknowledgment from client:", response);
    if (response && response.userId) {
      console.log("User ID from client:", response.userId);
    } else {
      console.log("No acknowledgment received from client", userIdString);
    }
  });
});

module.exports = mongoose.model("Notification", notificationSchema);
