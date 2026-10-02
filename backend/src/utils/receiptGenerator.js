const PDFDocument = require("pdfkit");

/**
 * Formats a currency amount into standard Indian Rupee format.
 * @param {number} amount
 * @returns {string}
 */
function formatCurrency(amount) {
  const num = typeof amount === "number" ? amount : Number(amount) || 0;
  return "INR " + num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Generates an executive, single-page PDF receipt for verified booking payments.
 * @param {Object} data - Contains booking, payment, user, auditorium details
 * @param {stream.Writable} stream - Destination stream (e.g. Express res)
 */
function buildReceiptPdf(data, stream) {
  const { booking = {}, payment = {}, user = {}, auditorium = {} } = data;

  const doc = new PDFDocument({
    size: "A4",
    margin: 40,
    info: {
      Title: `Payment Receipt - ${payment.receipt || booking._id}`,
      Author: "AuditoReserve",
      Subject: "Auditorium Booking Payment Receipt",
      Keywords: "AuditoReserve, Receipt, Payment, Auditorium",
      Creator: "AuditoReserve System",
    },
  });

  doc.pipe(stream);

  // Consistent, readable color palette
  const primaryColor = "#3730A3";   // Deep Indigo
  const accentColor  = "#4F46E5";   // Vibrant Indigo
  const slate900     = "#0F172A";   // Slate 900
  const slate700     = "#334155";   // Slate 700
  const slate500     = "#64748B";   // Slate 500
  const slate400     = "#94A3B8";   // Slate 400
  const slate200     = "#E2E8F0";   // Border Slate 200
  const slate50      = "#F8FAFC";   // Background Slate 50
  const emerald700   = "#047857";   // Status Paid Green
  const emerald50    = "#ECFDF5";   // Status Box Bg
  const emeraldBorder= "#A7F3D0";   // Status Box Border

  const pageWidth = 595.28;
  const contentWidth = 515.28;
  const startX = 40;

  // 1. Top Decorative Brand Bar
  doc.rect(0, 0, pageWidth, 5).fill(accentColor);

  // 2. Header: Organization Info (Left) & Receipt Metadata (Right)
  // Left: Brand
  doc
    .fillColor(primaryColor)
    .font("Helvetica-Bold")
    .fontSize(20)
    .text("AuditoReserve", startX, 35);

  doc
    .fillColor(slate500)
    .font("Helvetica-Bold")
    .fontSize(7.5)
    .text("AUDITORIUM RESERVATION & MANAGEMENT SYSTEM", startX, 58, { characterSpacing: 0.5 });

  doc
    .fillColor(slate400)
    .font("Helvetica")
    .fontSize(8)
    .text("Official Electronic Payment Receipt", startX, 70);

  // Right: Receipt & Paid Status
  const rightX = 330;
  const rightW = 225;

  doc
    .fillColor(slate900)
    .font("Helvetica-Bold")
    .fontSize(15)
    .text("PAYMENT RECEIPT", rightX, 35, { align: "right", width: rightW });

  // Generate unique receipt number if missing
  const receiptNumber = payment.receipt || `AR-${new Date(payment.paidAt || Date.now()).getFullYear()}-${String(booking._id || "").slice(-6).toUpperCase()}-${Date.now().toString().slice(-4)}`;

  doc
    .fillColor(slate500)
    .font("Helvetica")
    .fontSize(8)
    .text("Receipt No:", rightX, 55, { align: "right", width: rightW });

  doc
    .fillColor(slate700)
    .font("Helvetica-Bold")
    .fontSize(8)
    .text(receiptNumber, rightX, 65, { align: "right", width: rightW });

  const receiptDate = new Date(payment.paidAt || Date.now()).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  doc
    .fillColor(slate500)
    .font("Helvetica")
    .fontSize(8)
    .text(`Date: ${receiptDate}`, rightX, 77, { align: "right", width: rightW });

  // Clear PAID status indicator
  doc
    .fillColor(emerald700)
    .font("Helvetica-Bold")
    .fontSize(8.5)
    .text("STATUS: PAID", rightX, 89, { align: "right", width: rightW });

  // Divider Line
  doc
    .moveTo(startX, 105)
    .lineTo(startX + contentWidth, 105)
    .strokeColor(slate200)
    .lineWidth(1)
    .stroke();

  // 3. Two-Column Information Cards: Billed To & Facility Details
  const cardY = 118;
  const cardW = 250;
  const cardH = 76;

  // Box 1: Billed To
  doc
    .roundedRect(startX, cardY, cardW, cardH, 4)
    .fillAndStroke(slate50, slate200);

  doc
    .fillColor(accentColor)
    .font("Helvetica-Bold")
    .fontSize(7.5)
    .text("BILLED TO", startX + 12, cardY + 9, { characterSpacing: 0.5 });

  doc
    .fillColor(slate900)
    .font("Helvetica-Bold")
    .fontSize(10.5)
    .text(user.name || "Valued User", startX + 12, cardY + 22, { width: cardW - 24, ellipsis: true });

  doc
    .fillColor(slate500)
    .font("Helvetica")
    .fontSize(8)
    .text(user.email || "No email recorded", startX + 12, cardY + 36, { width: cardW - 24, ellipsis: true });

  doc
    .fillColor(slate400)
    .font("Helvetica")
    .fontSize(7.5)
    .text(`Booking Ref: #${booking._id ? booking._id.toString() : "N/A"}`, startX + 12, cardY + 54);

  // Box 2: Facility Details (from real DB data)
  const box2X = 305;
  doc
    .roundedRect(box2X, cardY, cardW, cardH, 4)
    .fillAndStroke(slate50, slate200);

  doc
    .fillColor(accentColor)
    .font("Helvetica-Bold")
    .fontSize(7.5)
    .text("FACILITY RESERVED", box2X + 12, cardY + 9, { characterSpacing: 0.5 });

  doc
    .fillColor(slate900)
    .font("Helvetica-Bold")
    .fontSize(10.5)
    .text(auditorium.name || "Auditorium Facility", box2X + 12, cardY + 22, { width: cardW - 24, ellipsis: true });

  const capacityText = auditorium.capacity ? `${auditorium.capacity} Seats Seating Capacity` : "Reserved Hall";
  doc
    .fillColor(slate500)
    .font("Helvetica")
    .fontSize(8)
    .text(capacityText, box2X + 12, cardY + 36, { width: cardW - 24, ellipsis: true });

  const facilityExtra = Array.isArray(auditorium.amenities) && auditorium.amenities.length > 0
    ? `Amenities: ${auditorium.amenities.slice(0, 3).join(", ")}`
    : (auditorium.basePrice ? `Base Rate: INR ${auditorium.basePrice} / hr` : "Campus Venue");

  doc
    .fillColor(slate400)
    .font("Helvetica")
    .fontSize(7.5)
    .text(facilityExtra, box2X + 12, cardY + 54, { width: cardW - 24, ellipsis: true });

  // 4. Booking Details Table
  const schedY = 208;
  doc
    .fillColor(slate900)
    .font("Helvetica-Bold")
    .fontSize(9.5)
    .text("Booking Details", startX, schedY);

  const schedTableY = schedY + 14;

  // Header row
  doc
    .roundedRect(startX, schedTableY, contentWidth, 20, 3)
    .fill(slate900);

  doc
    .fillColor("#FFFFFF")
    .font("Helvetica-Bold")
    .fontSize(7.5)
    .text("PURPOSE / EVENT", startX + 12, schedTableY + 6)
    .text("BOOKING DATE", 310, schedTableY + 6)
    .text("TIME SLOT", 440, schedTableY + 6);

  // Dynamic Row calculation
  const purposeText = booking.purpose || "Auditorium Reservation";
  const formattedDate = booking.bookingDate
    ? new Date(booking.bookingDate).toLocaleDateString("en-IN", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "N/A";
  const slotText = `${booking.startTime || "N/A"} - ${booking.endTime || "N/A"}`;

  doc.font("Helvetica").fontSize(8);
  const purposeHeight = Math.max(
    26,
    doc.heightOfString(purposeText, { width: 245 }) + 14
  );

  const schedRowY = schedTableY + 20;
  doc
    .rect(startX, schedRowY, contentWidth, purposeHeight)
    .fillAndStroke(slate50, slate200);

  doc
    .fillColor(slate700)
    .font("Helvetica")
    .fontSize(8)
    .text(purposeText, startX + 12, schedRowY + 7, { width: 245, lineGap: 1 });

  doc
    .fillColor(slate900)
    .font("Helvetica-Bold")
    .fontSize(8)
    .text(formattedDate, 310, schedRowY + 7)
    .text(slotText, 440, schedRowY + 7);

  // 5. Payment Breakdown & Prominent Total
  const paySectionY = schedRowY + purposeHeight + 16;

  doc
    .fillColor(slate900)
    .font("Helvetica-Bold")
    .fontSize(9.5)
    .text("Payment Breakdown", startX, paySectionY);

  const payTableY = paySectionY + 14;

  // Table Header
  doc
    .roundedRect(startX, payTableY, contentWidth, 20, 3)
    .fill(primaryColor);

  doc
    .fillColor("#FFFFFF")
    .font("Helvetica-Bold")
    .fontSize(7.5)
    .text("LINE ITEM & DESCRIPTION", startX + 12, payTableY + 6)
    .text("SLOT DURATION", 300, payTableY + 6)
    .text("AMOUNT", 430, payTableY + 6, { align: "right", width: 110 });

  // Data Item Row
  const payRowY = payTableY + 20;
  const payRowH = 32;

  doc
    .rect(startX, payRowY, contentWidth, payRowH)
    .fillAndStroke("#FFFFFF", slate200);

  doc
    .fillColor(slate900)
    .font("Helvetica-Bold")
    .fontSize(8)
    .text(`Facility Booking: ${auditorium.name || "Auditorium"}`, startX + 12, payRowY + 7);

  doc
    .fillColor(slate500)
    .font("Helvetica")
    .fontSize(7.5)
    .text("Auditorium reservation slot charges", startX + 12, payRowY + 18);

  doc
    .fillColor(slate700)
    .font("Helvetica")
    .fontSize(8)
    .text(slotText, 300, payRowY + 11);

  const totalAmount = payment.amount || booking.totalPrice || 0;

  doc
    .fillColor(slate900)
    .font("Helvetica-Bold")
    .fontSize(8.5)
    .text(formatCurrency(totalAmount), 430, payRowY + 11, {
      align: "right",
      width: 110,
    });

  // Prominent Total Row
  const totalRowY = payRowY + payRowH;
  const totalRowH = 34;

  doc
    .rect(startX, totalRowY, contentWidth, totalRowH)
    .fillAndStroke(slate50, slate200);

  doc
    .fillColor(slate700)
    .font("Helvetica-Bold")
    .fontSize(8.5)
    .text("TOTAL AMOUNT PAID:", startX + 12, totalRowY + 11);

  doc
    .fillColor(primaryColor)
    .font("Helvetica-Bold")
    .fontSize(13)
    .text(formatCurrency(totalAmount), 400, totalRowY + 9, {
      align: "right",
      width: 140,
    });

  // 6. Payment & Verification Details (No duplicate references)
  const certY = totalRowY + totalRowH + 16;
  const certH = 58;

  doc
    .roundedRect(startX, certY, contentWidth, certH, 4)
    .fillAndStroke(emerald50, emeraldBorder);

  doc
    .fillColor(emerald700)
    .font("Helvetica-Bold")
    .fontSize(8.5)
    .text("VERIFIED TRANSACTION DETAILS", startX + 12, certY + 9);

  const col1X = startX + 12;
  const col2X = 300;

  const paymentId = payment.gatewayPaymentId || "Confirmed Upon Verification";
  const paidAtString = payment.paidAt
    ? new Date(payment.paidAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) + " IST"
    : `${receiptDate} (Verified)`;

  doc
    .fillColor(slate500)
    .font("Helvetica")
    .fontSize(8)
    .text(`Payment ID: ${paymentId}`, col1X, certY + 25)
    .text(`Payment Gateway: ${payment.gateway || "Razorpay"}`, col1X, certY + 38);

  doc
    .fillColor(slate500)
    .font("Helvetica")
    .fontSize(8)
    .text(`Paid At: ${paidAtString}`, col2X, certY + 25)
    .text(`Status: Completed & Confirmed`, col2X, certY + 38);

  // 7. Support & Assistance Box
  const supportY = certY + certH + 14;
  const supportH = 46;

  doc
    .roundedRect(startX, supportY, contentWidth, supportH, 4)
    .fillAndStroke(slate50, slate200);

  const supportEmail = process.env.SUPPORT_EMAIL || "support@auditoreserve.com";
  const supportUrl = process.env.FRONTEND_URL || "https://auditoreserve.netlify.app";

  doc
    .fillColor(slate700)
    .font("Helvetica-Bold")
    .fontSize(8)
    .text("Need Help or Facility Assistance?", startX + 12, supportY + 8);

  doc
    .fillColor(slate500)
    .font("Helvetica")
    .fontSize(7.5)
    .text(
      `For queries, technical support, or rescheduling assistance, contact our administration desk at ${supportEmail}.`,
      startX + 12,
      supportY + 20,
      { width: contentWidth - 24 }
    )
    .text(`Access your bookings anytime at: ${supportUrl}`, startX + 12, supportY + 31);

  // 8. Footer (Guaranteed Single Page)
  const footerY = 750;

  doc
    .moveTo(startX, footerY)
    .lineTo(startX + contentWidth, footerY)
    .strokeColor(slate200)
    .lineWidth(0.75)
    .stroke();

  doc
    .fillColor(slate400)
    .font("Helvetica")
    .fontSize(7.2)
    .text(
      "Notice: This is a computer-generated tax/facility payment receipt issued upon successful verification. No physical signature is required.",
      startX,
      footerY + 10,
      { align: "center", width: contentWidth }
    )
    .text(
      `AuditoReserve Facility Management • Page 1 of 1 • Generated: ${new Date().toLocaleDateString("en-IN")}`,
      startX,
      footerY + 22,
      { align: "center", width: contentWidth }
    );

  doc.end();
}

module.exports = {
  buildReceiptPdf,
};
