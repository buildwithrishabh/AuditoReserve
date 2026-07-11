# Implementation Guide: Interactive Calendar View & Sync

This guide provides a step-by-step breakdown of how to implement the **Interactive Calendar View** (with daily timeline slots) and **Calendar Sync** (.ics file downloads & Google Calendar links) for the Auditorium Booking System.

---

## Part 1: Backend API

We need an endpoint that returns all confirmed/approved bookings for a specific auditorium during a given month.

### 1. Add Route in `backend/src/routes/bookingRoutes.js`
Add a new route accessible by both students and admins to query calendar slots:

```javascript
// Get Calendar Bookings (for availability checks)
router.get("/calendar", protect, isverified, getCalendarBookings);
```

### 2. Implement Controller in `backend/src/controllers/bookingController.js`
Implement the `getCalendarBookings` controller logic to fetch bookings for a given auditorium and month:

```javascript
// ======================================
// Get Bookings for Calendar
// ======================================
exports.getCalendarBookings = async (req, res, next) => {
  try {
    const { auditoriumId, month } = req.query; // month format: "YYYY-MM"

    if (!auditoriumId || !month) {
      return res.status(400).json({
        success: false,
        message: "Auditorium ID and month (YYYY-MM) are required",
      });
    }

    // Calculate start and end date of the requested month
    const startDate = new Date(`${month}-01T00:00:00.000Z`);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 23, 59, 59, 999);

    const bookings = await Booking.find({
      auditorium: auditoriumId,
      status: { $in: ["approved", "confirmed"] }, // Only show slots that are actually reserved
      bookingDate: {
        $gte: startDate,
        $lte: endDate,
      },
    })
      .select("bookingDate startTime endTime purpose status")
      .sort({ startTime: 1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    next(error);
  }
};
```

Remember to export `getCalendarBookings` at the bottom of the controller file!

---

## Part 2: Frontend Calendar Sync Utilities

We will write functions to generate Google Calendar links and `.ics` file downloads without needing external dependencies.

### Create `frontend/src/utils/calendarSync.ts`
Create this utility file to handle formatting and calendar integrations:

```typescript
import type { Booking, Auditorium } from "../types";

/**
 * Formats a JavaScript Date or date string to Google/iCal compact ISO format: YYYYMMDDTHHmmSSZ
 */
function formatToIsoCompact(dateStr: string, timeStr: string): string {
  // Combine date and time (e.g. "2026-07-10" and "09:30")
  const dateObj = new Date(`${dateStr.split("T")[0]}T${timeStr}:00`);
  
  // Return YYYYMMDDTHHmmss string in UTC
  const pad = (num: number) => num.toString().padStart(2, "0");
  const yyyy = dateObj.getUTCFullYear();
  const mm = pad(dateObj.getUTCMonth() + 1);
  const dd = pad(dateObj.getUTCDate());
  const hh = pad(dateObj.getUTCHours());
  const min = pad(dateObj.getUTCMinutes());
  const ss = pad(dateObj.getUTCSeconds());

  return `${yyyy}${mm}${dd}T${hh}${min}${ss}Z`;
}

/**
 * Generates a pre-filled Google Calendar event template URL
 */
export function generateGoogleCalendarUrl(booking: Booking, auditoriumName: string): string {
  const start = formatToIsoCompact(booking.bookingDate, booking.startTime);
  const end = formatToIsoCompact(booking.bookingDate, booking.endTime);
  
  const text = encodeURIComponent(`Auditorium Booking: ${auditoriumName}`);
  const dates = `${start}/${end}`;
  const details = encodeURIComponent(
    `Purpose: ${booking.purpose}\nStatus: ${booking.status.toUpperCase()}\nBooking ID: ${booking._id}`
  );
  const location = encodeURIComponent(auditoriumName);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&details=${details}&location=${location}`;
}

/**
 * Generates and triggers download of a standard iCalendar (.ics) file
 */
