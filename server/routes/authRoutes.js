
const express = require("express");

const {
  registerUser,
  loginUser,
  updateMyPhone,
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

router.patch("/me/phone", authMiddleware, updateMyPhone);

router.get("/me", authMiddleware, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Authenticated user",
    user: req.user,
  });
});

module.exports = router;
