
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    projectRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProjectRequest",
      default: null,
    },

    type: {
      type: String,
      enum: [
        "NEW_PROJECT_REQUEST",
        "REQUEST_ACCEPTED",
        "REQUEST_REJECTED",
        "PROJECT_IN_PROGRESS",
        "PROJECT_COMPLETED",
      ],
      required: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Notification", notificationSchema);
