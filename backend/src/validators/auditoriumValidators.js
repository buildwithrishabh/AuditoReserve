const { z } = require("zod");
const { objectIdSchema } = require("./commonValidators");

// Single auditorium params validator
const auditoriumIdParamSchema = {
  params: z.object({
    id: objectIdSchema,
  }),
};

// Create auditorium validator
const createAuditoriumSchema = {
  body: z.object({
    name: z
      .string({
        required_error: "Auditorium name is required",
        invalid_type_error: "Auditorium name must be a string",
      })
      .trim()
      .min(1, "Auditorium name is required"),
    capacity: z.coerce
      .number({
        required_error: "Capacity is required",
        invalid_type_error: "Capacity must be a valid number",
      })
      .int("Capacity must be an integer")
      .positive("Capacity must be a positive number"),
    amenities: z
      .union([z.string(), z.array(z.string())])
      .optional(),
    basePrice: z.coerce
      .number({
        required_error: "Base price is required",
        invalid_type_error: "Base price must be a valid number",
      })
      .positive("Base price must be a positive number"),
    description: z
      .string({
        required_error: "Description is required",
        invalid_type_error: "Description must be a string",
      })
      .trim()
      .min(1, "Description is required")
      .max(500, "Description cannot exceed 500 characters"),
  }),
};

// Update auditorium validator
const updateAuditoriumSchema = {
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    name: z.string().trim().min(1).optional(),
    capacity: z.coerce.number().int().positive().optional(),
    amenities: z.union([z.string(), z.array(z.string())]).optional(),
    basePrice: z.coerce.number().positive().optional(),
    description: z.string().trim().max(500, "Description cannot exceed 500 characters").optional(),
  }),
};

module.exports = {
  auditoriumIdParamSchema,
  createAuditoriumSchema,
  updateAuditoriumSchema,
};

