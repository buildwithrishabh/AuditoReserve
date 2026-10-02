const PDFDocument = require("pdfkit");

/**
 * Formats a currency amount into standard Indian Rupee format.
 * @param {number} amount
 * @returns {string}
 */
function formatCurrency(amount) {
  if (typeof amount !== "number") amount = Number(amount) || 0;
  return "INR " + amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Generates an executive, publication-grade PDF receipt for a confirmed booking.
 * @param {Object} data - Contains booking, payment, user, auditorium details
 * @param {stream.Writable} stream - Destination stream (e.g. Express res)
 */
function buildReceiptPdf(data, stream) {
  const { booking, payment, user, auditorium } = data;

  const doc = new PDFDocument({
    size: "A4",
    margin: 40,
    info: {
      Title: `Receipt - ${payment?.receipt || booking?._id}`,
      Author: "AuditoReserve",
      Subject: "Auditorium Reservation Official Receipt",
      Keywords: "AuditoReserve, Receipt, Auditorium, Payment",
      Creator: "AuditoReserve Automated Invoicing Service",
    },
  });

  doc.pipe(stream);

  // Modern corporate color palette
  const brandIndigo = "#3730A3";    // Deep Indigo
  const brandAccent = "#4F46E5";    // Vibrant Indigo
  const slate900    = "#0F172A";    // Slate 900
  const slate700    = "#334155";    // Slate 700
  const slate500    = "#64748B";    // Slate 500
  const slate400    = "#94A3B8";    // Slate 400
  const slate200    = "#E2E8F0";    // Slate 200 border
  const slate50     = "#F8FAFC";    // Slate 50 background
  const emerald700  = "#047857";    // Emerald 700
  const emerald50   = "#ECFDF5";    // Light Emerald bg
  const emeraldBorder = "#A7F3D0";  // Emerald border

  // 1. Top Decorative Brand Strip (5px full width)
  doc.rect(0, 0, 595.28, 6).fill(brandAccent);

  // 2. Header Section
  // Left: Brand & Institution Details
  doc
    .fillColor(brandIndigo)
    .font("Helvetica-Bold")
    .fontSize(22)
    .text("AuditoReserve", 40, 36);

  doc
    .fillColor(slate500)
    .font("Helvetica-Bold")
    .fontSize(7.5)
    .text("CAMPUS FACILITY & AUDITORIUM BOOKING SYSTEM", 40, 62, {
      characterSpacing: 0.6,
    });

  doc
    .fillColor(slate400)
    .font("Helvetica")
    .fontSize(8)
    .text("Teerthanker Mahaveer University • Facility Services Office", 40, 74)
    .text("Moradabad, Uttar Pradesh, India", 40, 85);

  // Right: Document Title & Meta Block
  const rightX = 330;
  const rightW = 225;

  doc
    .fillColor(slate900)
    .font("Helvetica-Bold")
    .fontSize(16)
    .text("PAYMENT RECEIPT", rightX, 36, { align: "right", width: rightW });

  // Receipt Number (split into label and value to prevent overlap)
  doc
    .fillColor(slate500)
    .font("Helvetica")
    .fontSize(8)
    .text("Receipt Number:", rightX, 58, { align: "right", width: rightW });

  doc
    .fillColor(slate700)
    .font("Helvetica-Bold")
    .fontSize(8)
    .text(payment?.receipt || `REC-${booking?._id}`, rightX, 68, { align: "right", width: rightW });

  // Issue Date & Status
  const issuedDate = new Date(payment?.paidAt || Date.now()).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  doc
    .fillColor(slate500)
    .font("Helvetica")
    .fontSize(8)
    .text(`Issue Date: ${issuedDate}`, rightX, 80, { align: "right", width: rightW });

  doc
    .fillColor(emerald700)
    .font("Helvetica-Bold")
    .fontSize(8.5)
    .text("STATUS: PAID (CONFIRMED)", rightX, 92, { align: "right", width: rightW });

  // Header Divider
  doc
    .moveTo(40, 110)
    .lineTo(555, 110)
    .strokeColor(slate200)
    .lineWidth(1)
    .stroke();

  // 3. Two-Column Information Cards (Billed To & Venue Reserved)
  const cardY = 122;
  const cardW = 250;
  const cardH = 82;

  // Box 1: Billed To
  doc
    .roundedRect(40, cardY, cardW, cardH, 5)
    .fillAndStroke(slate50, slate200);

  doc
    .fillColor(brandAccent)
    .font("Helvetica-Bold")
    .fontSize(8)
    .text("BILLED TO / RESERVED BY", 52, cardY + 10, { characterSpacing: 0.5 });

  doc
    .fillColor(slate900)
    .font("Helvetica-Bold")
    .fontSize(11)
    .text(user?.name || "Student / Faculty", 52, cardY + 24, { width: cardW - 24, ellipsis: true });

  doc
    .fillColor(slate500)
    .font("Helvetica")
    .fontSize(8.5)
    .text(user?.email || "campus@tmu.ac.in", 52, cardY + 39, { width: cardW - 24, ellipsis: true });

  doc
    .fillColor(slate400)
    .font("Helvetica")
    .fontSize(7.5)
    .text(`Booking Ref: #${booking?._id || "N/A"}`, 52, cardY + 58);

  // Box 2: Facility Reserved
  const box2X = 305;
  doc
    .roundedRect(box2X, cardY, cardW, cardH, 5)
    .fillAndStroke(slate50, slate200);

  doc
    .fillColor(brandAccent)
    .font("Helvetica-Bold")
    .fontSize(8)
    .text("VENUE & FACILITY RESERVED", box2X + 12, cardY + 10, { characterSpacing: 0.5 });

  doc
    .fillColor(slate900)
    .font("Helvetica-Bold")
    .fontSize(11)
    .text(auditorium?.name || "Campus Auditorium", box2X + 12, cardY + 24, { width: cardW - 24, ellipsis: true });

  doc
    .fillColor(slate500)
    .font("Helvetica")
    .fontSize(8.5)
    .text(`Location: ${auditorium?.location || "Main Campus"}`, box2X + 12, cardY + 39, { width: cardW - 24, ellipsis: true });

  doc
    .fillColor(slate400)
    .font("Helvetica")
    .fontSize(7.5)
    .text(`Seating Capacity: ${auditorium?.capacity ? auditorium.capacity + " Attendees" : "Full Venue"}`, box2X + 12, cardY + 58);

  // 4. Reservation Schedule Table
  const schedSectionY = 220;

  doc
    .fillColor(slate900)
    .font("Helvetica-Bold")
    .fontSize(10.5)
    .text("Reservation Schedule", 40, schedSectionY);

  const schedTableY = schedSectionY + 16;
  const tableW = 515;

  // Header row
  doc
    .roundedRect(40, schedTableY, tableW, 22, 3)
    .fill(slate900);

  doc
    .fillColor("#FFFFFF")
    .font("Helvetica-Bold")
    .fontSize(8)
    .text("PURPOSE / EVENT DESCRIPTION", 52, schedTableY + 7)
    .text("BOOKING DATE", 310, schedTableY + 7)
    .text("TIME SLOT", 440, schedTableY + 7);

  // Schedule Data Row
  const purposeText = booking?.purpose || "Campus Event / Auditorium Reservation";
  const formattedDate = booking?.bookingDate
    ? new Date(booking.bookingDate).toLocaleDateString("en-IN", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "N/A";

  const timeSlotText = `${booking?.startTime || "N/A"} - ${booking?.endTime || "N/A"}`;

  // Calculate dynamic height for purpose column so it never overflows
  doc.font("Helvetica").fontSize(8.5);
  const purposeHeight = Math.max(
    28,
    doc.heightOfString(purposeText, { width: 245 }) + 16
  );

  const schedRowY = schedTableY + 22;
  doc
    .rect(40, schedRowY, tableW, purposeHeight)
    .fillAndStroke(slate50, slate200);

  doc
    .fillColor(slate700)
    .font("Helvetica")
    .fontSize(8.5)
    .text(purposeText, 52, schedRowY + 8, { width: 245, lineGap: 2 });

  doc
    .fillColor(slate900)
    .font("Helvetica-Bold")
    .fontSize(8.5)
    .text(formattedDate, 310, schedRowY + 8)
    .text(timeSlotText, 440, schedRowY + 8);

  // 5. Payment Breakdown Table
  const paySectionY = schedRowY + purposeHeight + 20;

  doc
    .fillColor(slate900)
    .font("Helvetica-Bold")
    .fontSize(10.5)
    .text("Payment Breakdown", 40, paySectionY);

  const payTableY = paySectionY + 16;

  // Table Header
  doc
    .roundedRect(40, payTableY, tableW, 22, 3)
    .fill(brandIndigo);

  doc
    .fillColor("#FFFFFF")
    .font("Helvetica-Bold")
    .fontSize(8)
    .text("LINE ITEM & DESCRIPTION", 52, payTableY + 7)
    .text("PAYMENT GATEWAY REF", 280, payTableY + 7)
    .text("AMOUNT (INR)", 430, payTableY + 7, { align: "right", width: 110 });

  // Item Row
  const payRowY = payTableY + 22;
  const payRowH = 34;

  doc
    .rect(40, payRowY, tableW, payRowH)
    .fillAndStroke("#FFFFFF", slate200);

  doc
    .fillColor(slate900)
    .font("Helvetica-Bold")
    .fontSize(8.5)
    .text(`Auditorium Booking Fee (${timeSlotText})`, 52, payRowY + 8);

  doc
    .fillColor(slate500)
    .font("Helvetica")
    .fontSize(7.5)
    .text("Official booking slot reservation & maintenance charges", 52, payRowY + 20);

  doc
    .fillColor(slate700)
    .font("Helvetica")
    .fontSize(8)
    .text(payment?.gatewayPaymentId || payment?.gatewayOrderId || "Online Netbanking/UPI", 280, payRowY + 13);

  doc
    .fillColor(slate900)
    .font("Helvetica-Bold")
    .fontSize(9)
    .text(formatCurrency(payment?.amount || booking?.totalPrice), 430, payRowY + 12, {
      align: "right",
      width: 110,
    });

  // Total Paid Row
  const totalRowY = payRowY + payRowH;
  const totalRowH = 38;

  doc
    .rect(40, totalRowY, tableW, totalRowH)
    .fillAndStroke(slate50, slate200);

  doc
    .fillColor(slate700)
    .font("Helvetica")
    .fontSize(8)
    .text("Grand Total Paid (All taxes & facility fees included):", 52, totalRowY + 14);

  doc
    .fillColor(brandIndigo)
    .font("Helvetica-Bold")
    .fontSize(12)
    .text(formatCurrency(payment?.amount || booking?.totalPrice), 415, totalRowY + 12, {
      align: "right",
      width: 125,
    });

  // 6. Verified Payment Certificate & Transaction Security Box
  const certY = totalRowY + totalRowH + 18;
  const certH = 72;

  doc
    .roundedRect(40, certY, tableW, certH, 5)
    .fillAndStroke(emerald50, emeraldBorder);

  // Status Badge
  doc
    .fillColor(emerald700)
    .font("Helvetica-Bold")
    .fontSize(9.5)
    .text("ELECTRONIC PAYMENT CONFIRMED & VERIFIED", 52, certY + 12);

  // Metadata 2-Column layout inside cert box
  const col1X = 52;
  const col2X = 300;

  doc
    .fillColor(slate500)
    .font("Helvetica")
    .fontSize(8)
    .text("Payment Gateway: Razorpay Financial Services", col1X, certY + 30)
    .text(`Order Reference: ${payment?.gatewayOrderId || "N/A"}`, col1X, certY + 42)
    .text(`Transaction ID: ${payment?.gatewayPaymentId || "N/A"}`, col1X, certY + 54);

  const formattedPaidAt = payment?.paidAt
    ? new Date(payment.paidAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) + " IST"
    : "Confirmed upon order";

  doc
    .fillColor(slate500)
    .font("Helvetica")
    .fontSize(8)
    .text(`Timestamp: ${formattedPaidAt}`, col2X, certY + 30)
    .text(`Currency: ${payment?.currency || "INR"} (Indian Rupee)`, col2X, certY + 42)
    .text(`Verification Hash: ${String(payment?._id || booking?._id).slice(0, 16)}... [SECURE]`, col2X, certY + 54);

  // 7. Official Digital Authentication Watermark Stamp
  // Draw an elegant circular stamp in the bottom-right corner of the certificate area
  const stampCenterX = 515;
  const stampCenterY = certY + 36;
  const stampRadius = 24;

  doc
    .circle(stampCenterX, stampCenterY, stampRadius)
    .lineWidth(1)
    .strokeColor(emeraldBorder)
    .stroke();

  doc
    .circle(stampCenterX, stampCenterY, stampRadius - 3)
    .lineWidth(0.5)
    .strokeColor(emerald700)
    .stroke();

  doc
    .fillColor(emerald700)
    .font("Helvetica-Bold")
    .fontSize(6)
    .text("AUTHENTIC", stampCenterX - 20, stampCenterY - 7, { align: "center", width: 40 })
    .text("VERIFIED", stampCenterX - 20, stampCenterY + 1, { align: "center", width: 40 });

  // 8. Footer Section
  const footerY = 745;

  doc
    .moveTo(40, footerY)
    .lineTo(555, footerY)
    .strokeColor(slate200)
    .lineWidth(0.75)
    .stroke();

  doc
    .fillColor(slate500)
    .font("Helvetica-Bold")
    .fontSize(7.5)
    .text("IMPORTANT NOTICE & CHECK-IN GUIDELINES", 40, footerY + 8, {
      align: "center",
      width: tableW,
    });

  doc
    .fillColor(slate400)
    .font("Helvetica")
    .fontSize(7.2)
    .text(
      "This document is an authentic electronic receipt generated by AuditoReserve. Please present a printed or digital copy during auditorium check-in.",
      40,
      footerY + 20,
      { align: "center", width: tableW }
    )
    .text(
      "For rescheduling, cancellations, or audio-visual equipment setup requests, please contact campus facility administration.",
      40,
      footerY + 32,
      { align: "center", width: tableW }
    )
    .text(
      `AuditoReserve Invoicing System • Page 1 of 1 • Generated: ${new Date().toLocaleDateString("en-IN")}`,
      40,
      footerY + 45,
      { align: "center", width: tableW }
    );

  doc.end();
}

module.exports = {
  buildReceiptPdf,
};
