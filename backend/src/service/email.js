const nodemailer = require("nodemailer");

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL;
const FROM_NAME = process.env.FROM_NAME || "AuditoReserve";

// Use Brevo HTTP API if API key starts with 'xkeysib-'
const useBrevoAPI = BREVO_API_KEY && BREVO_API_KEY.startsWith("xkeysib-");

let transporter = null;
if (!useBrevoAPI) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    if (useBrevoAPI) {
      console.log(`[Email Service] Sending email via Brevo HTTP API to ${to}...`);
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "accept": "application/json",
          "api-key": BREVO_API_KEY,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          sender: {
            name: FROM_NAME,
            email: FROM_EMAIL,
          },
          to: [
            {
              email: to,
            },
          ],
          subject,
          htmlContent: html,
          textContent: text,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Brevo HTTP API Error (${response.status}): ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      console.log("[Email Service] Email sent successfully via Brevo HTTP API. Message ID:", data.messageId);
      return { messageId: data.messageId };
    } else {
      console.log(`[Email Service] Sending email via Nodemailer SMTP to ${to}...`);
      const info = await transporter.sendMail({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to,
        subject,
        text,
        html,
      });

      console.log("[Email Service] Email sent successfully via Nodemailer SMTP. Message ID:", info.messageId);
      return info;
    }
  } catch (error) {
    console.error("[Email Service] Error sending email:", error.message);
    throw error;
  }
};

module.exports = sendEmail;
