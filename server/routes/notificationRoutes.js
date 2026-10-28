
const express = require("express");

const {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} = require("../controllers/notificationController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Get logged-in user's notifications
router.get("/", authMiddleware, getMyNotifications);

// Mark all notifications as read
router.patch("/read-all", authMiddleware, markAllNotificationsAsRead);

// Mark one notification as read
router.patch("/:id/read", authMiddleware, markNotificationAsRead);

module.exports = router;
