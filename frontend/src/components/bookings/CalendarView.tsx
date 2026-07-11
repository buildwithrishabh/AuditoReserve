import { useState, useEffect } from "react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  addMonths, 
  subMonths,
  getDay
} from "date-fns";
import { ChevronLeft, ChevronRight, Calendar, Clock, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getCalendarBookings } from "../../api/bookings";
import type { Booking } from "../../types";

type CalendarViewProps = {
  auditoriumId: string;
  compact?: boolean;
  selectedDate?: Date | null;
  onDateSelect?: (date: Date) => void;
};

export function CalendarView({ 
  auditoriumId, 
  compact = false, 
  selectedDate: selectedDateProp, 
  onDateSelect 
}: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Sync selected date from parent
  useEffect(() => {
    if (selectedDateProp !== undefined) {
      setSelectedDate(selectedDateProp);
      if (selectedDateProp) {
        setCurrentMonth(selectedDateProp);
      }
    }
  }, [selectedDateProp]);

  // Fetch bookings whenever month or auditorium changes
  useEffect(() => {
    async function fetchBookings() {
      setIsLoading(true);
      try {
        const formattedMonth = format(currentMonth, "yyyy-MM");
        const bookingsData = await getCalendarBookings(auditoriumId, formattedMonth);
        setBookings(bookingsData);
      } catch (error) {
        console.error("Failed to fetch calendar bookings:", error);
      } finally {
        setIsLoading(false);
      }
    }
    void fetchBookings();
  }, [auditoriumId, currentMonth]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart); // 0 = Sunday, 1 = Monday, etc.

  // Helper to find bookings for a specific day
  const getBookingsForDay = (date: Date) => {
    return bookings.filter((b) => isSameDay(new Date(b.bookingDate), date));
  };

  const selectedDayBookings = selectedDate ? getBookingsForDay(selectedDate) : [];

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    if (onDateSelect) {
      onDateSelect(date);
    }
  };

  return (
    <div className={`calendar-card ${compact ? "compact" : ""}`}>
      {/* Month Selector Header */}
      <div className="calendar-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3>Availability Calendar</h3>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button 
            type="button"
            className="icon-button" 
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            title="Previous Month"
            aria-label="Previous Month"
          >
            <ChevronLeft size={compact ? 14 : 18} />
          </button>
          <span style={{ fontWeight: 700, minWidth: "120px", textAlign: "center", fontSize: "14px" }}>
            {format(currentMonth, "MMMM yyyy")}
          </span>
          <button 
            type="button"
            className="icon-button" 
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            title="Next Month"
            aria-label="Next Month"
          >
            <ChevronRight size={compact ? 14 : 18} />
          </button>
        </div>
      </div>

      {/* Weekday Names Header */}
      <div className="calendar-grid-weekdays" style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center", fontWeight: 700 }}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} style={{ fontSize: "12px", color: "var(--text-muted)", padding: "4px 0" }}>{day}</div>
        ))}
      </div>

      {/* Days Grid */}
      {isLoading ? (
        <div className="calendar-loader-container">
          <div className="route-loader" />
        </div>
      ) : (
        <div className="calendar-grid-days" style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px" }}>
          {/* Fill offset empty spaces before the 1st of month */}
          {Array.from({ length: startDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {daysInMonth.map((day) => {
            const dayBookings = getBookingsForDay(day);
            const hasBookings = dayBookings.length > 0;
            const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;

            return (
              <button
                key={day.toString()}
                type="button"
                onClick={() => handleDateClick(day)}
                className={`calendar-day-btn ${isSelected ? "selected" : ""} ${hasBookings ? "has-bookings" : ""}`}
              >
                <span style={{ fontSize: "14px", fontWeight: 600 }}>{format(day, "d")}</span>
                
                {/* Indicator Dot */}
                {hasBookings && (
                  <span className="booking-indicator" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Daily Timeline Drawer / Info Panel */}
      <AnimatePresence mode="wait">
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 24 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <div className="timeline-panel">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h4>
                  <Calendar size={16} style={{ color: "var(--accent)" }} /> Bookings for {format(selectedDate, "MMMM d, yyyy")}
                </h4>
                <button 
                  type="button"
                  className="timeline-close-btn"
                  onClick={() => setSelectedDate(null)} 
                >
                  Close
                </button>
              </div>

              {selectedDayBookings.length === 0 ? (
                <div className="timeline-empty-state">
                  <CheckCircle className="timeline-empty-icon" size={20} />
                  <p className="timeline-empty-text">Fully Available</p>
                  <p className="timeline-empty-subtext">No bookings scheduled on this date.</p>
                </div>
              ) : (
                <div className="timeline-booking-list">
                  {selectedDayBookings.map((b) => (
                    <div key={b._id} className="timeline-booking-item">
                      <Clock className="time-icon" size={16} />
                      <div className="timeline-booking-details">
                        <span className="timeline-booking-time">
                          {b.startTime} - {b.endTime}
                        </span>
                        <span className="timeline-booking-purpose">
                          Event: {b.purpose}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
