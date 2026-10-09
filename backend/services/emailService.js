const nodemailer = require("nodemailer");
const { env } = require("../config/env");

let transporter = null;
let warnedOnce = false;

const getTransporter = () => {
  if (!env.isSmtpConfigured) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    });
  }
  return transporter;
};

const sendMail = async ({ to, subject, html, text }) => {
  const transport = getTransporter();
  if (!transport) {
    if (!warnedOnce) {
      console.log("SMTP not configured, skipping email");
      warnedOnce = true;
    }
    return false;
  }
  await transport.sendMail({
    from: env.EMAIL_FROM || env.SMTP_USER,
    to,
    subject,
    text,
    html,
  });
  return true;
};

const escapeHtml = (s = "") =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const newJobEmailTemplate = ({ name, listing }) => {
  const jobsUrl = `${env.APP_URL.replace(/\/$/, "")}/jobs`;
  const subject = `New job posted: ${listing.role} at ${listing.company}`;
  const text = `Hi ${name},\n\n${listing.company} just posted a new ${listing.type} role: ${listing.role}${
    listing.location ? ` in ${listing.location}` : ""
  }${listing.salary ? ` (${listing.salary})` : ""}.\n\nView it on JobSaathi: ${jobsUrl}\n\n— JobSaathi`;

  const html = `
  <div style="background:#0b1120;padding:32px 16px;font-family:Inter,Segoe UI,Arial,sans-serif;color:#e2e8f0">
    <div style="max-width:560px;margin:0 auto;background:#111827;border:1px solid #1f2937;border-radius:16px;overflow:hidden">
      <div style="background:#4f46e5;padding:20px 28px">
        <h1 style="margin:0;font-size:20px;color:#fff;letter-spacing:.3px">JobSaathi</h1>
      </div>
      <div style="padding:28px">
        <p style="margin:0 0 12px;font-size:15px">Hi ${escapeHtml(name)},</p>
        <p style="margin:0 0 20px;font-size:15px;line-height:1.6">A new job was just listed on the platform.</p>
        <div style="background:#0f172a;border:1px solid #1f2937;border-radius:12px;padding:18px 20px;margin-bottom:24px">
          <p style="margin:0 0 6px;font-size:18px;font-weight:600;color:#fff">${escapeHtml(listing.role)}</p>
          <p style="margin:0 0 10px;font-size:15px;color:#a5b4fc">${escapeHtml(listing.company)}</p>
          <p style="margin:0;font-size:13px;color:#94a3b8">
            ${escapeHtml(listing.type || "Full-time")}${listing.location ? ` · ${escapeHtml(listing.location)}` : ""}${
    listing.salary ? ` · ${escapeHtml(listing.salary)}` : ""
  }
          </p>
        </div>
        <a href="${jobsUrl}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600;font-size:14px">View on JobSaathi</a>
        <p style="margin:28px 0 0;font-size:12px;color:#64748b">You are receiving this because you have a JobSaathi account.</p>
      </div>
    </div>
  </div>`;

  return { subject, text, html };
};

module.exports = { sendMail, newJobEmailTemplate };
