import type { Booking } from "../types";

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
