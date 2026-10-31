const { z } = require("zod");

// MongoDB 24-character hex ObjectId validator
const objectIdSchema = z
  .string({ message: "Invalid resource identifier" })
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid resource identifier");

// Common 24-hour time format: "H:MM" or "HH:MM" (e.g. 09:30, 14:00)
const timePattern = /^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
const time24HourSchema = z
  .string({ message: "Please provide all required fields" })
  .regex(timePattern, "Invalid time format. Use 24-hour format like 09:30 or 14:00");

// Standard pagination query schema
const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

module.exports = {
  objectIdSchema,
  timePattern,
  time24HourSchema,
  paginationQuerySchema,
};
