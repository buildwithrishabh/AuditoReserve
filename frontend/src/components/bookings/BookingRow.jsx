import { format } from "date-fns";
import { CalendarDays, Clock, CheckCircle2, XCircle, Download, Loader2, FileText, AlertTriangle } from "lucide-react";
import { StatusBadge } from "../common/StatusBadge";

export function BookingRow({
  booking,
  onCancel,
  onPay,
  onReceipt,
  onDownloadReceipt,
  isDownloadingReceipt = false,
  adminActions,
  isSubmittingAction = false,
}) {
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

  return (
    <article className="booking-row">
      <div className="booking-main">
        <div style={{ marginBottom: "8px" }}>
          <StatusBadge status={booking.status} />
        </div>
        <h3>{auditorium?.name || "Auditorium Facility"}</h3>
        {user && (
          <p className="booking-user">
            Requested by: <strong>{user.name}</strong> ({user.email})
          </p>
        )}
        <p>{booking.purpose}</p>
        {booking.status === "approved" && booking.paymentDeadline && (
          <p className="booking-deadline">
            <AlertTriangle size={14} aria-hidden="true" />
            Payment deadline: {formatDeadline(booking.paymentDeadline)}
          </p>
        )}
      </div>

      <div className="booking-meta">
        <span>
          <CalendarDays size={16} style={{ color: "var(--primary)" }} aria-hidden="true" />{" "}
          {formatDate(booking.bookingDate)}
        </span>
        <span>
          <Clock size={16} style={{ color: "var(--primary)" }} aria-hidden="true" />{" "}
          {booking.startTime} - {booking.endTime}
        </span>
        <strong className="price tabular-nums">₹{booking.totalPrice}</strong>
      </div>

      <div className="row-actions">
        {onCancel && (
          <button
            className="button danger sm"
            type="button"
            onClick={onCancel}
            disabled={isSubmittingAction}
          >
            Cancel
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
        {(booking.status === "confirmed") && (onDownloadReceipt || onReceipt) && (
          <button
            className="button ghost sm"
            type="button"
            onClick={onDownloadReceipt || onReceipt}
            disabled={isSubmittingAction || isDownloadingReceipt}
            title={onDownloadReceipt ? "Download Receipt" : "View Receipt"}
          >
            {isDownloadingReceipt ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Downloading...
              </>
            ) : onDownloadReceipt ? (
              <>
                <Download size={14} /> Download Receipt
              </>
            ) : (
              <>
                <FileText size={14} /> View Receipt
              </>
            )}
          </button>
        )}
        {adminActions && (
          <>
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
          </>
        )}
      </div>
    </article>
  );
}

export default BookingRow;
