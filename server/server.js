const express = require("express");
const cors = require("cors");
require("dotenv").config();

const projectRequestRoutes = require("./routes/projectRequestRoutes");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const creatorProfileRoutes = require("./routes/creatorProfileRoutes");
const portfolioRoutes = require("./routes/portfolioRoutes");
const app = express();
const serviceRoutes = require("./routes/serviceRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const chatRoutes = require("./routes/chatRoutes");
// Connect MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/creator-profile", creatorProfileRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/project-requests", projectRequestRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chat", chatRoutes);
// Test API
app.get("/", (req, res) => {
  res.json({
    message: "CreatorStudio API is running successfully!"
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});