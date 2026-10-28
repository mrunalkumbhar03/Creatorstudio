const express = require("express");

const {
  createPortfolio,
  getMyPortfolio,
  getPortfolioById,
  updatePortfolio,
  deletePortfolio,
  getPublicPortfolio,
} = require("../controllers/portfolioController");

const authMiddleware = require("../middleware/authMiddleware");
// const portfolioRoutes = require("./routes/portfolioRoutes");
const router = express.Router();

// Create portfolio item
router.post(
  "/",
  authMiddleware,
  createPortfolio
);

// Get my portfolio
router.get(
  "/me",
  authMiddleware,
  getMyPortfolio
);

// Get single portfolio item
router.get(
  "/:id",
  authMiddleware,
  getPortfolioById
);

// Update portfolio item
router.put(
  "/:id",
  authMiddleware,
  updatePortfolio
);

// Delete portfolio item
router.delete(
  "/:id",
  authMiddleware,
  deletePortfolio
);
// Public portfolio for clients (no login required)
router.get("/public/:id", getPublicPortfolio);
module.exports = router;