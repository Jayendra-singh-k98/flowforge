const express = require("express");

const { register, login, googleLogin, googleCallback } = require("../controllers/authController");
const protect = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const { registerSchema, loginSchema } = require("../validators/authValidators");
const { authLimiter } = require("../middleware/rateLimiter");


const router = express.Router();

router.post("/register", authLimiter, validate(registerSchema), register);
router.post("/login", authLimiter, validate(loginSchema), login);
router.get("/google", authLimiter, googleLogin);
router.get("/google/callback", authLimiter, googleCallback);

router.get("/me", protect, async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      user: req.user,
    },
  });
});

module.exports = router;