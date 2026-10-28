
const Review = require("../models/Review");
const ProjectRequest = require("../models/ProjectRequest");

// CREATE REVIEW
const createReview = async (req, res) => {
  try {
    if (req.user.role !== "client") {
      return res.status(403).json({
        success: false,
        message: "Only clients can submit reviews",
      });
    }

    const { projectRequestId, rating, comment } = req.body || {};

    if (!projectRequestId || rating === undefined) {
      return res.status(400).json({
        success: false,
        message: "Project request ID and rating are required",
      });
    }

    const numericRating = Number(rating);

    if (
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return res.status(400).json({
        success: false,
        message: "Rating must be a whole number from 1 to 5",
      });
    }

    const projectRequest = await ProjectRequest.findOne({
      _id: projectRequestId,
      clientId: req.user.userId,
    });

    if (!projectRequest) {
      return res.status(404).json({
        success: false,
        message: "Project request not found",
      });
    }

    if (projectRequest.status !== "Completed") {
      return res.status(400).json({
        success: false,
        message: "You can review only completed projects",
      });
    }

    const existingReview = await Review.findOne({
      projectRequestId,
    });

    if (existingReview) {
      return res.status(409).json({
        success: false,
        message: "You have already reviewed this project",
      });
    }

    const review = await Review.create({
      projectRequestId,
      clientId: req.user.userId,
      creatorId: projectRequest.creatorId,
      rating: numericRating,
      comment,
    });

    // Update the creator's average rating and review count
    const reviews = await Review.find({
      creatorId: projectRequest.creatorId,
    });

    const totalReviews = reviews.length;
    const averageRating =
      reviews.reduce((sum, item) => sum + item.rating, 0) /
      totalReviews;

    const CreatorProfile = require("../models/CreatorProfile");

    await CreatorProfile.findOneAndUpdate(
      { creatorId: projectRequest.creatorId },
      {
        rating: Number(averageRating.toFixed(1)),
        totalReviews,
      }
    );

    res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      review,
    });
  } catch (error) {
    console.error("Create review error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while submitting review",
    });
  }
};

// GET REVIEWS FOR A CREATOR
const getCreatorReviews = async (req, res) => {
  try {
    const reviews = await Review.find({
      creatorId: req.params.creatorId,
    })
      .populate("clientId", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    console.error("Get reviews error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching reviews",
    });
  }
};

module.exports = {
  createReview,
  getCreatorReviews,
};
