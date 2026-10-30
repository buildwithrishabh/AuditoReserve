const { z } = require("zod");

const createAuditoriumSchema = z.object({
  name: z
    .string({ required_error: "Auditorium name is required" })
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),
  capacity: z.coerce
    .number({ required_error: "Capacity is required" })
    .int("Capacity must be an integer")
    .positive("Capacity must be greater than 0")
    .max(100000, "Capacity cannot exceed 100,000"),
  basePrice: z.coerce
    .number({ required_error: "Base price is required" })
    .positive("Base price must be greater than 0"),
  description: z
    .string({ required_error: "Description is required" })
    .trim()
    .min(5, "Description must be at least 5 characters")
    .max(500, "Description cannot exceed 500 characters"),
  amenities: z
    .union([z.string().trim(), z.array(z.string().trim())])
    .optional(),
});

const updateAuditoriumSchema = createAuditoriumSchema.partial();

module.exports = {
  createAuditoriumSchema,
  updateAuditoriumSchema,
};
