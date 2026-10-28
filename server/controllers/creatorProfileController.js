const CreatorProfile = require("../models/CreatorProfile");
const User = require("../models/User");

// CREATE PROFILE
const createCreatorProfile = async (req, res) => {
  try {
    // Only creators can create creator profiles
    if (req.user.role !== "creator") {
      return res.status(403).json({
        success: false,
        message: "Only creators can create a creator profile",
      });
    }

    const {
  bio,
  category,
  experience,
  startingPrice,
  availability,
  location,
  editingCapacity,
  dailyEditingCapacity,
} = req.body;

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Category is required",
      });
    }

    // Check if profile already exists
    const existingProfile = await CreatorProfile.findOne({
      creatorId: req.user.userId,
    });

    if (existingProfile) {
      return res.status(400).json({
        success: false,
        message: "Creator profile already exists",
      });
    }

    const profile = await CreatorProfile.create({
      creatorId: req.user.userId,
      bio,
      category,
      experience,
      startingPrice,
      availability,
      location,
      editingCapacity,
      dailyEditingCapacity,
    });

    res.status(201).json({
      success: true,
      message: "Creator profile created successfully",
      profile,
    });
  } catch (error) {
    console.error("Create profile error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while creating profile",
    });
  }
};

// GET MY PROFILE
const getMyCreatorProfile = async (req, res) => {
  try {
    const profile = await CreatorProfile.findOne({
      creatorId: req.user.userId,
    }).populate("creatorId", "name email profileImage");

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Creator profile not found",
      });
    }

    res.status(200).json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error("Get profile error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching profile",
    });
  }
};

// UPDATE PROFILE
const updateCreatorProfile = async (req, res) => {
  try {
    
const allowedFields = [
  "bio",
  "category",
  "experience",
  "startingPrice",
  "availability",
  "location",
  "editingCapacity",
  "dailyEditingCapacity",
  "whatsappNumber",
];

    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const profile = await CreatorProfile.findOneAndUpdate(
      {
        creatorId: req.user.userId,
      },
      updates,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Creator profile not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Creator profile updated successfully",
      profile,
    });
  } catch (error) {
    console.error("Update profile error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while updating profile",
    });
  }
};

// DELETE PROFILE
const deleteCreatorProfile = async (req, res) => {
  try {
    const profile = await CreatorProfile.findOneAndDelete({
      creatorId: req.user.userId,
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Creator profile not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Creator profile deleted successfully",
    });
  } catch (error) {
    console.error("Delete profile error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while deleting profile",
    });
  }
};

module.exports = {
  createCreatorProfile,
  getMyCreatorProfile,
  updateCreatorProfile,
  deleteCreatorProfile,
};