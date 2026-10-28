const Service = require("../models/Service");

// CREATE SERVICE
const createService = async (req, res) => {
  try {
    if (req.user.role !== "creator") {
      return res.status(403).json({
        success: false,
        message: "Only creators can add services",
      });
    }

    const {
      title,
      description,
      category,
      price,
      deliveryTime,
      dailyBookingLimit = 1,
      status = "Active",
    } = req.body;

    if (
      !title ||
      !description ||
      !category ||
      price === undefined ||
      !deliveryTime
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Title, description, category, price and delivery time are required",
      });
    }

    const service = await Service.create({
      creatorId: req.user.userId,
      title,
      description,
      category,
      price,
      deliveryTime,
      dailyBookingLimit,
      status,
    });

    return res.status(201).json({
      success: true,
      message: "Service created successfully",
      service,
    });
  } catch (error) {
    console.error("Create service error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while creating service",
    });
  }
};

// GET ALL ACTIVE SERVICES — PUBLIC BROWSING
const getAllServices = async (req, res) => {
  try {
    const services = await Service.find({
      status: "Active",
    })
      .populate("creatorId", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: services.length,
      services,
    });
  } catch (error) {
    console.error("Get all services error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching available services",
    });
  }
};

// GET MY SERVICES
const getMyServices = async (req, res) => {
  try {
    const services = await Service.find({
      creatorId: req.user.userId,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: services.length,
      services,
    });
  } catch (error) {
    console.error("Get my services error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching services",
    });
  }
};

// GET SINGLE SERVICE — OWN SERVICE
const getServiceById = async (req, res) => {
  try {
    const service = await Service.findOne({
      _id: req.params.id,
      creatorId: req.user.userId,
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    return res.status(200).json({
      success: true,
      service,
    });
  } catch (error) {
    console.error("Get service error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching service",
    });
  }
};

// UPDATE SERVICE
const updateService = async (req, res) => {
  try {
    const allowedFields = [
      "title",
      "description",
      "category",
      "price",
      "deliveryTime",
      "dailyBookingLimit",
      "status",
    ];

    const updates = {};
    const body = req.body || {};

    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    });

    const service = await Service.findOneAndUpdate(
      {
        _id: req.params.id,
        creatorId: req.user.userId,
      },
      updates,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Service updated successfully",
      service,
    });
  } catch (error) {
    console.error("Update service error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while updating service",
    });
  }
};

// DELETE SERVICE
const deleteService = async (req, res) => {
  try {
    const service = await Service.findOneAndDelete({
      _id: req.params.id,
      creatorId: req.user.userId,
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Service deleted successfully",
    });
  } catch (error) {
    console.error("Delete service error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while deleting service",
    });
  }
};

module.exports = {
  createService,
  getAllServices,
  getMyServices,
  getServiceById,
  updateService,
  deleteService,
};
