const rateLimit = require("express-rate-limit");

// Shared response shape so rate-limit errors match the rest of the API
const rateLimitHandler = (req, res) => {
  res.status(429).json({
    success: false,
    message: "Too many requests. Please try again later.",
  });
};

const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000; // 15 min default

// Strict limiter for auth endpoints — these are the classic brute-force targets
const authLimiter = rateLimit({
  windowMs,
  max: Number(process.env.AUTH_RATE_LIMIT_MAX) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skipSuccessfulRequests: false,
});

// Looser limiter for workflow execution — expensive (queues a job, hits
// external HTTP/SMTP), but shouldn't block normal iterative testing
const executionLimiter = rateLimit({
  windowMs: Number(process.env.EXECUTION_RATE_LIMIT_WINDOW_MS) || 60 * 1000, // 1 min default
  max: Number(process.env.EXECUTION_RATE_LIMIT_MAX) || 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

// General-purpose limiter for everything else under /api, as a baseline
// safety net against abuse/scraping
const generalLimiter = rateLimit({
  windowMs,
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

module.exports = { authLimiter, executionLimiter, generalLimiter };