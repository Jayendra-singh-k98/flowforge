const AppError = require("../utils/AppError");

// Wraps a Zod schema as Express middleware. Validates req.body by
// default; pass { source: "params" } etc. for other request parts.
const validate = (schema, source = "body") => (req, res, next) => {
  const result = schema.safeParse(req[source]);

  if (!result.success) {
    const errors = result.error.issues.map(
      (issue) => `${issue.path.join(".") || source}: ${issue.message}`
    );
    return next(new AppError("Validation failed", 400, errors));
  }

  // Replace with parsed/coerced data (trimmed strings, defaults applied, etc.)
  req[source] = result.data;
  next();
};

module.exports = validate;