const nodemailer = require('nodemailer');
const db = require('../config/db');

/**
 * Email Service — Calculus Corner
 *
 * Reads SMTP configuration from environment variables.
 * If any required variable is missing, email sending is skipped gracefully
 * (a warning is logged) and the calling operation is never blocked.
 *
 * Required env vars to enable sending:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 */

const isConfigured = () => {
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    process.env.SMTP_FROM
  );
};

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),
    secure: parseInt(process.env.SMTP_PORT, 10) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

/**
 * Persists an email send attempt to the audit log.
 * Fire-and-forget — failure to log must never block the caller.
 * @param {string}      recipientEmail
 * @param {string}      emailType  - e.g. 'unban_notification'
 * @param {string}      status     - 'sent' | 'failed' | 'skipped'
 * @param {string|null} errorMessage
 */
const logEmail = async (recipientEmail, emailType, status, errorMessage = null) => {
  try {
    await db.query(
      'INSERT INTO email_logs (recipient_email, email_type, status, error_message) VALUES (?, ?, ?, ?)',
      [recipientEmail, emailType, status, errorMessage]
    );
  } catch (logErr) {
    // Never throw — logging must not affect the calling operation
    console.error('[EmailService] Failed to write email log:', logErr.message);
  }
};

/**
 * Checks whether an email of the given type was already successfully sent
 * to the recipient. Used to prevent duplicate unban notifications.
 * @param {string} recipientEmail
 * @param {string} emailType
 * @returns {Promise<boolean>}
 */
const wasEmailAlreadySent = async (recipientEmail, emailType) => {
  try {
    const [rows] = await db.query(
      'SELECT id FROM email_logs WHERE recipient_email = ? AND email_type = ? AND status = ? LIMIT 1',
      [recipientEmail, emailType, 'sent']
    );
    return rows.length > 0;
  } catch {
    // On DB error, allow sending to proceed (safer default)
    return false;
  }
};

/**
 * Sends a professional unban notification email to the student.
 * @param {Object} student - { name, email }
 * @returns {{ sent: boolean, error: string|null }}
 */
