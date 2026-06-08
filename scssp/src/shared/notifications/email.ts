import nodemailer from 'nodemailer';
import { getEnv } from '@shared/config/env';
import { getLogger } from '@shared/utils/logger';

const logger = getLogger();

let _transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!_transporter) {
    const env = getEnv();
    if (env.SMTP_USER && env.SMTP_PASS) {
      _transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_SECURE,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });
    } else {
      _transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: false,
        ignoreTLS: true,
      });
    }
  }
  return _transporter;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content?: Buffer | string;
    path?: string;
    contentType?: string;
  }>;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const env = getEnv();
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
  } catch (error: any) {
    logger.error({ error: error.message, to: options.to }, 'Failed to send email');
    return false;
  }
}

export async function sendScanCompletedEmail(
  to: string,
  scanId: string,
  imageRef: string,
  summary: { critical: number; high: number; medium: number; low: number; total: number },
): Promise<boolean> {
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
      <p><a href="${getEnv().API_PREFIX}/scans/${scanId}" style="color: #1a73e8;">View full scan results</a></p>
    </div>
  `;

  return sendEmail({ to, subject, html });
}

export async function sendVulnerabilityAlertEmail(
  to: string,
  imageRef: string,
  vulnerabilityId: string,
  severity: string,
  packageName: string,
): Promise<boolean> {
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
