const { z } = require("zod");
const { objectIdSchema, time24HourSchema } = require("./commonValidators");

const normalizeTime = (timeStr) => {
  const [hours, minutes] = timeStr.split(":");
  return `${hours.padStart(2, "0")}:${minutes}`;
};

// Create booking schema
const createBookingSchema = {
  body: z
    .object({
      auditoriumId: z
        .string({ message: "Please provide all required fields" })
        .trim()
        .min(1, "Please provide all required fields"),
      bookingDate: z
        .string({ message: "Please provide all required fields" })
        .min(1, "Please provide all required fields"),
      startTime: time24HourSchema,
      endTime: time24HourSchema,
      purpose: z
        .string({ message: "Please provide all required fields" })
        .trim()
        .min(1, "Please provide all required fields"),
    })
    .superRefine((data, ctx) => {
      // 1. Validate start time < end time
      if (data.startTime && data.endTime) {
        const start = normalizeTime(data.startTime);
        const end = normalizeTime(data.endTime);
        if (start >= end) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Start time must be before end time",
            path: ["startTime"],
          });
        }
      }

      // 2. Validate booking date is today or future
      if (data.bookingDate) {
        const selectedDate = new Date(data.bookingDate);
        if (isNaN(selectedDate.getTime())) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Invalid booking date",
            path: ["bookingDate"],
          });
        } else {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const bookingDay = new Date(selectedDate);
          bookingDay.setHours(0, 0, 0, 0);

          if (bookingDay < today) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Booking date must be today or future",
              path: ["bookingDate"],
            });
          }
        }
      }
    }),
};

// Update booking status schema (admin)
const updateBookingStatusSchema = {
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    status: z.enum(["approved", "cancelled"], {
      message: "Invalid booking status",
    }),
  }),
};

// Cancel booking schema (student)
const cancelBookingSchema = {
  params: z.object({
    id: objectIdSchema,
  }),
};

// Calendar bookings query schema
const calendarBookingSchema = {
  query: z.object({
    auditoriumId: z
      .string({ message: "Auditorium ID and month (YYYY-MM) are required" })
      .trim()
      .min(1, "Auditorium ID and month (YYYY-MM) are required"),
    month: z
      .string({ message: "Auditorium ID and month (YYYY-MM) are required" })
      .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Invalid month format. Expected YYYY-MM"),
  }),
};

// List bookings query schema
const listBookingsQuerySchema = {
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    status: z
      .enum(["pending", "approved", "confirmed", "cancelled", "rejected", "expired"])
      .optional(),
    auditoriumId: z.string().trim().optional(),
  }),
};

module.exports = {
  createBookingSchema,
  updateBookingStatusSchema,
  cancelBookingSchema,
  calendarBookingSchema,
  listBookingsQuerySchema,
};
