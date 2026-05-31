function emailLayout({ heading, badge, body, link, linkText }) {
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>

<body style="
  margin:0;
  padding:0;
  background:#0f1117;
  font-family:Inter,Arial,sans-serif;
">

<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td align="center" style="padding:40px 20px;">

<table width="100%" cellpadding="0" cellspacing="0"
style="
  max-width:600px;
  background:#161922;
  border:1px solid #262b36;
  border-radius:24px;
  overflow:hidden;
">

  <!-- Header -->
  <tr>
    <td style="
      padding:28px 32px;
      border-bottom:1px solid #262b36;
    ">
      <table cellpadding="0" cellspacing="0">
        <tr>
          <td style="
            width:42px;
            height:42px;
            border-radius:12px;
            background:#7c73e6;
            text-align:center;
            color:white;
            font-weight:800;
            font-size:14px;
          ">
            AR
          </td>

          <td style="
            padding-left:12px;
            color:#ffffff;
            font-size:20px;
            font-weight:800;
          ">
            AuditoReserve
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Content -->
  <tr>
    <td style="padding:40px 32px;">

      ${
        badge
          ? `
      <div style="
        display:inline-block;
        padding:6px 12px;
        background:#222738;
        border:1px solid #31384d;
        border-radius:999px;
        color:#a9b1d6;
        font-size:12px;
        font-weight:700;
        margin-bottom:20px;
      ">
        ${badge}
      </div>
      `
          : ""
      }

      <h1 style="
        margin:0 0 18px;
        font-size:32px;
        line-height:1.2;
        color:#ffffff;
        font-weight:800;
        letter-spacing:-1px;
      ">
        ${heading}
      </h1>

      ${body}

      <!-- Button -->
      <table cellpadding="0" cellspacing="0" style="margin-top:32px;">
        <tr>
          <td align="center"
          style="
            background:#7c73e6;
            border-radius:12px;
            border-bottom:3px solid #5d55d6;
          ">
            <a href="${link}"
            style="
              display:inline-block;
              padding:16px 28px;
              color:white;
              text-decoration:none;
              font-weight:700;
              font-size:15px;
            ">
              ${linkText}
            </a>
          </td>
        </tr>
      </table>

      <!-- Footer -->
      <table width="100%" cellpadding="0" cellspacing="0"
      style="margin-top:40px;">
        <tr>
          <td style="
            border-top:1px solid #262b36;
            padding-top:24px;
          ">
            <p style="
              margin:0;
              color:#7d8597;
              font-size:13px;
              line-height:1.7;
            ">
              If you didn't request this email, you can safely ignore it.
            </p>
          </td>
        </tr>
      </table>

    </td>
  </tr>

</table>

</td>
</tr>
</table>

</body>
</html>
`;
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
  };

  return {
    from: {
      name: process.env.FROM_NAME,
      address: process.env.FROM_EMAIL,
    },
    to: user.email,
    subject: `Booking ${bookingStatus[status]} — AuditoReserve`,
    text: `Hi ${user.name}, your booking ${bookingId} has been ${bookingStatus[status]}.`,
    html: emailLayout({
      badge: "Booking update",
      heading: `Booking ${bookingStatus[status]}`,
      body: `
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#8b8b9e;">
          Hi <strong style="color:#e8e8ed;font-weight:700;">${user.name}</strong>,
        </p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#8b8b9e;">
          Your booking ${bookingId} has been ${bookingStatus[status]}.
        </p>
      `,
      link: `${process.env.FRONTEND_URL}/booking/${bookingId}`,
      linkText: "View Booking",
    }),
  };
};
