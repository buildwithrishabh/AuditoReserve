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
 * Generates an executive, single-page PDF receipt matching the AuditoReserve frontend design system.
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
      Subject: "Auditorium Reservation Official Receipt Voucher",
      Keywords: "AuditoReserve, Receipt, Payment, Auditorium, TMU",
      Creator: "AuditoReserve Campus Management System",
    },
  });

  doc.pipe(stream);

  // AuditoReserve Obsidian & Electric Blue Theme Palette (matches frontend)
  const brandBlue     = "#2563EB";   // Primary Electric Blue
  const brandNavy     = "#1D4ED8";   // Darker Electric Blue
  const slate950      = "#090B10";   // Obsidian Base
  const slate900      = "#0F172A";   // Deep Slate
  const slate800      = "#1E293B";   // Slate 800
  const slate700      = "#334155";   // Slate 700
  const slate500      = "#64748B";   // Slate 500
  const slate400      = "#94A3B8";   // Slate 400
  const slate200      = "#E2E8F0";   // Border Slate 200
  const slate50       = "#F8FAFC";   // Background Slate 50
  const emerald700    = "#047857";   // Status Paid Green
  const emerald50     = "#ECFDF5";   // Status Box Background
  const emeraldBorder = "#A7F3D0";   // Status Box Border

  const pageWidth = 595.28;
  const contentWidth = 515.28;
  const startX = 40;

  // 1. Top Decorative Brand Accent Strip
  doc.rect(0, 0, pageWidth, 5).fill(brandBlue);

  // 2. Header: Logo Badge & Brand Name (Left) + Tax Invoice & Status (Right)
  // Left: Brand Logo Block (Electric Blue Rounded Square with "AR")
  const logoSize = 34;
  doc
    .roundedRect(startX, 34, logoSize, logoSize, 6)
    .fill(brandBlue);

  doc
    .fillColor("#FFFFFF")
    .font("Helvetica-Bold")
    .fontSize(14)
    .text("AR", startX, 44, { width: logoSize, align: "center" });

  const brandTextX = startX + logoSize + 12;
  doc
    .fillColor(slate900)
    .font("Helvetica-Bold")
    .fontSize(18)
    .text("Audito", brandTextX, 33, { continued: true });

  doc
    .fillColor(brandBlue)
    .font("Helvetica-Bold")
    .fontSize(18)
    .text("Reserve");

  doc
    .fillColor(slate500)
    .font("Helvetica-Bold")
    .fontSize(7.2)
    .text("CAMPUS AUDITORIUM SCHEDULING & MANAGEMENT SYSTEM", brandTextX, 54, { characterSpacing: 0.4 });

  doc
    .fillColor(slate400)
    .font("Helvetica")
    .fontSize(7.8)
    .text("Central Campus Facilities · Official Electronic Payment Receipt", brandTextX, 66);

  // Right: Receipt Metadata & Paid Status
  const rightX = 330;
  const rightW = 225;

  doc
    .fillColor(slate900)
    .font("Helvetica-Bold")
    .fontSize(14)
    .text("TAX INVOICE / RECEIPT", rightX, 33, { align: "right", width: rightW });

  // Unique receipt number
  const receiptNumber = payment.receipt || `AR-${new Date(payment.paidAt || Date.now()).getFullYear()}-${String(booking._id || "").slice(-6).toUpperCase()}-${Date.now().toString().slice(-4)}`;

  doc
    .fillColor(slate500)
    .font("Helvetica")
    .fontSize(7.8)
    .text("Receipt Ref:", rightX, 52, { align: "right", width: rightW });

  doc
    .fillColor(slate800)
    .font("Helvetica-Bold")
    .fontSize(8.5)
    .text(receiptNumber, rightX, 62, { align: "right", width: rightW });

  const receiptDate = new Date(payment.paidAt || Date.now()).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  doc
    .fillColor(slate500)
    .font("Helvetica")
    .fontSize(8)
    .text(`Issue Date: ${receiptDate}`, rightX, 74, { align: "right", width: rightW });

  // Paid Status Pill on Top Right
  const pillW = 86;
  const pillH = 17;
  const pillX = startX + contentWidth - pillW;
  const pillY = 88;

  doc
    .roundedRect(pillX, pillY, pillW, pillH, 8)
    .fillAndStroke(emerald50, emeraldBorder);

  doc
    .fillColor(emerald700)
    .font("Helvetica-Bold")
    .fontSize(7.5)
    .text("STATUS: PAID", pillX, pillY + 4.5, { width: pillW, align: "center" });

  // Clean Divider Line
  doc
    .moveTo(startX, 114)
    .lineTo(startX + contentWidth, 114)
    .strokeColor(slate200)
    .lineWidth(1)
    .stroke();

  // 3. Information Cards: Billed To (Left) & Reserved Facility (Right)
  const cardY = 126;
  const cardW = 250;
  const cardH = 78;

  // Box 1: Billed To
  doc
    .roundedRect(startX, cardY, cardW, cardH, 5)
    .fillAndStroke(slate50, slate200);

  doc
    .fillColor(brandBlue)
    .font("Helvetica-Bold")
    .fontSize(7.5)
    .text("BILLED TO (RESERVATION ORGANIZER)", startX + 12, cardY + 9, { characterSpacing: 0.4 });

  doc
    .fillColor(slate900)
    .font("Helvetica-Bold")
    .fontSize(10.5)
    .text(user.name || "Student / Organizer", startX + 12, cardY + 22, { width: cardW - 24, ellipsis: true });

  doc
    .fillColor(slate500)
    .font("Helvetica")
    .fontSize(8)
    .text(user.email || "No email on record", startX + 12, cardY + 37, { width: cardW - 24, ellipsis: true });

  doc
    .fillColor(slate400)
    .font("Helvetica")
    .fontSize(7.5)
    .text(`Booking Ref: #${booking._id ? booking._id.toString() : "N/A"}`, startX + 12, cardY + 55);

  // Box 2: Facility Details
  const box2X = 305;
  doc
    .roundedRect(box2X, cardY, cardW, cardH, 5)
    .fillAndStroke(slate50, slate200);

  doc
    .fillColor(brandBlue)
    .font("Helvetica-Bold")
    .fontSize(7.5)
    .text("VENUE & FACILITY RESERVED", box2X + 12, cardY + 9, { characterSpacing: 0.4 });

  doc
    .fillColor(slate900)
    .font("Helvetica-Bold")
    .fontSize(10.5)
    .text(auditorium.name || "Campus Auditorium", box2X + 12, cardY + 22, { width: cardW - 24, ellipsis: true });

  const capacityText = auditorium.capacity ? `${auditorium.capacity} Seating Capacity` : "Campus Venue";
  doc
    .fillColor(slate500)
    .font("Helvetica")
    .fontSize(8)
    .text(capacityText, box2X + 12, cardY + 37, { width: cardW - 24, ellipsis: true });

  const facilityExtra = auditorium.basePrice
    ? `Base Tariff: ${formatCurrency(auditorium.basePrice)} / hr`
    : (Array.isArray(auditorium.amenities) && auditorium.amenities.length > 0
        ? `Amenities: ${auditorium.amenities.slice(0, 3).join(", ")}`
        : "Central Campus Auditorium");

  doc
    .fillColor(slate400)
    .font("Helvetica")
    .fontSize(7.5)
    .text(facilityExtra, box2X + 12, cardY + 55, { width: cardW - 24, ellipsis: true });

  // 4. Booking Details Table
  const schedY = 216;
  doc
    .fillColor(slate900)
    .font("Helvetica-Bold")
    .fontSize(9.5)
    .text("Reservation Schedule", startX, schedY);

  const schedTableY = schedY + 14;

  // Header row (Obsidian / Slate 900)
  doc
    .roundedRect(startX, schedTableY, contentWidth, 20, 3)
    .fill(slate900);

  doc
    .fillColor("#FFFFFF")
    .font("Helvetica-Bold")
    .fontSize(7.5)
    .text("PURPOSE & EVENT SCOPE", startX + 12, schedTableY + 6)
    .text("EVENT DATE", 310, schedTableY + 6)
    .text("RESERVED TIME SLOT", 435, schedTableY + 6);

  // Dynamic Row calculation
  const purposeText = booking.purpose || "Auditorium Reservation & Campus Event";
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
    28,
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
    .text(slotText, 435, schedRowY + 7);

  // 5. Payment Breakdown & Prominent Total
  const paySectionY = schedRowY + purposeHeight + 16;

  doc
    .fillColor(slate900)
    .font("Helvetica-Bold")
    .fontSize(9.5)
    .text("Payment Breakdown", startX, paySectionY);

  const payTableY = paySectionY + 14;

  // Table Header (Electric Blue `#2563EB`)
  doc
    .roundedRect(startX, payTableY, contentWidth, 20, 3)
    .fill(brandBlue);

  doc
    .fillColor("#FFFFFF")
    .font("Helvetica-Bold")
    .fontSize(7.5)
    .text("LINE ITEM & DESCRIPTION", startX + 12, payTableY + 6)
    .text("TIME WINDOW", 300, payTableY + 6)
    .text("AMOUNT PAID", 430, payTableY + 6, { align: "right", width: 110 });

  // Line Item Row
  const payRowY = payTableY + 20;
  const payRowH = 32;

  doc
    .rect(startX, payRowY, contentWidth, payRowH)
    .fillAndStroke("#FFFFFF", slate200);

  doc
    .fillColor(slate900)
    .font("Helvetica-Bold")
    .fontSize(8)
    .text(`Facility Reservation: ${auditorium.name || "Auditorium"}`, startX + 12, payRowY + 7);

  doc
    .fillColor(slate500)
    .font("Helvetica")
    .fontSize(7.5)
    .text("Confirmed venue slot and authorized facilities access", startX + 12, payRowY + 18);

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
    .text("TOTAL AMOUNT PAID IN FULL:", startX + 12, totalRowY + 11);

  doc
    .fillColor(brandBlue)
    .font("Helvetica-Bold")
    .fontSize(13)
    .text(formatCurrency(totalAmount), 400, totalRowY + 9, {
      align: "right",
      width: 140,
    });

  // 6. Payment & Verification Details
  const certY = totalRowY + totalRowH + 16;
  const certH = 58;

  doc
    .roundedRect(startX, certY, contentWidth, certH, 5)
    .fillAndStroke(emerald50, emeraldBorder);

  doc
    .fillColor(emerald700)
    .font("Helvetica-Bold")
    .fontSize(8.5)
    .text("VERIFIED TRANSACTION CREDENTIALS", startX + 12, certY + 9);

  const col1X = startX + 12;
  const col2X = 300;

  const paymentId = payment.gatewayPaymentId || "Verified & Confirmed";
  const paidAtString = payment.paidAt
    ? new Date(payment.paidAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) + " IST"
    : `${receiptDate} (Verified)`;

  doc
    .fillColor(slate700)
    .font("Helvetica")
    .fontSize(8)
    .text(`Payment Gateway: ${payment.gateway || "Razorpay Secure"}`, col1X, certY + 25)
    .text(`Transaction Reference: ${paymentId}`, col1X, certY + 38);

  doc
    .fillColor(slate700)
    .font("Helvetica")
    .fontSize(8)
    .text(`Payment Time: ${paidAtString}`, col2X, certY + 25)
    .text(`Authorization: Successfully Captured & Settled`, col2X, certY + 38);

  // 7. Support & Assistance Box
  const supportY = certY + certH + 14;
  const supportH = 46;

  doc
    .roundedRect(startX, supportY, contentWidth, supportH, 5)
    .fillAndStroke(slate50, slate200);

  const supportEmail = process.env.SUPPORT_EMAIL || "facilities@auditoreserve.com";
  const supportUrl = process.env.FRONTEND_URL || "https://auditoreserve.netlify.app";

  doc
    .fillColor(slate800)
    .font("Helvetica-Bold")
    .fontSize(8)
    .text("Campus Venue Assistance & Support", startX + 12, supportY + 8);

  doc
    .fillColor(slate500)
    .font("Helvetica")
    .fontSize(7.5)
    .text(
      `For AV technician requirements, rescheduling, or event coordination, contact ${supportEmail}.`,
      startX + 12,
      supportY + 20,
      { width: contentWidth - 24 }
    )
    .text(`Manage all your reservations anytime at: ${supportUrl}`, startX + 12, supportY + 31);

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
      "Notice: This is a computer-generated official receipt voucher. Digital authorization verified. No physical signature required.",
      startX,
      footerY + 10,
      { align: "center", width: contentWidth }
    )
    .text(
      `AuditoReserve · Teerthanker Mahaveer University Facilities Management · Page 1 of 1 · Issued: ${new Date().toLocaleDateString("en-IN")}`,
      startX,
      footerY + 22,
      { align: "center", width: contentWidth }
    );

  doc.end();
}

module.exports = {
  buildReceiptPdf,
};
