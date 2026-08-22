const express = require("express");

const { register, login, googleLogin, googleCallback } = require("../controllers/authController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/google", googleLogin);
router.get("/google/callback", googleCallback);

router.get("/me", protect, async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      user: req.user,
    },
  });
});

module.exports = router;