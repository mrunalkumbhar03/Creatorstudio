const express = require("express");

const {
  createCreatorProfile,
  getMyCreatorProfile,
  updateCreatorProfile,
  deleteCreatorProfile,
} = require("../controllers/creatorProfileController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Create creator profile
router.post(
  "/",
  authMiddleware,
  createCreatorProfile
);

// Get my creator profile
router.get(
  "/me",
  authMiddleware,
  getMyCreatorProfile
);

// Update my creator profile
router.put(
  "/me",
  authMiddleware,
  updateCreatorProfile
);

// Delete my creator profile
router.delete(
  "/me",
  authMiddleware,
  deleteCreatorProfile
);

module.exports = router;