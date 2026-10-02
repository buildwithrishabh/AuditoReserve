import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  Download,
  Printer,
  X,
  CheckCircle,
  FileText,
  Loader2,
  Copy,
  Check,
  Building2,
  Calendar,
  Clock,
  ShieldCheck,
  User,
  CreditCard,
} from "lucide-react";
import { getBookingReceipt, downloadBookingReceiptPdf } from "../../api/payments";
import { useToast } from "../../hooks/useToast";
import "./receipt.css";

export function BookingReceiptModal({ isOpen, bookingId, onClose }) {
  const { showToast } = useToast();
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  useEffect(() => {
    if (!isOpen || !bookingId) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    getBookingReceipt(bookingId)
      .then((data) => {
        if (isMounted) setReceipt(data);
      })
      .catch((err) => {
        if (isMounted) {
          setError(err?.response?.data?.message || err.message || "Failed to load receipt");
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, bookingId]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleDownload = async () => {
    if (!bookingId || !receipt) return;
    try {
      setDownloading(true);
      await downloadBookingReceiptPdf(bookingId, receipt.receiptNumber);
      showToast("PDF receipt downloaded successfully.", "success");
    } catch (err) {
      showToast(err?.message || "Failed to download PDF receipt.", "error");
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const copyToClipboard = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(String(text));
    setCopiedField(fieldName);
    showToast(`Copied to clipboard`, "info");
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  const formatDate = (val) => {
    if (!val) return "N/A";
    const d = new Date(val);
    return Number.isNaN(d.getTime()) ? val : format(d, "dd MMM yyyy");
  };

  const formatDateTime = (val) => {
    if (!val) return "N/A";
    const d = new Date(val);
    return Number.isNaN(d.getTime()) ? val : format(d, "dd MMM yyyy, hh:mm a");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="receipt-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="receipt-modal-container"
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Actions Header */}
            <div className="receipt-modal-header no-print">
              <div className="receipt-modal-title">
                <div className="receipt-title-icon-box">
                  <FileText size={18} className="receipt-header-icon" />
                </div>
                <div>
                  <h3>Official Payment Receipt</h3>
                  <div className="receipt-title-sub">
                    <ShieldCheck size={13} className="text-emerald" />
                    <span>Verified Transaction Document</span>
                  </div>
                </div>
              </div>

              <div className="receipt-modal-controls">
                <button
                  type="button"
                  className="button secondary sm receipt-control-btn"
                  onClick={handlePrint}
                  disabled={loading || !receipt}
                  title="Print receipt"
                >
                  <Printer size={15} /> Print
                </button>
                <button
                  type="button"
                  className="button primary sm receipt-control-btn receipt-download-btn"
                  onClick={handleDownload}
                  disabled={loading || !receipt || downloading}
                  title="Download PDF Receipt"
                >
                  {downloading ? <Loader2 size={15} className="spinner" /> : <Download size={15} />}
                  {downloading ? "Downloading..." : "Download PDF"}
                </button>
                <button
                  type="button"
                  className="icon-button receipt-close-btn"
                  onClick={onClose}
                  aria-label="Close receipt"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Content / Printable Receipt Card */}
            <div className="receipt-card printable-area">
              {loading && (
                <div className="receipt-loading-state">
                  <Loader2 size={36} className="spinner receipt-loader-icon" />
                  <h4>Generating Receipt Preview</h4>
                  <p>Fetching verified transaction records from server...</p>
                </div>
              )}

              {error && (
                <div className="receipt-error-state">
                  <p className="error-text">{error}</p>
                  <button type="button" className="button ghost" onClick={onClose}>
                    Close Window
                  </button>
                </div>
              )}

              {!loading && !error && receipt && (
                <div className="receipt-document">
                  {/* Top Branding Bar */}
                  <div className="receipt-doc-header">
                    <div className="receipt-brand-col">
                      <div className="receipt-logo-mark">AR</div>
                      <div>
                        <h2 className="receipt-brand">AuditoReserve</h2>
                        <p className="receipt-subtext">Auditorium Reservation & Facility Management</p>
                        <p className="receipt-org">Official Electronic Payment Receipt</p>
                      </div>
                    </div>

                    <div className="receipt-meta-box">
                      <div className="receipt-status-pill">
                        <CheckCircle size={14} /> PAID IN FULL
                      </div>
                      <div className="receipt-number-row">
                        <span className="receipt-num-label">Receipt #</span>
                        <code className="receipt-number-code">{receipt.receiptNumber}</code>
                        <button
                          type="button"
                          className="receipt-mini-copy-btn"
                          onClick={() => copyToClipboard(receipt.receiptNumber, "receipt")}
                          title="Copy Receipt Number"
                        >
                          {copiedField === "receipt" ? (
                            <Check size={12} className="text-emerald" />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      </div>
                      <p className="receipt-date">
                        Issued: {formatDateTime(receipt.paidAt || Date.now())}
                      </p>
                    </div>
                  </div>

                  <hr className="receipt-divider" />

                  {/* 2-Column Info: Billed To & Facility */}
                  <div className="receipt-info-grid">
                    <div className="receipt-info-block">
                      <div className="info-block-header">
                        <User size={13} className="info-header-icon" />
                        <span className="info-label">BILLED TO</span>
                      </div>
                      <h4>{receipt.user?.name || "Customer"}</h4>
                      <p className="info-subtext">{receipt.user?.email}</p>
                      <div className="booking-ref-row">
                        <span className="subtle-code">ID: {receipt.booking?.id}</span>
                        <button
                          type="button"
                          className="receipt-mini-copy-btn"
                          onClick={() => copyToClipboard(receipt.booking?.id, "booking")}
                          title="Copy Booking ID"
                        >
                          {copiedField === "booking" ? (
                            <Check size={11} className="text-emerald" />
                          ) : (
                            <Copy size={11} />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="receipt-info-block">
                      <div className="info-block-header">
                        <Building2 size={13} className="info-header-icon" />
                        <span className="info-label">RESERVED FACILITY</span>
                      </div>
                      <h4>{receipt.auditorium?.name || "Auditorium Facility"}</h4>
                      <p className="info-subtext">
                        {receipt.auditorium?.description || (Array.isArray(receipt.auditorium?.amenities) && receipt.auditorium.amenities.length > 0 ? receipt.auditorium.amenities.join(", ") : "Campus Venue")}
                      </p>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "6px" }}>
                        <span className="capacity-badge">
                          Capacity: {receipt.auditorium?.capacity || "Full"} seats
                        </span>
                        {receipt.auditorium?.basePrice ? (
                          <span className="capacity-badge">
                            Rate: ₹{receipt.auditorium.basePrice}/hr
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Reservation Schedule Box */}
                  <div className="receipt-schedule-card">
                    <div className="schedule-header">
                      <Calendar size={14} className="info-header-icon" />
                      <span>Reservation Schedule</span>
                    </div>
                    <div className="schedule-content">
                      <div className="schedule-purpose">
                        <span className="schedule-item-label">Purpose / Event</span>
                        <p className="schedule-item-val">
                          {receipt.booking?.purpose || "Auditorium Reservation"}
                        </p>
                      </div>
                      <div className="schedule-timing-group">
                        <div className="schedule-time-item">
                          <span className="schedule-item-label">Date</span>
                          <span className="schedule-time-val">
                            {formatDate(receipt.booking?.date)}
                          </span>
                        </div>
                        <div className="schedule-time-item">
                          <span className="schedule-item-label">Time Slot</span>
                          <span className="schedule-time-val slot-pill">
                            <Clock size={12} /> {receipt.booking?.startTime} - {receipt.booking?.endTime}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Financial Breakdown Table */}
                  <div className="receipt-table-wrapper">
                    <table className="receipt-table">
                      <thead>
                        <tr>
                          <th>Item Description</th>
                          <th>Payment Method</th>
                          <th style={{ textAlign: "right" }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>
                            <div className="table-item-title">
                              Facility Booking ({receipt.booking?.startTime} - {receipt.booking?.endTime})
                            </div>
                            <div className="table-item-desc">
                              Auditorium reservation & maintenance charges
                            </div>
                          </td>
                          <td>
                            <div className="payment-method-pill">
                              <CreditCard size={13} />
                              <span>Razorpay ({receipt.paymentId ? "Online" : "Confirmed"})</span>
                            </div>
                          </td>
                          <td style={{ textAlign: "right", fontWeight: 700, fontSize: "14px" }}>
                            ₹{receipt.amount?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                        <tr className="receipt-total-row">
                          <td colSpan="2" className="total-label-cell">
                            Total Paid (All taxes included):
                          </td>
                          <td className="total-amount-cell">
                            ₹{receipt.amount?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Transaction Metadata & Verification Box */}
                  <div className="receipt-meta-footer">
                    <div className="meta-footer-left">
                      <div className="meta-footer-row">
                        <span className="meta-label">Razorpay Order ID:</span>
                        <code>{receipt.orderId}</code>
                        <button
                          type="button"
                          className="receipt-mini-copy-btn"
                          onClick={() => copyToClipboard(receipt.orderId, "order")}
                          title="Copy Order ID"
                        >
                          {copiedField === "order" ? (
                            <Check size={11} className="text-emerald" />
                          ) : (
                            <Copy size={11} />
                          )}
                        </button>
                      </div>
                      <div className="meta-footer-row">
                        <span className="meta-label">Payment Transaction ID:</span>
                        <code>{receipt.paymentId || "Confirmed"}</code>
                        <button
                          type="button"
                          className="receipt-mini-copy-btn"
                          onClick={() => copyToClipboard(receipt.paymentId, "payment")}
                          title="Copy Payment ID"
                        >
                          {copiedField === "payment" ? (
                            <Check size={11} className="text-emerald" />
                          ) : (
                            <Copy size={11} />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="meta-footer-right">
                      <div className="cert-verified-pill">
                        <ShieldCheck size={15} />
                        <span>Verified Transaction</span>
                      </div>
                      <span className="currency-tag">Currency: {receipt.currency || "INR"}</span>
                    </div>
                  </div>

                  {/* Disclaimer / Notice */}
                  <div className="receipt-footer-disclaimer">
                    <p>
                      Official electronic computer-generated receipt issued by AuditoReserve. No physical signature required.
                    </p>
                    <p>
                      Please carry a digital or printed copy of this receipt during auditorium entry and check-in.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default BookingReceiptModal;
