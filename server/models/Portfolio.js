
const mongoose = require("mongoose");

const portfolioSchema = new mongoose.Schema(
  {
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    externalLinks: [
      {
        platform: {
          type: String,
          enum: [
            "Behance",
            "GitHub",
            "Instagram",
            "Website",
            "YouTube",
            "LinkedIn",
            "Other",
          ],
          required: true,
        },

        url: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Portfolio", portfolioSchema);
