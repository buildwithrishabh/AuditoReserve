// ============================================================================
// AuditoReserve — Institutional Email Templates
// Styled to match the Teerthanker Mahaveer University (TMU) Facilities Frontend UI
// ============================================================================

function emailLayout({
  badge,
  badgeType = "success", // success | warning | danger | info
  heading,
  body,
  link,
  linkText,
  subtext,
}) {
  // Semantic badge color themes matching frontend UI tokens
  const badgeStyles = {
    success: {
      bg: "#ecfdf5",
      border: "#a7f3d0",
      color: "#065f46",
    },
    warning: {
      bg: "#fffbeb",
      border: "#fde68a",
      color: "#92400e",
    },
    danger: {
      bg: "#fef2f2",
      border: "#fecaca",
      color: "#991b1b",
    },
    info: {
      bg: "#f0f9ff",
      border: "#bae6fd",
      color: "#0369a1",
    },
  };

  const badgeStyle = badgeStyles[badgeType] || badgeStyles.success;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${heading}</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; padding: 12px !important; }
      .email-card { border-radius: 8px !important; }
      .email-card-body { padding: 24px 20px !important; }
      .email-card-header { padding: 20px 20px !important; }
      .email-card-footer { padding: 20px 20px !important; }
    }
  </style>
</head>

<body style="
  margin: 0;
  padding: 0;
  background-color: #f8fafc;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  color: #0f172a;
  -webkit-font-smoothing: antialiased;
">

  <!-- Outer background table -->
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; margin: 0; padding: 32px 16px;">
    <tr>
      <td align="center" valign="top">

        <!-- Centered Container Card -->
        <table class="email-container" width="100%" border="0" cellpadding="0" cellspacing="0" style="
          max-width: 580px;
          background-color: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);
        ">

          <!-- Brand Header Bar -->
          <tr>
            <td class="email-card-header" style="
              padding: 24px 32px;
              border-bottom: 1px solid #e2e8f0;
              background-color: #ffffff;
            ">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="vertical-align: middle;">
                    <table border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <!-- Brand Icon Box -->
                        <td style="
                          width: 36px;
                          height: 36px;
                          background-color: #047857;
                          border-radius: 6px;
                          text-align: center;
                          vertical-align: middle;
                          color: #ffffff;
                          font-weight: 700;
                          font-size: 14px;
                          letter-spacing: -0.5px;
                        ">
                          AR
                        </td>
                        <!-- Brand Name & University Tag -->
                        <td style="padding-left: 12px; vertical-align: middle;">
                          <div style="font-size: 16px; font-weight: 700; color: #0f172a; line-height: 1.2;">
                            AuditoReserve
                          </div>
                          <div style="font-size: 10.5px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; line-height: 1.2;">
                            Campus Facilities · TMU
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" style="vertical-align: middle; font-size: 11px; font-weight: 600; color: #047857;">
                    OFFICIAL NOTIFICATION
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content Body -->
          <tr>
            <td class="email-card-body" style="padding: 36px 32px 32px;">

              ${
                badge
                  ? `
              <!-- Eyebrow Status Badge -->
              <table border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 18px;">
                <tr>
                  <td style="
                    background-color: ${badgeStyle.bg};
                    border: 1px solid ${badgeStyle.border};
                    color: ${badgeStyle.color};
                    font-size: 11px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    padding: 4px 10px;
                    border-radius: 4px;
                  ">
                    ${badge}
                  </td>
                </tr>
              </table>
              `
                  : ""
              }

              <!-- Heading -->
              <h1 style="
                margin: 0 0 18px 0;
                font-size: 24px;
                line-height: 1.3;
                font-weight: 700;
                color: #0f172a;
                letter-spacing: -0.02em;
              ">
                ${heading}
              </h1>

              <!-- Email Body HTML -->
              <div style="
                font-size: 14.5px;
                line-height: 1.65;
                color: #334155;
              ">
                ${body}
              </div>

              ${
                link && linkText
                  ? `
              <!-- Primary CTA Action Button -->
              <table border="0" cellpadding="0" cellspacing="0" style="margin-top: 28px; margin-bottom: 8px;">
                <tr>
                  <td align="center" style="
                    background-color: #047857;
                    border: 1px solid #065f46;
                    border-radius: 6px;
                  ">
                    <a href="${link}" target="_blank" style="
                      display: inline-block;
                      padding: 12px 24px;
                      font-size: 14px;
                      font-weight: 600;
                      color: #ffffff;
                      text-decoration: none;
                      letter-spacing: -0.01em;
                    ">
                      ${linkText} →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Fallback Direct URL -->
              <p style="
                margin: 20px 0 0 0;
                font-size: 12px;
                line-height: 1.5;
                color: #64748b;
                word-break: break-all;
              ">
                If the button doesn't work, copy and paste this link into your browser:<br/>
                <a href="${link}" style="color: #047857; text-decoration: underline;">${link}</a>
              </p>
              `
                  : ""
              }

              ${
                subtext
                  ? `
              <div style="
                margin-top: 24px;
                padding-top: 20px;
                border-top: 1px solid #f1f5f9;
                font-size: 12.5px;
                line-height: 1.6;
                color: #64748b;
              ">
                ${subtext}
              </div>
              `
                  : ""
              }

            </td>
          </tr>

          <!-- Institutional Footer -->
          <tr>
            <td class="email-card-footer" style="
              padding: 24px 32px;
              background-color: #f8fafc;
              border-top: 1px solid #e2e8f0;
              font-size: 11.5px;
              line-height: 1.6;
              color: #64748b;
            ">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <strong style="color: #334155; font-size: 12px; display: block; margin-bottom: 4px;">
                      Teerthanker Mahaveer University · Facilities & Infrastructure Management
                    </strong>
                    Administrative Block, Central Campus, TMU<br/>
                    Inquiries: <a href="mailto:facilities@tmu.ac.in" style="color: #047857; text-decoration: none;">facilities@tmu.ac.in</a> · Portal: <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}" style="color: #047857; text-decoration: none;">AuditoReserve</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 12px; font-size: 11px; color: #94a3b8;">
                    This is an automated system email for your university facilities account. If you did not initiate this action, please alert campus security.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
        <!-- /Centered Container Card -->

      </td>
    </tr>
  </table>

