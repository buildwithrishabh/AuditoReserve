function emailLayout({ heading, badge, body, link, linkText }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
  <style>
    table, td, div, p, a, span { mso-line-height-rule: exactly; }
    * { margin: 0; padding: 0; }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0f;font-family:'Plus Jakarta Sans',system-ui,-apple-system,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0f;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <!--[if mso]><table role="presentation" width="560" cellpadding="0" cellspacing="0" align="center"><tr><td><![endif]-->

        <!-- Card -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#13131a;border:1px solid #2a2a3a;border-radius:24px;">
          <tr>
            <td align="center" style="padding:36px 36px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" align="center">
                <tr>
                  <td style="background:linear-gradient(135deg,#7c73e6,#4f46e5);border-radius:14px;width:38px;height:38px;text-align:center;vertical-align:middle;font-size:14px;font-weight:800;color:#ffffff;line-height:38px;">
                    AR
                  </td>
                  <td style="padding-left:10px;font-size:19px;font-weight:800;color:#e8e8ed;letter-spacing:-0.02em;">
                    AuditoReserve
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:32px 36px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="text-align:center;">

                    ${badge ? `
                    <!-- Badge -->
                    <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin-bottom:14px;">
                      <tr>
                        <td style="padding:3px 10px;border-radius:99px;background:rgba(124,115,230,0.1);border:1px solid rgba(124,115,230,0.15);font-size:11px;font-weight:800;color:#a78bfa;text-transform:uppercase;letter-spacing:0.08em;text-align:center;">
                          ${badge}
                        </td>
                      </tr>
                    </table>
                    ` : ""}

                    <h1 style="margin:0 0 10px;font-size:22px;font-weight:800;color:#e8e8ed;letter-spacing:-0.01em;line-height:1.3;">
                      ${heading}
                    </h1>

                    ${body}

                    <!-- CTA Button -->
                    <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin-top:24px;">
                      <tr>
                        <td align="center" style="border-radius:10px;background:linear-gradient(135deg,#7c73e6,#6d63e0);">
                          <a href="${link}" target="_blank" style="display:inline-block;padding:14px 32px;border-radius:10px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;line-height:1;mso-hide:all;">
                            ${linkText}
                          </a>
                          <!--[if mso]>&nbsp;<![endif]-->
                        </td>
                      </tr>
                    </table>

                    <!-- Divider -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
                      <tr>
                        <td style="height:1px;line-height:1px;font-size:1px;background-color:#2a2a3a;">&nbsp;</td>
                      </tr>
                    </table>

                    <!-- Footer -->
                    <p style="margin:0;font-size:12px;line-height:1.6;color:#5a5a6e;text-align:center;">
                      If you didn't request this, you can safely ignore this email.<br />
                      For help, visit <a href="${process.env.FRONTEND_URL || ""}" target="_blank" style="color:#7c73e6;text-decoration:none;">AuditoReserve</a>.
                    </p>

                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!--[if mso]></td></tr></table><![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;
}

exports.generateVerificationEmail = async (user, verificationToken) => {
  const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

  return {
    from: {
      name: process.env.FROM_NAME,
      address: process.env.FROM_EMAIL,
    },
    to: user.email,
    subject: `Verify your email — AuditoReserve`,
    text: `Hi ${user.name}, please verify your email by clicking: ${verificationLink}`,
    html: emailLayout({
      badge: "Account verification",
      heading: "Verify your email address",
      body: `
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#8b8b9e;">
          Hi <strong style="color:#e8e8ed;font-weight:700;">${user.name}</strong>,
        </p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#8b8b9e;">
          Thanks for creating an account with AuditoReserve. Click the button below to verify your
          university email address and start booking auditoriums.
        </p>
      `,
      link: verificationLink,
      linkText: "Verify Email",
    }),
  };
};

exports.generateResetPasswordEmail = async (user, resetToken) => {
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  return {
    from: {
      name: process.env.FROM_NAME,
      address: process.env.FROM_EMAIL,
    },
    to: user.email,
    subject: `Reset your password — AuditoReserve`,
    text: `Hi ${user.name}, reset your password by clicking: ${resetLink}`,
    html: emailLayout({
      badge: "Security alert",
      heading: "Reset your password",
      body: `
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#8b8b9e;">
          Hi <strong style="color:#e8e8ed;font-weight:700;">${user.name}</strong>,
        </p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#8b8b9e;">
          We received a request to reset the password for your AuditoReserve account.
          This link will expire in <strong style="color:#e8e8ed;">10 minutes</strong>.
        </p>
      `,
      link: resetLink,
      linkText: "Reset Password",
    }),
  };
};

exports.bookingUpdatedEmail = async (user, bookingId, status) => {
  const bookingStatus = {
    pending: "Pending",
    confirmed: "Confirmed",
    cancelled: "Cancelled",
    booked: "Booked",
    completed: "Completed"
  };

  const statusStr = bookingStatus[status] || status;

  return {
    from: {
      name: process.env.FROM_NAME,
      address: process.env.FROM_EMAIL,
    },
    to: user.email,
    subject: `Booking ${statusStr} — AuditoReserve`,
    text: `Hi ${user.name}, your booking ${bookingId} has been ${statusStr.toLowerCase()}.`,
    html: emailLayout({
      badge: "Booking update",
      heading: `Booking ${statusStr}`,
      body: `
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#8b8b9e;">
          Hi <strong style="color:#e8e8ed;font-weight:700;">${user.name}</strong>,
        </p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#8b8b9e;">
          Your booking ${bookingId} has been ${statusStr.toLowerCase()}.
        </p>
      `,
      link: `${process.env.FRONTEND_URL}/booking/${bookingId}`,
      linkText: "View Booking",
    }),
  };
};
