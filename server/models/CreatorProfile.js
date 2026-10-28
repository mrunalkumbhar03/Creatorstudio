const mongoose = require("mongoose");

const creatorProfileSchema = new mongoose.Schema(
  {
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    bio: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    category: {
      type: String,
      enum: [
        "Photographer",
        "Videographer",
        "Graphic Designer",
        "Video Editor",
        "UI/UX Designer",
        "Illustrator",
        "Other",
      ],
      required: true,
    },

    experience: {
      type: Number,
      min: 0,
      default: 0,
    },

    startingPrice: {
      type: Number,
      min: 0,
      default: 0,
    },

    availability: {
      type: String,
      enum: ["Available", "Busy", "Unavailable"],
      default: "Available",
    },
// Maximum editing projects handled at one time
editingCapacity: {
  type: Number,
  min: 1,
  default: 2,
},

// Maximum editing projects completed per day
dailyEditingCapacity: {
  type: Number,
  min: 1,
  default: 1,
},
    location: {
      type: String,
      trim: true,
      default: "",
    },

    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },

    totalReviews: {
      type: Number,
      default: 0,
    },
    whatsappNumber: {
  type: String,
  trim: true,
  default: ""
},
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "CreatorProfile",
  creatorProfileSchema
);