const sendUnbanEmail = async (student) => {
  const EMAIL_TYPE = 'unban_notification';

  if (!isConfigured()) {
    await logEmail(student?.email || 'unknown', EMAIL_TYPE, 'skipped', 'SMTP not configured');
    return { sent: false, error: 'SMTP not configured' };
  }

  if (!student?.email) {
    return { sent: false, error: 'No recipient email' };
  }

  // Guard against duplicate sends for the same student
  const alreadySent = await wasEmailAlreadySent(student.email, EMAIL_TYPE);
  if (alreadySent) {
    return { sent: false, error: 'Duplicate send prevented' };
  }

  const siteName = 'Calculus Corner';
  const siteUrl = process.env.SITE_URL;
  const supportEmail = process.env.SMTP_FROM || 'support@calculuscorner.com';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Account Restored — ${siteName}</title>
  <style>
    body { margin: 0; padding: 0; background: #F8FAFC; font-family: 'Inter', Arial, sans-serif; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #E2E8F0; }
    .header { background: linear-gradient(135deg, #2563EB 0%, #1E40AF 100%); padding: 40px 32px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 22px; font-weight: 800; margin: 0; letter-spacing: -0.5px; }
    .header p { color: rgba(255,255,255,0.85); font-size: 14px; margin: 8px 0 0; }
    .body { padding: 40px 32px; }
    .greeting { font-size: 16px; font-weight: 700; color: #0F172A; margin-bottom: 16px; }
    .message { font-size: 14px; color: #475569; line-height: 1.7; margin-bottom: 24px; }
    .status-box { background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 12px; padding: 20px 24px; margin-bottom: 28px; }
    .status-box h3 { color: #16A34A; font-size: 14px; font-weight: 700; margin: 0 0 6px; }
    .status-box p { color: #166534; font-size: 13px; margin: 0; line-height: 1.6; }
    .cta { text-align: center; margin: 28px 0; }
    .cta a { display: inline-block; background: linear-gradient(135deg, #2563EB, #1E40AF); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 999px; font-weight: 700; font-size: 15px; letter-spacing: 0.2px; }
    .divider { border: none; border-top: 1px solid #E2E8F0; margin: 28px 0; }
    .support { font-size: 13px; color: #64748B; text-align: center; line-height: 1.6; }
    .support a { color: #2563EB; text-decoration: none; font-weight: 600; }
    .footer { background: #F8FAFC; padding: 24px 32px; text-align: center; border-top: 1px solid #E2E8F0; }
    .footer p { font-size: 12px; color: #94A3B8; margin: 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>${siteName}</h1>
      <p>Where Mathematics Meets Infinity</p>
    </div>

    <div class="body">
      <p class="greeting">Dear ${student.name},</p>
      <p class="message">
        We are writing to inform you that following a review of your account, the restriction
        that was previously placed on your <strong>${siteName}</strong> account has been
        <strong>removed</strong>. Your account has been fully restored and you may now access
        all study materials, quizzes, and resources on the platform.
      </p>

      <div class="status-box">
        <h3>Account Status: Restored</h3>
        <p>
          Your full access to video lectures, formula sheets, AI tutor, and practice
          quizzes has been reinstated. We encourage you to continue your learning journey
          with us.
        </p>
      </div>

      <div class="cta">
        <a href="${siteUrl}/auth">Sign In to Your Account</a>
      </div>

      <hr class="divider" />

      <p class="support">
        If you have any questions or need further assistance, please contact our support team
        at <a href="mailto:${supportEmail}">${supportEmail}</a>.<br />
        We appreciate your continued commitment to learning at ${siteName}.
      </p>
    </div>

    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${siteName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"${siteName}" <${process.env.SMTP_FROM}>`,
      to: student.email,
      subject: `Your ${siteName} Account Has Been Restored`,
      html,
      text: `Dear ${student.name},\n\nYour ${siteName} account has been restored and you can now sign in at ${siteUrl}.\n\nFor support, contact ${supportEmail}.\n\n© ${new Date().getFullYear()} ${siteName}`,
    });

    await logEmail(student.email, EMAIL_TYPE, 'sent', null);
    return { sent: true, error: null };
  } catch (err) {
    console.error('[EmailService] Failed to send unban email:', err.message);
    await logEmail(student.email, EMAIL_TYPE, 'failed', err.message);
    return { sent: false, error: err.message };
  }
};

const sendSubscriptionConfirmation = async (email, token) => {
  const EMAIL_TYPE = 'newsletter_confirmation';
  
  if (!isConfigured()) {
    await logEmail(email, EMAIL_TYPE, 'skipped', 'SMTP not configured');
    return { sent: false, error: 'SMTP not configured' };
  }

  const siteName = 'Calculus Corner';
  const siteUrl = process.env.SITE_URL;
  const backendUrl = process.env.BACKEND_URL;
  const supportEmail = process.env.SMTP_FROM || 'support@calculuscorner.com';

  let logoUrl = `${siteUrl}/logo-og.png`; // Use cache-busted OG logo link
  try {
    const [logoRows] = await db.query("SELECT content_data FROM site_content WHERE section_name = 'logo'");
    if (logoRows.length > 0) {
      const data = typeof logoRows[0].content_data === 'string' 
        ? JSON.parse(logoRows[0].content_data) 
        : logoRows[0].content_data;
      if (data && data.logo_url) {
        logoUrl = data.logo_url.startsWith('http') ? data.logo_url : `${backendUrl}${data.logo_url}`;
      }
    }
  } catch (err) {}

  const unsubscribeUrl = `${backendUrl}/api/content/newsletter/unsubscribe?token=${token}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Subscription Confirmed — ${siteName}</title>
  <style>
    body { margin: 0; padding: 0; background: #F8FAFC; font-family: 'Inter', Arial, sans-serif; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #E2E8F0; }
    .header { background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%); padding: 40px 32px; text-align: center; }
    .header img { max-height: 50px; margin-bottom: 12px; }
    .header h1 { color: #ffffff; font-size: 22px; font-weight: 800; margin: 0; }
    .body { padding: 40px 32px; }
    .greeting { font-size: 16px; font-weight: 700; color: #0F172A; margin-bottom: 16px; }
    .message { font-size: 14px; color: #475569; line-height: 1.7; margin-bottom: 24px; text-align: center; }
    .cta { text-align: center; margin: 28px 0; }
    .cta a { display: inline-block; background: linear-gradient(135deg, #4f46e5, #3730a3); color: #ffffff !important; text-decoration: none; padding: 14px 36px; border-radius: 999px; font-weight: 700; font-size: 15px; }
    .divider { border: none; border-top: 1px solid #E2E8F0; margin: 28px 0; }
    .support { font-size: 13px; color: #64748B; text-align: center; line-height: 1.6; }
    .support a { color: #4f46e5; text-decoration: none; font-weight: 600; }
    .footer { background: #F8FAFC; padding: 24px 32px; text-align: center; border-top: 1px solid #E2E8F0; }
    .footer p { font-size: 11px; color: #94A3B8; margin: 0; line-height: 1.6; }
    .footer a { color: #ef4444; font-weight: bold; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <img src="${logoUrl}" alt="${siteName} Logo" style="max-height: 50px; display: inline-block;" />
      <h1>Subscription Confirmed</h1>
    </div>

    <div class="body">
      <p class="greeting">Hello,</p>
      <p class="message">
        Thank you for subscribing to the <strong>${siteName}</strong> newsletter!
        We are thrilled to have you with us. You will now receive updates about study resources,
        calculus sprint schedules, and academic tips directly to your inbox.
      </p>

      <div class="cta">
        <a href="${siteUrl}">Visit Calculus Corner</a>
      </div>

      <hr class="divider" />

      <p class="support">
        If you have any questions, feel free to contact us at <a href="mailto:${supportEmail}">${supportEmail}</a>.
      </p>
    </div>

    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${siteName}. All rights reserved.</p>
      <p style="margin-top: 8px;">
        To stop receiving emails, you can <a href="${unsubscribeUrl}">unsubscribe here</a>.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"${siteName}" <${process.env.SMTP_FROM}>`,
      to: email,
      subject: `Subscription Confirmed — ${siteName}`,
      html,
      text: `Hello,\n\nThank you for subscribing to the ${siteName} newsletter!\n\nYou can unsubscribe at any time: ${unsubscribeUrl}\n\n© ${new Date().getFullYear()} ${siteName}`,
    });

    await logEmail(email, EMAIL_TYPE, 'sent', null);
    
    // Track last sent timestamp
    await db.query(
      'UPDATE newsletter_subscribers SET last_email_sent = CURRENT_TIMESTAMP WHERE email = ?',
      [email]
    );

    return { sent: true, error: null };
  } catch (err) {
    console.error('[EmailService] Failed to send subscription confirmation:', err.message);
    await logEmail(email, EMAIL_TYPE, 'failed', err.message);
    return { sent: false, error: err.message };
  }
};

const sendAnnouncementEmailToSubscribers = async (announcement) => {
  const EMAIL_TYPE = 'newsletter_announcement';

  try {
    // 1. Fetch active subscribers
    const [subscribers] = await db.query(
      "SELECT id, email, unsubscribe_token FROM newsletter_subscribers WHERE status = 'active'"
    );

    if (subscribers.length === 0) {
      return;
    }

    if (!isConfigured()) {
      for (const sub of subscribers) {
        await logEmail(sub.email, EMAIL_TYPE, 'skipped', 'SMTP not configured');
      }
      return;
    }

    const siteName = 'Calculus Corner';
    const siteUrl = process.env.SITE_URL;
    const backendUrl = process.env.BACKEND_URL;

    const path = require('path');
    const fs = require('fs');

    let logoCid = null;
    const attachments = [];

    let logoUrl = `${siteUrl}/logo-og.png`;
    try {
      const [logoRows] = await db.query("SELECT content_data FROM site_content WHERE section_name = 'logo'");
      if (logoRows.length > 0) {
        const data = typeof logoRows[0].content_data === 'string'
          ? JSON.parse(logoRows[0].content_data)
          : logoRows[0].content_data;
        if (data && data.logo_url) {
          logoUrl = data.logo_url.startsWith('http') ? data.logo_url : `${backendUrl}${data.logo_url}`;
          
          if (data.logo_url.startsWith('/uploads')) {
            const diskPath = path.join(__dirname, '..', '..', data.logo_url);
            if (fs.existsSync(diskPath)) {
              logoCid = 'site-logo-inline';
              attachments.push({
                filename: path.basename(diskPath),
                path: diskPath,
                cid: logoCid
              });
            }
          }
        }
      }
    } catch (err) {}

    const transporter = createTransporter();
    
    // Process sending asynchronously in batches to prevent event loop lag
    const batchSize = 10;
    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (sub) => {
          const unsubscribeUrl = `${backendUrl}/api/content/newsletter/unsubscribe?token=${sub.unsubscribe_token}`;
          const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${announcement.title || 'New Announcement'} — ${siteName}</title>
  <style>
    body { margin: 0; padding: 0; background: #F8FAFC; font-family: 'Inter', Arial, sans-serif; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #E2E8F0; }
    .header { background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%); padding: 45px 32px; text-align: center; }
    .header img { max-height: 50px; margin-bottom: 12px; }
    .header h1 { color: #ffffff; font-size: 22px; font-weight: 800; margin: 0; }
    .body { padding: 40px 32px; }
    .announcement-title { font-size: 20px; font-weight: 800; color: #1E3A8A; margin: 0 0 16px; line-height: 1.3; }
    .announcement-date { font-size: 11px; font-weight: bold; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 20px; display: block; }
    .message { font-size: 14px; color: #334155; line-height: 1.8; margin-bottom: 28px; white-space: pre-line; }
    .cta { text-align: center; margin: 32px 0; }
    .cta a { display: inline-block; background: linear-gradient(135deg, #4f46e5, #3730a3); color: #ffffff !important; text-decoration: none; padding: 14px 36px; border-radius: 12px; font-weight: 700; font-size: 15px; }
    .divider { border: none; border-top: 1px solid #E2E8F0; margin: 28px 0; }
    .footer { background: #F8FAFC; padding: 24px 32px; text-align: center; border-top: 1px solid #E2E8F0; }
    .footer p { font-size: 11px; color: #94A3B8; margin: 0; line-height: 1.6; }
    .footer a { color: #ef4444; font-weight: bold; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <img src="${logoCid ? `cid:${logoCid}` : logoUrl}" alt="${siteName} Logo" style="max-height: 50px; display: inline-block;" />
      <h1>Calculus Corner Updates</h1>
    </div>

    <div class="body">
      <h2 class="announcement-title">${announcement.title || 'Important Notice'}</h2>
      <span class="announcement-date">Published on ${new Date(announcement.created_at || Date.now()).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
      <div class="message">${announcement.text}</div>

      <div class="cta">
        <a href="${siteUrl}">Read More on Website</a>
      </div>
    </div>

    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${siteName}. All rights reserved.</p>
      <p style="margin-top: 8px;">
        To stop receiving emails, you can <a href="${unsubscribeUrl}">unsubscribe here</a>.
      </p>
    </div>
  </div>
</body>
</html>
          `.trim();

          try {
            await transporter.sendMail({
              from: `"${siteName}" <${process.env.SMTP_FROM}>`,
              to: sub.email,
              subject: `${announcement.title || 'New Announcement'} — ${siteName}`,
              html,
              text: `${announcement.title || 'Important Notice'}\n\n${announcement.text}\n\nRead more at ${siteUrl}\n\nUnsubscribe: ${unsubscribeUrl}\n\n© ${new Date().getFullYear()} ${siteName}`,
              attachments
            });

            await logEmail(sub.email, EMAIL_TYPE, 'sent', null);
            await db.query(
              'UPDATE newsletter_subscribers SET last_email_sent = CURRENT_TIMESTAMP WHERE id = ?',
              [sub.id]
            );
          } catch (sendErr) {
            console.error(`[EmailService] Failed to send announcement email to ${sub.email}:`, sendErr.message);
            await logEmail(sub.email, EMAIL_TYPE, 'failed', sendErr.message);
          }
        })
      );
      // Brief sleep between batches to avoid overloading SMTP server rates
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  } catch (err) {
    console.error('[EmailService] Fatal error in sendAnnouncementEmailToSubscribers:', err.message);
  }
};

/**
 * Sends an OTP Verification email for registration.
 * @param {string} email
 * @param {string} name
 * @param {string} otp
 * @returns {{ sent: boolean, error: string|null }}
 */
const sendOTPVerificationEmail = async (email, name, otp) => {
  const EMAIL_TYPE = 'otp_verification';

  if (!isConfigured()) {
    await logEmail(email, EMAIL_TYPE, 'skipped', 'SMTP not configured');
    return { sent: false, error: 'SMTP not configured' };
  }

  const siteName = 'Calculus Corner';
  const siteUrl = process.env.SITE_URL;
  const supportEmail = process.env.SMTP_FROM || 'support@calculuscorner.com';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Verify Your Email — ${siteName}</title>
  <style>
    body { margin: 0; padding: 0; background: #F8FAFC; font-family: 'Inter', Arial, sans-serif; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #E2E8F0; }
    .header { background: linear-gradient(135deg, #2563EB 0%, #1E40AF 100%); padding: 40px 32px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 22px; font-weight: 800; margin: 0; letter-spacing: -0.5px; }
    .header p { color: rgba(255,255,255,0.85); font-size: 14px; margin: 8px 0 0; }
    .body { padding: 40px 32px; text-align: center; }
    .greeting { font-size: 18px; font-weight: 700; color: #0F172A; margin-bottom: 16px; }
    .message { font-size: 15px; color: #475569; line-height: 1.7; margin-bottom: 32px; }
    .otp-box { background: #F1F5F9; border: 2px dashed #CBD5E1; border-radius: 12px; padding: 24px; margin-bottom: 32px; }
    .otp-code { font-size: 32px; font-weight: 800; color: #2563EB; letter-spacing: 4px; margin: 0; }
    .otp-warning { font-size: 13px; color: #64748B; margin-top: 12px; }
    .divider { border: none; border-top: 1px solid #E2E8F0; margin: 28px 0; }
    .support { font-size: 13px; color: #64748B; text-align: center; line-height: 1.6; }
    .footer { background: #F8FAFC; padding: 24px 32px; text-align: center; border-top: 1px solid #E2E8F0; }
    .footer p { font-size: 12px; color: #94A3B8; margin: 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>${siteName}</h1>
      <p>Where Mathematics Meets Infinity</p>
    </div>

    <div class="body">
      <p class="greeting">Welcome, ${name}!</p>
      <p class="message">
        Thank you for registering with <strong>${siteName}</strong>. 
        To complete your registration and secure your account, please use the verification code below.
      </p>

      <div class="otp-box">
        <h2 class="otp-code">${otp}</h2>
        <p class="otp-warning">This code will expire in 10 minutes. Do not share it with anyone.</p>
      </div>

      <hr class="divider" />
      <p class="support">
        If you didn't create this account, please ignore this email or contact us at ${supportEmail}.
      </p>
    </div>

    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${siteName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"${siteName}" <${process.env.SMTP_FROM}>`,
      to: email,
      subject: `Your Verification Code: ${otp}`,
      html,
    });

    await logEmail(email, EMAIL_TYPE, 'sent');
    return { sent: true, error: null };
  } catch (error) {
    await logEmail(email, EMAIL_TYPE, 'failed', error.message);
    return { sent: false, error: error.message };
  }
};

module.exports = { 
  sendUnbanEmail, 
  isConfigured, 
  logEmail, 
  wasEmailAlreadySent,
  sendSubscriptionConfirmation,
  sendAnnouncementEmailToSubscribers,
  sendOTPVerificationEmail
};
