import { useState } from "react";
import { format } from "date-fns";
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  Download,
  Loader2,
  FileText,
  AlertTriangle,
  CalendarPlus,
  ExternalLink,
} from "lucide-react";
import { StatusBadge } from "../common/StatusBadge";
import { generateGoogleCalendarUrl, downloadIcsFile } from "../../utils/calendarSync";

export function BookingRow({
  booking,
  onCancel,
  onPay,
  onViewReceipt,
  onDownloadReceipt,
  isDownloadingReceipt = false,
  adminActions,
  isSubmittingAction = false,
}) {
  const [calendarMenuOpen, setCalendarMenuOpen] = useState(false);
  const [currentTime] = useState(() => Date.now());

  const auditorium =
    typeof booking.auditorium === "string" ? undefined : booking.auditorium;
  const user = typeof booking.user === "string" ? undefined : booking.user;

  const formatDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return format(date, "dd MMM yyyy");
  };

  const formatDeadline = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return format(date, "dd MMM yyyy, hh:mm a");
  };

  const isDeadlineUrgent = () => {
    if (!booking.paymentDeadline) return false;
    const deadline = new Date(booking.paymentDeadline).getTime();
    return deadline - currentTime < 2 * 60 * 60 * 1000 && deadline > currentTime;
  };

  const auditoriumName = auditorium?.name || "Campus Auditorium";

  return (
    <article className="card booking-row">
      <div className="booking-main">
        <div className="booking-header-line">
          <StatusBadge status={booking.status} />
          {booking.status === "approved" && booking.paymentDeadline && (
            <span className={`booking-deadline-badge ${isDeadlineUrgent() ? "urgent" : ""}`}>
              <AlertTriangle size={13} aria-hidden="true" />
              Pay before {formatDeadline(booking.paymentDeadline)}
            </span>
          )}
        </div>

        <h3 className="booking-venue-title">{auditoriumName}</h3>
        {user && (
          <p className="booking-user">
            Requested by: <strong>{user.name}</strong> ({user.email})
          </p>
        )}
        <p className="booking-purpose">{booking.purpose}</p>
      </div>

      <div className="booking-meta">
        <span className="meta-item">
          <CalendarDays size={16} className="meta-icon" aria-hidden="true" />
          <strong className="meta-value">{formatDate(booking.bookingDate)}</strong>
        </span>
        <span className="meta-item">
          <Clock size={16} className="meta-icon" aria-hidden="true" />
          <span className="meta-value tabular-nums">{booking.startTime} &ndash; {booking.endTime}</span>
        </span>
        <span className="price-tag tabular-nums">&#8377;{booking.totalPrice}</span>
      </div>

      <div className="row-actions">
        {onCancel && (
          <button
            className="button danger sm"
            type="button"
            onClick={onCancel}
            disabled={isSubmittingAction}
          >
            Cancel request
          </button>
        )}

        {onPay && (
          <button
            className="button primary sm"
            type="button"
            onClick={onPay}
            disabled={isSubmittingAction}
          >
            Pay Now
          </button>
        )}

        {booking.status === "confirmed" && (
          <div className="confirmed-action-group">
            {onViewReceipt && (
              <button
                className="button ghost sm"
                type="button"
                onClick={onViewReceipt}
                title="View verified electronic receipt in modal"
              >
                <FileText size={14} /> View receipt
              </button>
            )}

            {onDownloadReceipt && (
              <button
                className="button ghost sm"
                type="button"
                onClick={onDownloadReceipt}
                disabled={isDownloadingReceipt}
                title="Download official PDF receipt"
              >
                {isDownloadingReceipt ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Downloading...
                  </>
                ) : (
                  <>
                    <Download size={14} /> PDF
                  </>
                )}
              </button>
            )}

            {/* Calendar Sync Dropdown */}
            <div className="calendar-sync-dropdown-wrapper">
              <button
                type="button"
                className="button ghost sm calendar-sync-btn"
                onClick={() => setCalendarMenuOpen((prev) => !prev)}
                title="Sync to Calendar"
                aria-expanded={calendarMenuOpen}
              >
                <CalendarPlus size={14} /> Sync
              </button>

              {calendarMenuOpen && (
                <div className="calendar-sync-menu">
                  <a
                    href={generateGoogleCalendarUrl(booking, auditoriumName)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="calendar-menu-item"
                    onClick={() => setCalendarMenuOpen(false)}
                  >
                    <ExternalLink size={13} /> Google Calendar
                  </a>
                  <button
                    type="button"
                    className="calendar-menu-item"
                    onClick={() => {
                      downloadIcsFile(booking, auditoriumName);
                      setCalendarMenuOpen(false);
                    }}
                  >
                    <Download size={13} /> Download .ics file
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {adminActions && (
          <div className="admin-actions-cell">
            <button
              className="icon-button success-icon"
              type="button"
              onClick={() => adminActions("approved")}
              disabled={isSubmittingAction}
              aria-label="Approve booking request"
              title="Approve booking request"
            >
              <CheckCircle2 size={18} />
            </button>
            <button
              className="icon-button danger-icon"
              type="button"
              onClick={() => adminActions("cancelled")}
              disabled={isSubmittingAction}
              aria-label="Reject booking request"
              title="Reject booking request"
            >
              <XCircle size={18} />
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

export default BookingRow;
