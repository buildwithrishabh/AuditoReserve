const validate = (schema) => (req, res, next) => {
  try {
    if (!schema) return next();

    // Validate params, query, or body if provided
    if (schema.params) req.params = schema.params.parse(req.params);
    if (schema.query) req.query = schema.query.parse(req.query);
    if (schema.body) req.body = schema.body.parse(req.body);

    // If a direct Zod schema is passed for body
    if (typeof schema.parse === "function") {
      req.body = schema.parse(req.body);
    }

    next();
  } catch (error) {
    const issues = error.issues || [];
    return res.status(400).json({
      success: false,
      message: issues[0]?.message || "Validation failed",
      errors: issues.map((i) => ({
        field: i.path?.join("."),
        message: i.message,
      })),
    });
  }
};

module.exports = validate;
