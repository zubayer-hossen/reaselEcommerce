import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter;

function getTransporter() {
  if (transporter) return transporter;
  if (env.email.provider !== 'gmail') return null;
  if (!env.email.user || !env.email.appPassword) return null;

  transporter = nodemailer.createTransport({
    host: env.email.host,
    port: env.email.port,
    secure: env.email.secure,
    auth: {
      user: env.email.user,
      pass: env.email.appPassword,
    },
  });
  return transporter;
}

export function isEmailConfigured() {
  return env.email.provider === 'gmail' && Boolean(env.email.user && env.email.appPassword && env.email.from);
}

export async function verifyEmailTransport() {
  const mailer = getTransporter();
  if (!mailer) return { configured: false, verified: false };
  await mailer.verify();
  return { configured: true, verified: true };
}

export async function sendEmail({ to, subject, html, text }) {
  const mailer = getTransporter();
  if (!mailer) {
    if (!env.isProd) {
      console.log(`[email:dev] to=${to} subject=\"${subject}\"\n${text || html}`);
      return { queued: false, dev: true };
    }
    throw new Error('Gmail SMTP is not configured');
  }

  const info = await mailer.sendMail({
    from: env.email.from,
    to,
    subject,
    text,
    html,
  });
  return { queued: true, messageId: info.messageId };
}
