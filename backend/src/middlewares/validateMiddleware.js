const { ZodError } = require("zod");

const validate = (schema) => (req, res, next) => {
  try {
    if (schema.body) req.body = schema.body.parse(req.body);
    if (schema.query) req.query = schema.query.parse(req.query);
    if (schema.params) req.params = schema.params.parse(req.params);

    // Agar seedha schema pass kiya gaya hai, to req.body validate karein
    if (!schema.body && !schema.query && !schema.params) {
      req.body = schema.parse(req.body);
    }

    next();
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: error.errors[0]?.message || "Validation failed",
      });
    }
    next(error);
  }
};

module.exports = validate;