</body>
</html>`;
}

// ============================================================================
// Email Generator Functions
// ============================================================================

exports.generateVerificationEmail = async (user, verificationToken) => {
  const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

  return {
    from: {
      name: process.env.FROM_NAME || "AuditoReserve",
      address: process.env.FROM_EMAIL,
    },
    to: user.email,
    subject: `Verify your email address — AuditoReserve`,
    text: `Hi ${user.name},\n\nThank you for creating an account with AuditoReserve. Please verify your university email address by visiting:\n${verificationLink}\n\nTeerthanker Mahaveer University · Facilities Management`,
    html: emailLayout({
      badge: "Account Verification",
      badgeType: "success",
      heading: "Confirm your university email",
      body: `
        <p style="margin: 0 0 14px 0;">
          Hi <strong style="color: #0f172a;">${user.name}</strong>,
        </p>
        <p style="margin: 0 0 14px 0;">
          Thank you for creating an account on <strong>AuditoReserve</strong>. To activate your access to campus auditorium scheduling, event requests, and reservation tracking, please confirm your institutional email address.
        </p>
        <div style="
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 12px 16px;
          margin: 18px 0;
          font-size: 13.5px;
          color: #334155;
        ">
          Registered Email: <strong style="color: #0f172a;">${user.email}</strong>
        </div>
        <p style="margin: 0 0 6px 0;">
          Click the button below to complete your registration:
        </p>
      `,
      link: verificationLink,
      linkText: "Verify Email Address",
      subtext: "If you did not create an account on AuditoReserve, you can safely disregard this message.",
    }),
  };
};

exports.generateResetPasswordEmail = async (user, resetToken) => {
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  return {
    from: {
      name: process.env.FROM_NAME || "AuditoReserve",
      address: process.env.FROM_EMAIL,
    },
    to: user.email,
    subject: `Reset your password — AuditoReserve`,
    text: `Hi ${user.name},\n\nWe received a request to reset the password for your AuditoReserve account. This link will expire in 10 minutes:\n${resetLink}\n\nIf you did not request this, please disregard this email.`,
    html: emailLayout({
      badge: "Security Alert",
      badgeType: "warning",
      heading: "Reset your account password",
      body: `
        <p style="margin: 0 0 14px 0;">
          Hi <strong style="color: #0f172a;">${user.name}</strong>,
        </p>
        <p style="margin: 0 0 14px 0;">
          We received a request to reset the password associated with your university account (<strong style="color: #0f172a;">${user.email}</strong>).
        </p>
        <div style="
          background-color: #fffbeb;
          border: 1px solid #fde68a;
          border-radius: 6px;
          padding: 12px 16px;
          margin: 18px 0;
          font-size: 13px;
          color: #92400e;
        ">
          <strong>Security Notice:</strong> This password reset link is single-use and will expire in <strong>10 minutes</strong>.
        </div>
        <p style="margin: 0 0 6px 0;">
          Click the button below to set a new password:
        </p>
      `,
      link: resetLink,
      linkText: "Reset Password",
      subtext: "If you did not request a password reset, your credentials may be compromised. Please notify campus IT administration immediately.",
    }),
  };
};

exports.bookingUpdatedEmail = async (user, bookingId, status) => {
  const bookingStatus = {
    pending: "Pending Review",
    approved: "Approved",
    confirmed: "Confirmed",
    cancelled: "Cancelled",
  };

  const statusLabel = bookingStatus[status] || status;
  const isConfirmed = status === "confirmed";
  const isCancelled = status === "cancelled";
  const isApproved = status === "approved";

  let badgeType = "info";
  if (isConfirmed) badgeType = "success";
  if (isCancelled) badgeType = "danger";
  if (isApproved) badgeType = "warning";

  const actionLink = isConfirmed
    ? `${process.env.FRONTEND_URL}/student/my-bookings?receipt=${bookingId}`
    : isApproved
    ? `${process.env.FRONTEND_URL}/student/payment/${bookingId}`
    : `${process.env.FRONTEND_URL}/student/my-bookings`;

  const actionText = isConfirmed
    ? "View & Download Receipt"
    : isApproved
    ? "Complete Payment Now"
    : "View My Reservations";

  let statusMessage = `Your reservation request has been marked as <strong>${statusLabel}</strong>.`;
  if (isConfirmed) {
    statusMessage = "Your payment has been received and verified. Your campus auditorium reservation is <strong>officially confirmed</strong> on the university schedule. You can download your official PDF receipt below.";
  } else if (isApproved) {
    statusMessage = "Your booking request has been <strong>approved by campus facilities administration</strong>. Please complete the online payment to finalize and secure the slot.";
  } else if (isCancelled) {
    statusMessage = "This reservation request has been <strong>cancelled</strong>. Any provisionally held slots have been released back to the general university schedule.";
  }

  return {
    from: {
      name: process.env.FROM_NAME || "AuditoReserve",
      address: process.env.FROM_EMAIL,
    },
    to: user.email,
    subject: `Reservation ${statusLabel} — AuditoReserve`,
    text: `Hi ${user.name},\n\nYour booking #${bookingId} has been updated to: ${statusLabel}.\n${statusMessage}\n\nView details: ${actionLink}`,
    html: emailLayout({
      badge: `Reservation ${statusLabel.toUpperCase()}`,
      badgeType,
      heading: `Booking ${statusLabel}`,
      body: `
        <p style="margin: 0 0 14px 0;">
          Hi <strong style="color: #0f172a;">${user.name}</strong>,
        </p>
        <p style="margin: 0 0 18px 0;">
          ${statusMessage}
        </p>

        <!-- Booking Overview Box -->
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          margin-bottom: 20px;
        ">
          <tr>
            <td style="padding: 14px 18px; border-bottom: 1px solid #e2e8f0;">
              <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; display: block;">
                RESERVATION REFERENCE
              </span>
              <strong style="font-size: 14px; font-family: ui-monospace, Menlo, Consolas, monospace; color: #0f172a;">
                ${bookingId}
              </strong>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 18px;">
              <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; display: block;">
                UPDATED STATUS
              </span>
              <strong style="font-size: 14px; color: ${
                isConfirmed ? "#047857" : isCancelled ? "#991b1b" : isApproved ? "#b45309" : "#0f172a"
              };">
                ${statusLabel}
              </strong>
            </td>
          </tr>
        </table>
      `,
      link: actionLink,
      linkText: actionText,
      subtext: "For any questions regarding scheduling, contact the Facilities Office at facilities@tmu.ac.in.",
    }),
  };
};

