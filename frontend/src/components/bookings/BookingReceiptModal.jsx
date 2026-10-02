import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Download, Printer, X, CheckCircle, FileText, Loader2 } from "lucide-react";
import { getBookingReceipt, downloadBookingReceiptPdf } from "../../api/payments";
import { useToast } from "../../hooks/useToast";
import "./receipt.css";

export function BookingReceiptModal({ isOpen, bookingId, onClose }) {
  const { showToast } = useToast();
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);

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

  const handleDownload = async () => {
    if (!bookingId || !receipt) return;
    try {
      setDownloading(true);
      await downloadBookingReceiptPdf(bookingId, receipt.receiptNumber);
      showToast("Receipt downloaded successfully.", "success");
    } catch (err) {
      showToast(err?.message || "Failed to download PDF receipt.", "error");
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (val) => {
    if (!val) return "N/A";
    const d = new Date(val);
    return Number.isNaN(d.getTime()) ? val : format(d, "dd MMM yyyy");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="confirm-overlay receipt-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="receipt-modal-container"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Actions Header */}
            <div className="receipt-modal-header no-print">
              <div className="receipt-modal-title">
                <FileText size={20} className="receipt-header-icon" />
                <h3>Official Payment Receipt</h3>
              </div>
              <div className="receipt-modal-controls">
                <button
                  type="button"
                  className="button secondary sm"
                  onClick={handlePrint}
                  disabled={loading || !receipt}
                  title="Print receipt"
                >
                  <Printer size={15} /> Print
                </button>
                <button
                  type="button"
                  className="button primary sm"
                  onClick={handleDownload}
                  disabled={loading || !receipt || downloading}
                  title="Download PDF"
                >
                  {downloading ? <Loader2 size={15} className="spinner" /> : <Download size={15} />}
                  {downloading ? "Downloading..." : "Download PDF"}
                </button>
                <button
                  type="button"
                  className="icon-button"
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
                  <Loader2 size={32} className="spinner" />
                  <p>Generating receipt preview...</p>
                </div>
              )}

              {error && (
                <div className="receipt-error-state">
                  <p className="error-text">{error}</p>
                  <button type="button" className="button ghost" onClick={onClose}>
                    Close
                  </button>
                </div>
              )}

              {!loading && !error && receipt && (
                <div className="receipt-document">
                  {/* Top Branding */}
                  <div className="receipt-doc-header">
                    <div>
                      <h2 className="receipt-brand">AuditoReserve</h2>
                      <p className="receipt-subtext">University Auditorium Booking System</p>
                    </div>
                    <div className="receipt-meta-box">
                      <span className="receipt-status-badge">
                        <CheckCircle size={14} /> PAID
                      </span>
                      <p className="receipt-number">Receipt #{receipt.receiptNumber}</p>
                      <p className="receipt-date">
                        Issued: {formatDate(receipt.paidAt || Date.now())}
                      </p>
                    </div>
                  </div>

                  <hr className="receipt-divider" />

                  {/* 2-Column Info: Billed To & Auditorium */}
                  <div className="receipt-info-grid">
                    <div className="receipt-info-block">
                      <span className="info-label">BILLED TO</span>
                      <h4>{receipt.user?.name}</h4>
                      <p>{receipt.user?.email}</p>
                      <p className="subtle-code">Booking ID: {receipt.booking?.id}</p>
                    </div>
                    <div className="receipt-info-block">
                      <span className="info-label">FACILITY RESERVED</span>
                      <h4>{receipt.auditorium?.name}</h4>
                      <p>Location: {receipt.auditorium?.location || "Campus"}</p>
                      <p>Capacity: {receipt.auditorium?.capacity} seats</p>
                    </div>
                  </div>

                  {/* Schedule Details Table */}
                  <div className="receipt-table-wrapper">
                    <table className="receipt-table">
                      <thead>
                        <tr>
                          <th>Purpose / Event</th>
                          <th>Booking Date</th>
                          <th>Time Slot</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>{receipt.booking?.purpose || "Auditorium Reservation"}</td>
                          <td>{formatDate(receipt.booking?.date)}</td>
                          <td>
                            {receipt.booking?.startTime} - {receipt.booking?.endTime}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Financial Breakdown Table */}
                  <div className="receipt-table-wrapper" style={{ marginTop: "16px" }}>
                    <table className="receipt-table">
                      <thead>
                        <tr>
                          <th>Description</th>
                          <th>Payment Method</th>
                          <th style={{ textAlign: "right" }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>
                            Facility Booking ({receipt.booking?.startTime} - {receipt.booking?.endTime})
                          </td>
                          <td>Razorpay ({receipt.paymentId || "Online"})</td>
                          <td style={{ textAlign: "right", fontWeight: 700 }}>
                            ₹{receipt.amount?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                        <tr className="receipt-total-row">
                          <td colSpan="2" style={{ textAlign: "right", fontWeight: 700 }}>
                            Total Paid:
                          </td>
                          <td style={{ textAlign: "right", fontWeight: 800, color: "var(--primary)" }}>
                            ₹{receipt.amount?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Transaction Metadata Footer */}
                  <div className="receipt-meta-footer">
                    <div>
                      <p>
                        <strong>Razorpay Order ID:</strong> {receipt.orderId}
                      </p>
                      <p>
                        <strong>Razorpay Payment ID:</strong> {receipt.paymentId || "Confirmed"}
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p>
                        <strong>Currency:</strong> {receipt.currency || "INR"}
                      </p>
                      <p>
                        <strong>Payment Status:</strong> Successful
                      </p>
                    </div>
                  </div>

                  <p className="receipt-footer-disclaimer">
                    Notice: This is a verified electronic receipt generated by AuditoReserve. Please keep a digital or printed copy handy during facility entry.
                  </p>
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
