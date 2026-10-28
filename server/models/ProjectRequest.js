
const mongoose = require("mongoose");

const projectRequestSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },

    projectTitle: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    budget: {
      type: Number,
      min: 0,
      required: true,
    },

    // Date of the client's event or booking
    bookingDate: {
      type: Date,
      required: true,
    },

    // Estimated delivery date calculated from the service delivery time
    expectedDeliveryDate: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "Pending",
        "Accepted",
        "Rejected",
        "In Progress",
        "Completed",
        "Cancelled",
      ],
      default: "Pending",
    },

    rejectionReason: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "ProjectRequest",
  projectRequestSchema
);
