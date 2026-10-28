
const User = require("../models/User");
const ProjectRequest = require("../models/ProjectRequest");
const Service = require("../models/Service");
const Notification = require("../models/Notification");
const CreatorProfile = require("../models/CreatorProfile");
const { createWhatsAppLink } = require("../utils/whatsappHelper");

// CREATE PROJECT REQUEST
const createProjectRequest = async (req, res) => {
  try {
    if (req.user.role !== "client") {
      return res.status(403).json({
        success: false,
        message: "Only clients can send project requests",
      });
    }

    const {
      serviceId,
      projectTitle,
      description,
      budget,
      bookingDate,
    } = req.body || {};

    if (
      !serviceId ||
      !projectTitle ||
      !description ||
      budget === undefined ||
      !bookingDate
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Service, project title, description, budget and booking date are required",
      });
    }

    if (
      !Number.isFinite(Number(budget)) ||
      Number(budget) < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Budget must be a valid non-negative number",
      });
    }

    const selectedDate = new Date(bookingDate);

    if (Number.isNaN(selectedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid booking date",
      });
    }

    const requestedDate = new Date(selectedDate);
    requestedDate.setUTCHours(0, 0, 0, 0);

    const tomorrow = new Date(requestedDate);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    if (requestedDate < today) {
      return res.status(400).json({
        success: false,
        message: "Booking date cannot be in the past",
      });
    }

    const service = await Service.findById(serviceId);

    if (!service || service.status !== "Active") {
      return res.status(404).json({
        success: false,
        message: "Active service not found",
      });
    }

    if (service.creatorId.toString() === req.user.userId) {
      return res.status(400).json({
        success: false,
        message: "You cannot request your own service",
      });
    }

    // Check daily booking capacity
    const dailyLimit = Number(service.dailyBookingLimit) || 1;

    const existingBookings = await ProjectRequest.countDocuments({
      creatorId: service.creatorId,
      bookingDate: {
        $gte: requestedDate,
        $lt: tomorrow,
      },
      status: {
        $in: ["Pending", "Accepted", "In Progress"],
      },
    });

    if (existingBookings >= dailyLimit) {
      return res.status(409).json({
        success: false,
        message:
          "Daily booking capacity is full for this creator. Please select another date.",
        dailyBookingLimit: dailyLimit,
        currentBookings: existingBookings,
      });
    }

    // Calculate expected delivery date
    const deliveryTime = Number(service.deliveryTime);

    if (!Number.isFinite(deliveryTime) || deliveryTime < 1) {
      return res.status(400).json({
        success: false,
        message: "The service has an invalid delivery time",
      });
    }

    const expectedDeliveryDate = new Date(requestedDate);
    expectedDeliveryDate.setUTCDate(
      expectedDeliveryDate.getUTCDate() + deliveryTime
    );

    // Check creator's editing workload
    const creatorProfile = await CreatorProfile.findOne({
      creatorId: service.creatorId,
    });

    if (creatorProfile) {
      const editingCapacity =
        Number(creatorProfile.editingCapacity) || 2;

      const dailyEditingCapacity =
        Number(creatorProfile.dailyEditingCapacity) || 1;

      const activeStatuses = [
        "Pending",
        "Accepted",
        "In Progress",
      ];

      const overlappingProjects =
        await ProjectRequest.countDocuments({
          creatorId: service.creatorId,
          bookingDate: {
            $lte: expectedDeliveryDate,
          },
          expectedDeliveryDate: {
            $gte: requestedDate,
          },
          status: {
            $in: activeStatuses,
          },
        });

      if (overlappingProjects >= editingCapacity) {
        return res.status(409).json({
          success: false,
          message:
            "Creator's overall editing workload is full for this period. Please choose another date or creator.",
          editingCapacity,
          overlappingProjects,
          requestedBookingDate: requestedDate,
          requestedDeliveryDate: expectedDeliveryDate,
        });
      }

      // Check workload for every day in the project period
      for (
        let day = new Date(requestedDate);
        day <= expectedDeliveryDate;
        day.setUTCDate(day.getUTCDate() + 1)
      ) {
        const dayStart = new Date(day);
        dayStart.setUTCHours(0, 0, 0, 0);

        const dayEnd = new Date(dayStart);
        dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

        const projectsOnDay =
          await ProjectRequest.countDocuments({
            creatorId: service.creatorId,
            bookingDate: {
              $lt: dayEnd,
            },
            expectedDeliveryDate: {
              $gte: dayStart,
            },
            status: {
              $in: activeStatuses,
            },
          });

        if (projectsOnDay >= dailyEditingCapacity) {
          return res.status(409).json({
            success: false,
            message:
              "Creator's daily editing capacity is full during this project period. Please select another date.",
            dailyEditingCapacity,
            currentProjects: projectsOnDay,
            conflictingDate: dayStart.toISOString().slice(0, 10),
          });
        }
      }
    }

    // Create project request
    const projectRequest = await ProjectRequest.create({
      clientId: req.user.userId,
      creatorId: service.creatorId,
      serviceId: service._id,
      projectTitle: projectTitle.trim(),
      description: description.trim(),
      budget: Number(budget),
      bookingDate: requestedDate,
      expectedDeliveryDate,
    });

    // Notify creator about the new request
    await Notification.create({
      recipientId: service.creatorId,
      senderId: req.user.userId,
      projectRequestId: projectRequest._id,
      type: "NEW_PROJECT_REQUEST",
      message:
        `You received a new project request: ${projectRequest.projectTitle}. ` +
        `Booking date: ${requestedDate.toLocaleDateString("en-IN", {
          timeZone: "UTC",
        })}.`,
    });

    return res.status(201).json({
      success: true,
      message: "Project request sent successfully",
      projectRequest,
    });
  } catch (error) {
    console.error("Create project request error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while creating project request",
    });
  }
};