export function downloadIcsFile(booking: Booking, auditoriumName: string): void {
  const start = formatToIsoCompact(booking.bookingDate, booking.startTime);
  const end = formatToIsoCompact(booking.bookingDate, booking.endTime);
  const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AuditoReserve//Booking System//EN",
    "BEGIN:VEVENT",
    `UID:${booking._id}@auditoreserve`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:Booking - ${auditoriumName}`,
    `DESCRIPTION:Purpose: ${booking.purpose}\\nStatus: ${booking.status}`,
    `LOCATION:${auditoriumName}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `booking-${booking._id}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
```

---

## Part 3: Frontend Calendar Components

We will build the **CalendarView** React component containing the monthly calendar grid and the Daily Timeline Panel.

### Create `frontend/src/components/booking/CalendarView.tsx`
This component fetches bookings for the selected month and presents them in a grid. Clicking on a day displays the timeslots panel.

```tsx
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
import { ChevronLeft, ChevronRight, Calendar, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../api/client";

type CalendarBooking = {
  _id: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  purpose: string;
  status: string;
};

type CalendarViewProps = {
  auditoriumId: string;
  auditoriumName: string;
};

export function CalendarView({ auditoriumId, auditoriumName }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [bookings, setBookings] = useState<CalendarBooking[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch bookings whenever month or auditorium changes
  useEffect(() => {
    async function fetchBookings() {
      setIsLoading(true);
      try {
        const formattedMonth = format(currentMonth, "yyyy-MM");
        const response = await api.get(`/bookings/calendar`, {
          params: { auditoriumId, month: formattedMonth }
        });
        setBookings(response.data.bookings);
      } catch (error) {
        console.error("Failed to fetch calendar bookings:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchBookings();
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

  return (
    <div className="calendar-card card">
      {/* Month Selector Header */}
      <div className="calendar-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h3>Availability Calendar</h3>
        <div style={{ display: "flex", gap: "8px" }}>
          <button className="icon-button" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft size={18} />
          </button>
          <span style={{ fontWeight: 600, minWidth: "100px", textAlign: "center" }}>
            {format(currentMonth, "MMMM yyyy")}
          </span>
          <button className="icon-button" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Weekday Names Header */}
      <div className="calendar-grid-weekdays" style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center", fontWeight: 700, paddingBottom: "8px" }}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} style={{ fontSize: "12px", color: "var(--text-muted)" }}>{day}</div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="calendar-grid-days" style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px" }}>
        {/* Fill offset empty spaces before the 1st of month */}
        {Array.from({ length: startDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {daysInMonth.map((day) => {
          const dayBookings = getBookingsForDay(day);
          const hasBookings = dayBookings.length > 0;
          const isSelected = selectedDate && isSameDay(day, selectedDate);

          return (
            <button
              key={day.toString()}
              onClick={() => setSelectedDate(day)}
              className={`calendar-day-btn ${isSelected ? "selected" : ""} ${hasBookings ? "has-bookings" : ""}`}
              style={{
                aspectRatio: "1",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "8px",
                border: "1px solid var(--border-color)",
                background: isSelected ? "var(--accent)" : "none",
                color: isSelected ? "#fff" : "var(--text)",
                cursor: "pointer",
                position: "relative"
              }}
            >
              <span style={{ fontSize: "14px", fontWeight: 600 }}>{format(day, "d")}</span>
              
              {/* Indicator Dot */}
              {hasBookings && !isSelected && (
                <span 
                  className="booking-indicator" 
                  style={{
                    position: "absolute",
                    bottom: "6px",
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "var(--accent)"
                  }} 
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Daily Timeline Drawer / Info Panel */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="timeline-panel"
            style={{
              marginTop: "20px",
              padding: "16px",
              background: "var(--bg-card-hover)",
              borderRadius: "12px",
              border: "1px solid var(--border-color)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h4 style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Calendar size={16} /> Bookings for {format(selectedDate, "MMMM d, yyyy")}
              </h4>
              <button 
                onClick={() => setSelectedDate(null)} 
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "12px", fontWeight: 700 }}
              >
                Close
              </button>
            </div>

            {selectedDayBookings.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
                🎉 No bookings scheduled. The entire day is available!
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  The following slots are already booked. Please choose an alternate slot:
                </p>
                {selectedDayBookings.map((b) => (
                  <div 
                    key={b._id} 
                    style={{
                      display: "flex", 
                      alignItems: "center", 
                      gap: "12px", 
                      padding: "10px 14px", 
                      background: "rgba(255, 99, 71, 0.1)", 
                      borderLeft: "4px solid var(--accent)", 
                      borderRadius: "0 8px 8px 0"
                    }}
                  >
                    <Clock size={16} style={{ color: "var(--accent)" }} />
                    <div>
                      <span style={{ fontWeight: 600, display: "block", fontSize: "14px" }}>
                        {b.startTime} - {b.endTime}
                      </span>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        Event: {b.purpose}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

---

## Part 4: Integration with Detail & Booking Pages

### 1. In `AuditoriumDetailPage.tsx`
Import and place the component:

```tsx
import { CalendarView } from "../../components/booking/CalendarView";

// Inside AuditoriumDetailPage JSX (e.g. above or beside the Booking Form):
<div className="detail-layout" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
  <div>
    {/* Auditorium Details / Images */}
    <CalendarView auditoriumId={auditorium._id} auditoriumName={auditorium.name} />
  </div>
  <div>
    {/* Existing Booking Form */}
  </div>
</div>
```

### 2. In `StudentBookingsPage.tsx`
Import sync functions and add options:

```typescript
import { generateGoogleCalendarUrl, downloadIcsFile } from "../../utils/calendarSync";

// In the booking actions list:
{booking.status === "confirmed" && (
  <div className="calendar-sync-actions" style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
    <a 
      href={generateGoogleCalendarUrl(booking, booking.auditorium.name)}
      target="_blank"
      rel="noopener noreferrer"
      className="button secondary sm"
    >
      📅 Google Calendar
    </a>
    <button 
      onClick={() => downloadIcsFile(booking, booking.auditorium.name)}
      className="button secondary sm"
    >
      📥 Download .ics
    </button>
  </div>
)}
```

---

## Step 5: Test & Verify
1. Start frontend & backend servers.
2. Select any auditorium. Look at the calendar grid.
3. Book slot `10:00 - 12:00` for a specific date, and approve it via Admin.
4. Verify that the date cell on the student page displays an indicator dot.
5. Click on the day and verify that the timeline lists `10:00 - 12:00` as booked, and details the event purpose.
6. Verify that trying to book `11:00 - 13:00` on the same day fails with an overlap error message, while `13:00 - 15:00` succeeds!
