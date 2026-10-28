
const express = require("express");
const {
  createProjectRequest,
  getMySentRequests,
  getMyReceivedRequests,
  updateProjectRequestStatus,
} = require("../controllers/projectRequestController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, createProjectRequest);
router.get("/sent", authMiddleware, getMySentRequests);
router.get("/received", authMiddleware, getMyReceivedRequests);
router.patch("/:id/status", authMiddleware, updateProjectRequestStatus);

module.exports = router;
