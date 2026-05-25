const nodemailer = require('nodemailer');
const https = require('https');

/**
 * Send an email using Brevo HTTP API.
 */
const sendViaBrevoAPI = (options) => {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      sender: { 
        name: process.env.FROM_NAME || 'AudiBook System', 
        email: process.env.FROM_EMAIL 
      },
      to: [{ email: options.to }],
      subject: options.subject,
      htmlContent: options.html,
      textContent: options.text || undefined,
    });

    const reqOptions = {
      hostname: 'api.brevo.com',
      port: 443,
      path: '/v3/smtp/email',
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY || process.env.SMTP_PASS,
        'Content-Length': Buffer.byteLength(data),
      },
    };

    const req = https.request(reqOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        let result;
        try {
          result = JSON.parse(body);
        } catch (e) {
          result = { message: body };
        }
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(result);
        } else {
          reject(new Error(result.message || `HTTP ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
};

/**
 * Send an email using SMTP transport or API.
 * @param {Object} options - Email options (to, subject, text, html)
 */
const sendEmail = async (options) => {
  // If SMTP host is Brevo, use their HTTP API to bypass Render's SMTP port block
  if (process.env.SMTP_HOST === 'smtp-relay.brevo.com') {
    try {
      const info = await sendViaBrevoAPI(options);
      console.log('Email sent via Brevo HTTP API:', info.messageId || info);
      return info;
    } catch (error) {
      console.error('Error sending email via Brevo HTTP API:', error.message);
      throw new Error('Email could not be sent');
    }
  }

  // Determine transporter configuration
  let config;
  if (process.env.SMTP_HOST) {
    config = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    };
  } else {
    // Fallback to gmail service
    config = {
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    };
  }

  const transporter = nodemailer.createTransport(config);

  // Define email options
  const mailOptions = {
    from: `${process.env.FROM_NAME || 'AudiBook System'} <${process.env.FROM_EMAIL}>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  // Send email
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error.message);
    throw new Error('Email could not be sent');
  }
};

module.exports = sendEmail;
