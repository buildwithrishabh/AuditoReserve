const { z } = require("zod");

const timeRegex = /^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const createBookingSchema = z
  .object({
    auditoriumId: z
      .string({ required_error: "Auditorium ID is required" })
      .regex(objectIdRegex, "Invalid auditorium ID"),
    bookingDate: z
      .string({ required_error: "Booking date is required" })
      .trim()
      .min(1, "Booking date is required"),
    startTime: z
      .string({ required_error: "Start time is required" })
      .regex(timeRegex, "Invalid start time format (HH:MM)"),
    endTime: z
      .string({ required_error: "End time is required" })
      .regex(timeRegex, "Invalid end time format (HH:MM)"),
    purpose: z
      .string({ required_error: "Purpose is required" })
      .trim()
      .min(3, "Purpose must be at least 3 characters")
      .max(300, "Purpose cannot exceed 300 characters"),
  })
  .refine(
    (data) => {
      const [sh, sm] = data.startTime.split(":").map(Number);
      const [eh, em] = data.endTime.split(":").map(Number);
      return eh * 60 + em > sh * 60 + sm;
    },
    {
      message: "Start time must be before end time",
      path: ["endTime"],
    },
  )
  .refine(
    (data) => {
      const [sh, sm] = data.startTime.split(":").map(Number);
      const [eh, em] = data.endTime.split(":").map(Number);
      return eh * 60 + em - (sh * 60 + sm) >= 30; // Minimum 30 mins
    },
    {
      message: "Booking duration must be at least 30 minutes",
      path: ["endTime"],
    },
  );

const calendarQuerySchema = z.object({
  auditoriumId: z
    .string({ required_error: "Auditorium ID is required" })
    .regex(objectIdRegex, "Invalid auditorium ID"),
  month: z
    .string({ required_error: "Month is required" })
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Month must be in YYYY-MM format"),
});

const updateBookingStatusSchema = z.object({
  status: z.enum(["approved", "cancelled"], {
    errorMap: () => ({ message: "Status must be either 'approved' or 'cancelled'" }),
  }),
});

module.exports = {
  createBookingSchema,
  calendarQuerySchema,
  updateBookingStatusSchema,
};
