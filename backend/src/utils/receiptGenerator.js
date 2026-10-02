const PDFDocument = require("pdfkit");

/**
 * Generates an official PDF receipt for a confirmed booking payment.
 * @param {Object} data - Contains booking, payment, user, auditorium details
 * @param {stream.Writable} stream - Destination stream (e.g. Express res)
 */
function buildReceiptPdf(data, stream) {
  const { booking, payment, user, auditorium } = data;

  const doc = new PDFDocument({
    size: "A4",
    margin: 45,
    info: {
      Title: `Receipt - ${payment.receipt}`,
      Author: "AuditoReserve",
      Subject: "Auditorium Booking Payment Receipt",
    },
  });

  doc.pipe(stream);

  const primaryColor = "#4338CA"; // Indigo 700
  const secondaryColor = "#1E293B"; // Slate 800
  const mutedColor = "#64748B"; // Slate 500
  const borderColor = "#E2E8F0"; // Slate 200
  const bgLight = "#F8FAFC"; // Slate 50

  // ---------------- HEADER ----------------
  doc
    .fillColor(primaryColor)
    .fontSize(22)
    .font("Helvetica-Bold")
    .text("AuditoReserve", 45, 45);

  doc
    .fontSize(9)
    .font("Helvetica")
    .fillColor(mutedColor)
    .text("Campus Facility & Auditorium Booking System", 45, 72);

  doc
    .fillColor(secondaryColor)
    .fontSize(16)
    .font("Helvetica-Bold")
    .text("PAYMENT RECEIPT", 360, 45, { align: "right", width: 190 });

  doc
    .fontSize(9)
    .font("Helvetica")
    .fillColor(mutedColor)
    .text(`Receipt #: ${payment.receipt}`, 360, 66, { align: "right", width: 190 })
    .text(
      `Date: ${new Date(payment.paidAt || Date.now()).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })}`,
      360,
      79,
      { align: "right", width: 190 }
    );

  // Divider Line
  doc
    .moveTo(45, 105)
    .lineTo(550, 105)
    .strokeColor(borderColor)
    .lineWidth(1)
    .stroke();

  // ---------------- BILLING & FACILITY INFO ----------------
  const infoY = 120;

  // Box 1: Billed To
  doc
    .roundedRect(45, infoY, 245, 80, 6)
    .fillAndStroke(bgLight, borderColor);

  doc
    .fillColor(primaryColor)
    .font("Helvetica-Bold")
    .fontSize(10)
    .text("BILLED TO", 55, infoY + 10);

  doc
    .fillColor(secondaryColor)
    .font("Helvetica-Bold")
    .fontSize(11)
    .text(user.name || "Student / Faculty", 55, infoY + 26);

  doc
    .fillColor(mutedColor)
    .font("Helvetica")
    .fontSize(9)
    .text(user.email, 55, infoY + 42)
    .text(`Booking ID: ${booking._id.toString()}`, 55, infoY + 56);

  // Box 2: Facility Details
  doc
    .roundedRect(305, infoY, 245, 80, 6)
    .fillAndStroke(bgLight, borderColor);

  doc
    .fillColor(primaryColor)
    .font("Helvetica-Bold")
    .fontSize(10)
    .text("FACILITY RESERVED", 315, infoY + 10);

  doc
    .fillColor(secondaryColor)
    .font("Helvetica-Bold")
    .fontSize(11)
    .text(auditorium.name || "Auditorium Facility", 315, infoY + 26);

  doc
    .fillColor(mutedColor)
    .font("Helvetica")
    .fontSize(9)
    .text(`Location: ${auditorium.location || "Main Campus"}`, 315, infoY + 42)
    .text(`Capacity: ${auditorium.capacity ? auditorium.capacity + " seats" : "N/A"}`, 315, infoY + 56);

  // ---------------- RESERVATION SCHEDULE ----------------
  const scheduleY = 215;

  doc
    .fillColor(secondaryColor)
    .font("Helvetica-Bold")
    .fontSize(12)
    .text("Reservation Schedule", 45, scheduleY);

  const formattedDate = booking.bookingDate
    ? new Date(booking.bookingDate).toLocaleDateString("en-IN", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "N/A";

  const detailsTableY = scheduleY + 20;

  // Header Bar
  doc
    .rect(45, detailsTableY, 505, 24)
    .fill(primaryColor);

  doc
    .fillColor("#FFFFFF")
    .font("Helvetica-Bold")
    .fontSize(9)
    .text("EVENT / PURPOSE", 55, detailsTableY + 7)
    .text("BOOKING DATE", 250, detailsTableY + 7)
    .text("TIME SLOT", 400, detailsTableY + 7);

  // Row
  doc
    .rect(45, detailsTableY + 24, 505, 32)
    .fillAndStroke(bgLight, borderColor);

  doc
    .fillColor(secondaryColor)
    .font("Helvetica")
    .fontSize(9)
    .text(booking.purpose || "Auditorium Booking", 55, detailsTableY + 34, { width: 185, lineBreak: false })
    .text(formattedDate, 250, detailsTableY + 34)
    .text(`${booking.startTime} - ${booking.endTime}`, 400, detailsTableY + 34);

  // ---------------- PAYMENT BREAKDOWN TABLE ----------------
  const paymentTableY = detailsTableY + 75;

  doc
    .fillColor(secondaryColor)
    .font("Helvetica-Bold")
    .fontSize(12)
    .text("Payment Breakdown", 45, paymentTableY);

  const tableHeaderY = paymentTableY + 20;

  // Table Header
  doc
    .rect(45, tableHeaderY, 505, 24)
    .fill("#1E293B");

  doc
    .fillColor("#FFFFFF")
    .font("Helvetica-Bold")
    .fontSize(9)
    .text("DESCRIPTION", 55, tableHeaderY + 7)
    .text("GATEWAY REF", 280, tableHeaderY + 7)
    .text("AMOUNT (INR)", 450, tableHeaderY + 7, { align: "right", width: 90 });

  // Table Item Row
  const itemRowY = tableHeaderY + 24;
  doc
    .rect(45, itemRowY, 505, 35)
    .fillAndStroke("#FFFFFF", borderColor);

  doc
    .fillColor(secondaryColor)
    .font("Helvetica")
    .fontSize(9)
    .text(`Auditorium Slot Reservation (${booking.startTime} - ${booking.endTime})`, 55, itemRowY + 12)
    .text(payment.gatewayPaymentId || payment.gatewayOrderId || "N/A", 280, itemRowY + 12)
    .font("Helvetica-Bold")
    .text(`INR ${payment.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, 450, itemRowY + 12, {
      align: "right",
      width: 90,
    });

  // Summary Rows
  const totalRowY = itemRowY + 35;
  doc
    .rect(45, totalRowY, 505, 38)
    .fillAndStroke(bgLight, borderColor);

  doc
    .fillColor(secondaryColor)
    .font("Helvetica-Bold")
    .fontSize(11)
    .text("Total Paid:", 330, totalRowY + 13)
    .fillColor(primaryColor)
    .fontSize(13)
    .text(`INR ${payment.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, 450, totalRowY + 12, {
      align: "right",
      width: 90,
    });

  // ---------------- PAYMENT METADATA & BADGE ----------------
  const metaY = totalRowY + 55;

  doc
    .roundedRect(45, metaY, 505, 60, 6)
    .fillAndStroke(bgLight, borderColor);

  doc
    .fillColor("#15803D") // Green 700
    .font("Helvetica-Bold")
    .fontSize(10)
    .text("STATUS: PAID (CONFIRMED)", 55, metaY + 12);

  doc
    .fillColor(mutedColor)
    .font("Helvetica")
    .fontSize(8.5)
    .text(`Payment Gateway: Razorpay`, 55, metaY + 28)
    .text(`Razorpay Order ID: ${payment.gatewayOrderId || "N/A"}`, 55, metaY + 40)
    .text(`Payment ID: ${payment.gatewayPaymentId || "N/A"}`, 280, metaY + 28)
    .text(
      `Paid At: ${
        payment.paidAt
          ? new Date(payment.paidAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) + " IST"
          : "Confirmed"
      }`,
      280,
      metaY + 40
    );

  // ---------------- FOOTER & NOTES ----------------
  doc
    .moveTo(45, 740)
    .lineTo(550, 740)
    .strokeColor(borderColor)
    .lineWidth(1)
    .stroke();

  doc
    .fillColor(mutedColor)
    .font("Helvetica")
    .fontSize(8)
    .text(
      "Notice: This is an official computer-generated receipt issued by AuditoReserve. Please carry a digital or printed copy during event check-in.",
      45,
      750,
      { align: "center", width: 505 }
    )
    .text(
      "For queries or rescheduling policies, contact the facility administration.",
      45,
      764,
      { align: "center", width: 505 }
    );

  doc.end();
}

module.exports = {
  buildReceiptPdf,
};
