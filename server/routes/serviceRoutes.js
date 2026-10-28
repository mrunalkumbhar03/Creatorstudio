const express = require("express");

const {
  createService,
  getMyServices,
  getServiceById,
  updateService,
  deleteService,
  getAllServices,
} = require("../controllers/serviceController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Browse all active services
router.get("/", getAllServices);

// Create service
router.post("/", authMiddleware, createService);

// Get my services
router.get("/me", authMiddleware, getMyServices);

// Get single service
router.get("/:id", authMiddleware, getServiceById);

// Update service
router.put("/:id", authMiddleware, updateService);

// Delete service
router.delete("/:id", authMiddleware, deleteService);

module.exports = router;
