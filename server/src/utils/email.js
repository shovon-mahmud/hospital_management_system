import nodemailer from 'nodemailer';
import env from '../config/env.js';

let transporter;
async function getTransporter() {
  if (transporter) return transporter;
  // If SMTP creds are provided, use them; otherwise create an Ethereal account for dev testing
  if (env.smtp.host && env.smtp.user && env.smtp.pass) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      auth: { user: env.smtp.user, pass: env.smtp.pass }
    });
    return transporter;
  }
  // Dev fallback: Ethereal
  const testAccount = await nodemailer.createTestAccount();
  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass }
  });
  return transporter;
}

export const sendMail = async ({ to, subject, html, text }) => {
  const t = await getTransporter();
  const info = await t.sendMail({ from: env.smtp.from, to, subject, html, text });
  // Attach preview URL in dev fallback
  const preview = nodemailer.getTestMessageUrl?.(info);
  return { ...info, previewUrl: preview };
};
