import { format } from "date-fns";
import { CalendarDays, Clock, CheckCircle2, XCircle, Download, Loader2, FileText } from "lucide-react";
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
        <StatusBadge status={booking.status} />
        <h3>{auditorium?.name || "Auditorium Facility"}</h3>
        {user && (
          <p className="booking-user">
            Requested by: {user.name} ({user.email})
          </p>
        )}
        <p style={{ color: "var(--text-muted)" }}>{booking.purpose}</p>
        {booking.status === "approved" && booking.paymentDeadline && (
          <p className="booking-deadline" style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "4px" }}>
            Payment deadline: {formatDeadline(booking.paymentDeadline)}
          </p>
        )}
      </div>
      <div className="booking-meta">
        <span>
          <CalendarDays size={16} style={{ color: "var(--primary)" }} />{" "}
          {formatDate(booking.bookingDate)}
        </span>
        <span>
          <Clock size={16} style={{ color: "var(--primary)" }} />{" "}
          {booking.startTime} - {booking.endTime}
        </span>
        <strong>₹{booking.totalPrice}</strong>
      </div>
      <div className="row-actions">
        {onCancel && (
          <button
            className="button danger"
            type="button"
            onClick={onCancel}
            disabled={isSubmittingAction}
          >
            Cancel
          </button>
        )}
        {onPay && (
          <button
            className="button primary"
            type="button"
            onClick={onPay}
            disabled={isSubmittingAction}
          >
            Pay Now
          </button>
        )}
        {(booking.status === "confirmed") && (onDownloadReceipt || onReceipt) && (
          <button
            className="button ghost"
            type="button"
            onClick={onDownloadReceipt || onReceipt}
            disabled={isSubmittingAction || isDownloadingReceipt}
            title={onDownloadReceipt ? "Download Receipt" : "View Receipt"}
          >
            {isDownloadingReceipt ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Downloading...
              </>
            ) : onDownloadReceipt ? (
              <>
                <Download size={15} /> Download Receipt
              </>
            ) : (
              <>
                <FileText size={15} /> View Receipt
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
