"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
exports.sendScanCompletedEmail = sendScanCompletedEmail;
exports.sendVulnerabilityAlertEmail = sendVulnerabilityAlertEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_1 = require("@shared/config/env");
const logger_1 = require("@shared/utils/logger");
const logger = (0, logger_1.getLogger)();
let _transporter = null;
function getTransporter() {
    if (!_transporter) {
        const env = (0, env_1.getEnv)();
        if (env.SMTP_USER && env.SMTP_PASS) {
            _transporter = nodemailer_1.default.createTransport({
                host: env.SMTP_HOST,
                port: env.SMTP_PORT,
                secure: env.SMTP_SECURE,
                auth: {
                    user: env.SMTP_USER,
                    pass: env.SMTP_PASS,
                },
            });
        }
        else {
            _transporter = nodemailer_1.default.createTransport({
                host: env.SMTP_HOST,
                port: env.SMTP_PORT,
                secure: false,
                ignoreTLS: true,
            });
        }
    }
    return _transporter;
}
async function sendEmail(options) {
    const env = (0, env_1.getEnv)();
    try {
        const transporter = getTransporter();
        await transporter.sendMail({
            from: `"${env.EMAIL_FROM_NAME}" <${env.EMAIL_FROM}>`,
            to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
            cc: options.cc ? (Array.isArray(options.cc) ? options.cc.join(', ') : options.cc) : undefined,
            bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc) : undefined,
            subject: options.subject,
            text: options.text,
            html: options.html,
            attachments: options.attachments,
        });
        logger.info({ to: options.to, subject: options.subject }, 'Email sent successfully');
        return true;
    }
    catch (error) {
        logger.error({ error: error.message, to: options.to }, 'Failed to send email');
        return false;
    }
}
async function sendScanCompletedEmail(to, scanId, imageRef, summary) {
    const subject = `[FortifyCI] Scan Completed - ${imageRef}`;
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a73e8;">FortifyCI - Scan Complete</h2>
      <p>Scan for image <strong>${imageRef}</strong> has completed.</p>
      <h3>Vulnerability Summary</h3>
      <table style="border-collapse: collapse; width: 100%;">
        <tr style="background: #f5f5f5;">
          <th style="padding: 8px; border: 1px solid #ddd;">Severity</th>
          <th style="padding: 8px; border: 1px solid #ddd;">Count</th>
        </tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd; color: #d93025;">Critical</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${summary.critical}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd; color: #ea8600;">High</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${summary.high}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd; color: #e8a700;">Medium</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${summary.medium}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd; color: #5f6368;">Low</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${summary.low}</td></tr>
        <tr style="background: #f5f5f5;">
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Total</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>${summary.total}</strong></td></tr>
      </table>
      <p><a href="${(0, env_1.getEnv)().API_PREFIX}/scans/${scanId}" style="color: #1a73e8;">View full scan results</a></p>
    </div>
  `;
    return sendEmail({ to, subject, html });
}
async function sendVulnerabilityAlertEmail(to, imageRef, vulnerabilityId, severity, packageName) {
    const subject = `[FortifyCI] ${severity.toUpperCase()} Vulnerability Found - ${vulnerabilityId}`;
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #d93025;">Vulnerability Alert</h2>
      <p>A <strong>${severity}</strong> vulnerability was found in <strong>${imageRef}</strong>.</p>
      <table style="border-collapse: collapse;">
        <tr><td style="padding: 4px 8px;"><strong>CVE:</strong></td>
          <td style="padding: 4px 8px;">${vulnerabilityId}</td></tr>
        <tr><td style="padding: 4px 8px;"><strong>Package:</strong></td>
          <td style="padding: 4px 8px;">${packageName}</td></tr>
        <tr><td style="padding: 4px 8px;"><strong>Severity:</strong></td>
          <td style="padding: 4px 8px;">${severity}</td></tr>
      </table>
    </div>
  `;
    return sendEmail({ to, subject, html });
}
//# sourceMappingURL=email.js.map