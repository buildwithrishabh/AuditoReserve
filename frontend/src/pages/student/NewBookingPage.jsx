import { useState } from "react";
import { format } from "date-fns";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
} from "lucide-react";
import { getSingleAuditorium } from "../../api/auditoriums";
import { createBooking } from "../../api/bookings";
import { useToast } from "../../hooks/useToast";
import { getErrorMessage } from "../../api/client";
import { ImageFrame } from "../../components/auditoriums/AuditoriumCard";
import { TextField, FormError } from "../../components/common/FormControls";
import { TimePicker } from "../../components/common/TimePicker";
import { FullPageState } from "../../components/common/LoadingSkeleton";
import { ErrorState } from "../../components/common/ErrorState";
import { CalendarView } from "../../components/bookings/CalendarView";

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
  )
  .refine(
    (data) => {
      const selectedDate = new Date(data.bookingDate);
      const today = new Date();
      
      const currentHours = today.getHours();
      const currentMinutes = today.getMinutes();
      
      today.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);
      
      if (selectedDate.getTime() === today.getTime()) {
        const currentTimeString = `${String(currentHours).padStart(2, "0")}:${String(currentMinutes).padStart(2, "0")}`;
        return data.startTime > currentTimeString;
      }
      
      return true;
    },
    {
      message: "Start time must be in the future for today's bookings",
      path: ["startTime"],
    }
  );

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
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(bookingSchema),
  });

  const startTime = useWatch({ control, name: "startTime" }) || "";
  const endTime = useWatch({ control, name: "endTime" }) || "";
  const bookingDate = useWatch({ control, name: "bookingDate" }) || "";

  const parseLocalDate = (dateStr) => {
    if (!dateStr) return null;
    const [year, month, day] = dateStr.split("-").map(Number);
    if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) return null;
    return new Date(year, month - 1, day);
  };
  const selectedDateVal = parseLocalDate(bookingDate);

  // Compute duration in hours and estimated price
  const calculateDuration = (start, end) => {
    if (!start || !end || start >= end) return 0;
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    return Math.max(0, (eh * 60 + em - (sh * 60 + sm)) / 60);
  };

  const durationHours = calculateDuration(startTime, endTime);
  const estimatedTotal =
    durationHours > 0 && auditorium?.basePrice
      ? Math.round(durationHours * auditorium.basePrice)
      : 0;

  async function onSubmit(values) {
    setServerError("");
    try {
      const payload = { auditoriumId, ...values };
      await createBooking(payload);
      showToast("Booking request submitted successfully! Pending admin review.", "success");
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
    <div className="new-booking-page">
      {/* Breadcrumb Trail */}
      <nav aria-label="Breadcrumb" className="detail-breadcrumb">
        <Link to="/">Home</Link>
        <span className="crumb-sep">/</span>
        <Link to="/auditoriums">Auditoriums</Link>
        <span className="crumb-sep">/</span>
        <Link to={`/auditoriums/${auditoriumId}`}>{auditorium.name}</Link>
        <span className="crumb-sep">/</span>
        <span className="crumb-current">Schedule Booking</span>
      </nav>

      <div className="booking-stepper-grid">
        {/* Left Form: Step 1 Date -> Step 2 Time -> Step 3 Purpose */}
        <div className="booking-form-col">
          <form
            className="card booking-stepper-card"
            onSubmit={(e) => void handleSubmit(onSubmit)(e)}
          >
            <div className="stepper-header">
              <h1>Schedule Venue Reservation</h1>
              <p>Reserve a verified time slot for your campus event or department symposium.</p>
            </div>

            {/* STEP 1: Date & Conflict Check */}
            <section className="step-block">
              <div className="step-head">
                <span className="step-badge">1</span>
                <div>
                  <h3>Select Event Date</h3>
                  <p>Pick a date on the calendar to check current bookings and avoid slot conflicts.</p>
                </div>
              </div>

              <div className="calendar-step-container">
                <CalendarView
                  auditoriumId={auditoriumId}
                  compact={true}
                  selectedDate={selectedDateVal}
                  onDateSelect={(date) => {
                    setValue("bookingDate", format(date, "yyyy-MM-dd"), { shouldValidate: true });
                  }}
                />

                <div style={{ marginTop: "16px" }}>
                  <TextField
                    label="Booking Date (YYYY-MM-DD)"
                    type="date"
                    error={errors.bookingDate?.message}
                    {...field("bookingDate")}
                  />
                </div>
              </div>
            </section>

            {/* STEP 2: Start & End Time */}
            <section className="step-block">
              <div className="step-head">
                <span className="step-badge">2</span>
                <div>
                  <h3>Time Slot (24-Hour)</h3>
                  <p>Enter the exact start and end time of your event. Standard hourly rate applies.</p>
                </div>
              </div>

              <div className="form-row">
                <TimePicker
                  label="Start Time (HH:MM)"
                  value={startTime}
                  onChange={(v) => setValue("startTime", v, { shouldValidate: true })}
                  error={errors.startTime?.message}
                />
                <TimePicker
                  label="End Time (HH:MM)"
                  value={endTime}
                  onChange={(v) => setValue("endTime", v, { shouldValidate: true })}
                  error={errors.endTime?.message}
                />
              </div>

              {durationHours > 0 && (
                <div className="duration-pill">
                  <Clock size={14} />
                  <span>Calculated Duration: <strong>{durationHours} hour{durationHours !== 1 ? "s" : ""}</strong></span>
                </div>
              )}
            </section>

            {/* STEP 3: Event Purpose */}
            <section className="step-block">
              <div className="step-head">
                <span className="step-badge">3</span>
                <div>
                  <h3>Event Purpose & Details</h3>
                  <p>Provide a detailed description of your event for administrative review and security clearance.</p>
                </div>
              </div>

              <label className={`field ${errors.purpose ? "has-error" : ""}`}>
                <span>Event Purpose / Subject</span>
                <textarea
                  rows={4}
                  {...field("purpose")}
                  placeholder="Detail the event title, organizing department/society, expected guest speakers, and AV requirements..."
                />
                {errors.purpose?.message && (
                  <small>
                    <AlertCircle size={13} />
                    {errors.purpose.message}
                  </small>
                )}
              </label>
            </section>

            <FormError message={serverError} />

            <div className="stepper-submit-row">
              <button
                className="button primary lg wide"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? "Submitting Request..." : "Submit Booking Request"}
                <ArrowRight size={18} />
              </button>
            </div>

            <p className="submission-note">
              <HelpCircle size={14} style={{ color: "var(--primary)" }} />
              <span>Submitting a request locks the slot pending administrator approval. No fees are charged until approval.</span>
            </p>
          </form>
        </div>

        {/* Right Column: Sticky Summary Card */}
        <aside className="booking-summary-col">
          <div className="card sticky-booking-card">
            <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Reservation Summary</h3>
            
            <div className="summary-venue-box">
              <div style={{ width: "80px", height: "56px", borderRadius: "8px", overflow: "hidden", flexShrink: 0 }}>
                <ImageFrame src={auditorium.images?.[0]} alt={auditorium.name} />
              </div>
              <div>
                <strong style={{ display: "block", fontSize: "0.9375rem" }}>{auditorium.name}</strong>
                <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                  <Users size={13} style={{ display: "inline", verticalAlign: "middle" }} /> {auditorium.capacity} seats capacity
                </span>
              </div>
            </div>

            <div className="booking-card-divider" />

            <div className="summary-line-items">
              <div className="summary-line">
                <span className="label">Event Date:</span>
                <strong className="value">{bookingDate || "Not chosen yet"}</strong>
              </div>
              <div className="summary-line">
                <span className="label">Time Slot:</span>
                <strong className="value tabular-nums">
                  {startTime && endTime ? `${startTime} - ${endTime}` : "Not specified"}
                </strong>
              </div>
              <div className="summary-line">
                <span className="label">Duration:</span>
                <strong className="value tabular-nums">
                  {durationHours > 0 ? `${durationHours} hrs` : "0 hrs"}
                </strong>
              </div>
              <div className="summary-line">
                <span className="label">Hourly Rate:</span>
                <span className="value tabular-nums">&#8377;{auditorium.basePrice} / hr</span>
              </div>
            </div>

            <div className="booking-card-divider" />

            <div className="summary-total-row">
              <span>Estimated Total:</span>
              <strong className="total-amount tabular-nums">&#8377;{estimatedTotal}</strong>
            </div>

            <div className="summary-trust-badges">
              <div className="trust-badge-item">
                <CheckCircle2 size={15} style={{ color: "var(--status-confirmed-text)" }} />
                <span>Zero charge upon submission</span>
              </div>
              <div className="trust-badge-item">
                <Clock size={15} style={{ color: "var(--primary)" }} />
                <span>12-hour payment window on approval</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default NewBookingPage;
