const AppError = require("../utils/AppError");

// Converts known error types into a consistent AppError before responding
const normalizeError = (err) => {
  if (err instanceof AppError) return err;

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    return new AppError("Invalid ID format", 400);
  }

  // Mongoose schema validation
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => e.message);
    return new AppError("Validation failed", 400, errors);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return new AppError(`${field} already in use`, 409);
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return new AppError("Invalid token", 401);
  }
  if (err.name === "TokenExpiredError") {
    return new AppError("Token expired", 401);
  }

  // Unknown/unexpected — never leak details
  return new AppError("Internal server error", 500);
};

const errorHandler = (err, req, res, next) => {
  const normalized = normalizeError(err);

  // Log full detail server-side always, regardless of environment
  console.error(`[${req.method} ${req.originalUrl}]`, err);

  const response = {
    success: false,
    message: normalized.message,
  };

  if (normalized.errors) {
    response.errors = normalized.errors;
  }

  // Stack traces only ever in development, never in production
  if (process.env.NODE_ENV !== "production" && normalized.statusCode === 500) {
    response.stack = err.stack;
  }

  res.status(normalized.statusCode || 500).json(response);
};

const notFoundHandler = (req, res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

module.exports = { errorHandler, notFoundHandler, AppError };