// GET MY SENT REQUESTS (CLIENT)
const getMySentRequests = async (req, res) => {
  try {
    const requests = await ProjectRequest.find({
      clientId: req.user.userId,
    })
      .populate("creatorId", "name email")
      .populate("serviceId", "title price")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    console.error("Get sent requests error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching sent requests",
    });
  }
};

// GET REQUESTS RECEIVED (CREATOR)
const getMyReceivedRequests = async (req, res) => {
  try {
    if (req.user.role !== "creator") {
      return res.status(403).json({
        success: false,
        message: "Only creators can view received requests",
      });
    }

    const requests = await ProjectRequest.find({
      creatorId: req.user.userId,
    })
      .populate("clientId", "name email")
      .populate("serviceId", "title price")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    console.error("Get received requests error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching received requests",
    });
  }
};

// UPDATE PROJECT REQUEST STATUS
const updateProjectRequestStatus = async (req, res) => {
  try {
    if (req.user.role !== "creator") {
      return res.status(403).json({
        success: false,
        message: "Only creators can update project requests",
      });
    }

    const { status, rejectionReason } = req.body || {};

    const allowedStatuses = [
      "Accepted",
      "Rejected",
      "In Progress",
      "Completed",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project status",
      });
    }

    // Validate rejection reason
    if (status === "Rejected") {
      if (
        typeof rejectionReason !== "string" ||
        !rejectionReason.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Please provide a reason for rejection",
        });
      }

      if (rejectionReason.trim().length > 500) {
        return res.status(400).json({
          success: false,
          message: "Rejection reason cannot exceed 500 characters",
        });
      }
    }

    const projectRequest = await ProjectRequest.findOne({
      _id: req.params.id,
      creatorId: req.user.userId,
    });

    if (!projectRequest) {
      return res.status(404).json({
        success: false,
        message: "Project request not found",
      });
    }

    if (
      ["Rejected", "Completed", "Cancelled"].includes(
        projectRequest.status
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "This project request can no longer be updated",
      });
    }

    // Validate status transitions
    if (
      status === "Accepted" &&
      projectRequest.status !== "Pending"
    ) {
      return res.status(400).json({
        success: false,
        message: "Only pending requests can be accepted",
      });
    }

    if (
      status === "Rejected" &&
      projectRequest.status !== "Pending"
    ) {
      return res.status(400).json({
        success: false,
        message: "Only pending requests can be rejected",
      });
    }

    if (
      status === "In Progress" &&
      projectRequest.status !== "Accepted"
    ) {
      return res.status(400).json({
        success: false,
        message: "Accept the request before starting the project",
      });
    }

    if (
      status === "Completed" &&
      projectRequest.status !== "In Progress"
    ) {
      return res.status(400).json({
        success: false,
        message: "Only in-progress projects can be completed",
      });
    }

    projectRequest.status = status;
    projectRequest.rejectionReason =
      status === "Rejected" ? rejectionReason.trim() : "";

    await projectRequest.save();

    // Include the project title and rejection reason in notifications
    const notificationMessages = {
      Accepted:
        `Good news! Your project "${projectRequest.projectTitle}" ` +
        "has been accepted by the creator.",

      Rejected:
        `Your project "${projectRequest.projectTitle}" was rejected. ` +
        `Reason: ${projectRequest.rejectionReason}`,

      "In Progress":
        `Your project "${projectRequest.projectTitle}" is now in progress.`,

      Completed:
        `Your project "${projectRequest.projectTitle}" has been completed.`,
    };

    const notificationTypes = {
      Accepted: "REQUEST_ACCEPTED",
      Rejected: "REQUEST_REJECTED",
      "In Progress": "PROJECT_IN_PROGRESS",
      Completed: "PROJECT_COMPLETED",
    };

    await Notification.create({
      recipientId: projectRequest.clientId,
      senderId: req.user.userId,
      projectRequestId: projectRequest._id,
      type: notificationTypes[status],
      message: notificationMessages[status],
    });

    
    // Create WhatsApp Click-to-Chat link when booking is accepted
    let whatsappLink = null;

    if (status === "Accepted") {
      const creator = await User.findById(req.user.userId)
        .select("name phone");

      const client = await User.findById(projectRequest.clientId)
        .select("name phone");

      const creatorName = creator?.name || "Your creator";

      const bookingDate = projectRequest.bookingDate
        ? new Date(projectRequest.bookingDate).toLocaleDateString(
            "en-IN",
            { timeZone: "UTC" }
          )
        : "Not specified";

      const message =
        `Hello ${client?.name || "there"}! ` +
        `Your booking for "${projectRequest.projectTitle}" ` +
        `has been accepted by ${creatorName}. ` +
        `Booking date: ${bookingDate}. ` +
        "We look forward to working with you!";

      // Open the client's chat using the accepted creator's action.
      // The sender must use their own WhatsApp account/device.
      if (client?.phone) {
        whatsappLink = createWhatsAppLink(
          client.phone,
          message
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: `Project status updated to ${status}`,
      projectRequest,
      whatsappLink,
    });
  } catch (error) {
    console.error("Update project request status error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while updating project status",
    });
  }
};

module.exports = {
  createProjectRequest,
  getMySentRequests,
  getMyReceivedRequests,
  updateProjectRequestStatus,
};
