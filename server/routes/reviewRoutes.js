
const express = require("express");

const {
  createReview,
  getCreatorReviews,
} = require("../controllers/reviewController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Client submits a review
router.post("/", authMiddleware, createReview);

// Get reviews for a creator
router.get("/creator/:creatorId", authMiddleware, getCreatorReviews);

module.exports = router;
