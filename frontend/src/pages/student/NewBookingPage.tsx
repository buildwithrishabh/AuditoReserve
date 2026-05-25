import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { getSingleAuditorium } from "../../api/auditoriums";
import { createBooking } from "../../api/bookings";
import { useToast } from "../../hooks/useToast";
import { getErrorMessage } from "../../api/client";
import { AuditoriumCard } from "../../components/auditoriums/AuditoriumCard";
import { TextField, FormError } from "../../components/common/FormControls";
import { TimePicker } from "../../components/common/TimePicker";
import { FullPageState } from "../../components/common/LoadingSkeleton";
import { ErrorState } from "../../components/common/ErrorState";
import { fadeIn, slideLeft, slideRight, staggerContainerFast, cardItem } from "../../lib/animations";

const bookingSchema = z
  .object({
    bookingDate: z.string().min(1, "Date is required"),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    purpose: z.string().min(8, "Purpose description must be at least 8 characters"),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: "Start time must be before end time",
    path: ["endTime"],
  })
  .refine(
    (data) => {
      const selectedDate = new Date(data.bookingDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selectedDate >= today;
    },
    {
      message: "Booking date cannot be in the past",
      path: ["bookingDate"],
    }
  );

type BookingFormValues = z.infer<typeof bookingSchema>;

export function NewBookingPage() {
  const { auditoriumId = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [serverError, setServerError] = useState("");

  const {
    data: auditorium,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["auditorium", auditoriumId],
    queryFn: () => getSingleAuditorium(auditoriumId),
    enabled: Boolean(auditoriumId),
  });

  const {
    register: field,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
  });

  async function onSubmit(values: BookingFormValues) {
    setServerError("");
    try {
      const payload = { auditoriumId, ...values };
      await createBooking(payload);
      showToast("Booking request submitted successfully! Pending admin approval.", "success");
      await queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
      navigate("/bookings");
    } catch (error) {
      const msg = getErrorMessage(error);
      setServerError(msg);
      showToast(msg, "error");
    }
  }

  if (isLoading) {
    return (
      <FullPageState
        title="Loading Booking Sheet"
        message="Fetching selected venue details..."
      />
    );
  }

  if (isError || !auditorium) {
    return (
      <ErrorState
        title="Could not load auditorium details"
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <motion.section
      className="split-page"
      variants={staggerContainerFast}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={slideRight}>
        <div className="page-header">
          <p className="eyebrow">Booking request</p>
          <h1>{auditorium.name}</h1>
          <p>
            Submit your preferred date, time, and purpose. The administrator will
            review the request.
          </p>
        </div>
        <AuditoriumCard auditorium={auditorium} hideActions />
      </motion.div>

      <motion.form
        className="panel form"
        variants={slideLeft}
        onSubmit={(e) => void handleSubmit(onSubmit)(e)}
      >
        <motion.div variants={cardItem}>
          <TextField
            label="Booking Date"
            type="date"
            error={errors.bookingDate?.message}
            {...field("bookingDate")}
          />
        </motion.div>
        
        <motion.div variants={cardItem} className="form-row">
          <TimePicker
            label="Start Time"
            value={watch("startTime")}
            onChange={(v) => setValue("startTime", v, { shouldValidate: true })}
            error={errors.startTime?.message}
          />
          <TimePicker
            label="End Time"
            value={watch("endTime")}
            onChange={(v) => setValue("endTime", v, { shouldValidate: true })}
            error={errors.endTime?.message}
          />
        </motion.div>
        
        <motion.div variants={cardItem}>
          <label className={`field ${errors.purpose ? "has-error" : ""}`}>
            <span>Event Purpose / Subject</span>
            <textarea
              rows={5}
              {...field("purpose")}
              placeholder="Describe the academic, department or student event in detail..."
            />
            {errors.purpose?.message && (
              <small style={{ color: "var(--danger)", fontWeight: "600", marginTop: "4px" }}>
                {errors.purpose.message}
              </small>
            )}
          </label>
        </motion.div>
        
        <motion.div variants={cardItem}>
          <FormError message={serverError} />
        </motion.div>
        
        <motion.button
          className="button primary wide"
          disabled={isSubmitting}
          type="submit"
          variants={cardItem}
          style={{ marginTop: "12px" }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          {isSubmitting ? "Submitting..." : "Submit request"}
        </motion.button>
        
        <motion.p variants={fadeIn} className="note" style={{ margin: "16px 0 0" }}>
          This does not reserve the auditorium instantly. Conflicting pending or
          confirmed bookings are rejected by the backend.
        </motion.p>
      </motion.form>
    </motion.section>
  );
}
export default NewBookingPage;