exports.paymentRequestEmail = async (user, booking, auditorium, payment) => {
  const paymentLink = `${process.env.FRONTEND_URL}/student/payment/${booking._id}`;

  const rawDeadline = payment?.expiresAt || booking?.paymentDeadline;
  const deadlineDate = rawDeadline
    ? new Date(rawDeadline)
    : new Date(Date.now() + 12 * 60 * 60 * 1000);

  const deadlineText =
    deadlineDate.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }) + " IST";

  const formattedBookingDate = booking?.bookingDate
    ? new Date(booking.bookingDate).toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : null;

  const venueName = auditorium?.name || "Campus Auditorium";
  const formattedAmount = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(booking.totalPrice || 0);

  return {
    from: {
      name: process.env.FROM_NAME || "AuditoReserve",
      address: process.env.FROM_EMAIL,
    },
    to: user.email,
    subject: `Payment required: ${venueName} reservation approved — AuditoReserve`,
    text: `Hi ${user.name},\n\nYour reservation request for ${venueName} has been approved by campus administration.\n\nDate: ${formattedBookingDate || "N/A"} (${booking.startTime} – ${booking.endTime})\nAmount: ${formattedAmount}\nPayment Deadline: ${deadlineText} (12 hours)\n\nPlease complete payment to lock your reservation:\n${paymentLink}`,
    html: emailLayout({
      badge: "Payment Required",
      badgeType: "warning",
      heading: "Complete payment to confirm reservation",
      body: `
        <p style="margin: 0 0 14px 0;">
          Hi <strong style="color: #0f172a;">${user.name}</strong>,
        </p>
        <p style="margin: 0 0 18px 0;">
          Great news! Your booking request for <strong style="color: #047857;">${venueName}</strong> has been reviewed and <strong>approved</strong> by the university facilities committee.
        </p>
        <p style="margin: 0 0 18px 0;">
          To prevent scheduling conflicts and lock this auditorium on the official calendar, please complete your online payment within the 12-hour window.
        </p>

        <!-- Venue Schedule & Tariff Summary Box -->
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          margin-bottom: 20px;
        ">
          <tr>
            <td style="padding: 12px 18px; border-bottom: 1px solid #e2e8f0;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size: 13px; color: #64748b;">Venue:</td>
                  <td align="right" style="font-size: 13.5px; font-weight: 600; color: #0f172a;">${venueName}</td>
                </tr>
              </table>
            </td>
          </tr>
          ${
            formattedBookingDate
              ? `
          <tr>
            <td style="padding: 12px 18px; border-bottom: 1px solid #e2e8f0;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size: 13px; color: #64748b;">Event Date:</td>
                  <td align="right" style="font-size: 13.5px; font-weight: 600; color: #0f172a;">${formattedBookingDate}</td>
                </tr>
              </table>
            </td>
          </tr>
          `
              : ""
          }
          <tr>
            <td style="padding: 12px 18px; border-bottom: 1px solid #e2e8f0;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size: 13px; color: #64748b;">Time Window:</td>
                  <td align="right" style="font-size: 13.5px; font-weight: 600; color: #0f172a;">${booking.startTime} – ${booking.endTime}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 18px; border-bottom: 1px solid #e2e8f0;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size: 13px; color: #64748b;">Payment Deadline:</td>
                  <td align="right" style="font-size: 13.5px; font-weight: 700; color: #92400e;">${deadlineText}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 14px 18px; background-color: #f1f5f9;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size: 14px; font-weight: 600; color: #0f172a;">Total Payable:</td>
                  <td align="right" style="font-size: 17px; font-weight: 700; color: #047857;">${formattedAmount}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <div style="
          background-color: #fffbeb;
          border: 1px solid #fde68a;
          border-radius: 6px;
          padding: 12px 16px;
          margin-bottom: 8px;
          font-size: 12.5px;
          color: #92400e;
          line-height: 1.5;
        ">
          <strong>Important:</strong> Unpaid reservations will automatically expire after the 12-hour deadline, and the provisional slot will be released for other campus event organizers.
        </div>
      `,
      link: paymentLink,
      linkText: `Pay ${formattedAmount} via Razorpay`,
      subtext: "Payments are processed through a 256-bit encrypted gateway. Official GST receipt vouchers are generated upon confirmation.",
    }),
  };
};
