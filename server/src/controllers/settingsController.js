import Settings from '../models/Settings.js';
import { ok } from '../utils/response.js';
import createError from 'http-errors';
import nodemailer from 'nodemailer';

// Get all settings
export const getSettings = async (req, res, next) => {
  try {
    const settings = await Settings.getInstance();
    // Don't send sensitive data like SMTP password
    const sanitized = settings.toObject();
    if (sanitized.email?.smtpPass) {
      sanitized.email.smtpPass = sanitized.email.smtpPass ? '********' : '';
    }
    if (sanitized.email?.dkimPrivateKey) {
      sanitized.email.dkimPrivateKey = sanitized.email.dkimPrivateKey ? '********' : '';
    }
    ok(res, sanitized);
  } catch (e) {
    next(e);
  }
};

// Update settings (full or partial)
export const updateSettings = async (req, res, next) => {
  try {
    const settings = await Settings.getInstance();
    const { general, email, system, notifications } = req.body;

    // Update only provided sections
    if (general) {
      Object.assign(settings.general, general);
    }
    if (email) {
      // If password is masked, don't update it
      if (email.smtpPass === '********') {
        delete email.smtpPass;
      }
      if (email.dkimPrivateKey === '********') {
        delete email.dkimPrivateKey;
      }
      Object.assign(settings.email, email);
    }
    if (system) {
      Object.assign(settings.system, system);
    }
    if (notifications) {
      Object.assign(settings.notifications, notifications);
    }

    settings.updatedBy = req.user._id;
    settings.lastModified = new Date();
    await settings.save();

    // Sanitize response
    const sanitized = settings.toObject();
    if (sanitized.email?.smtpPass) {
      sanitized.email.smtpPass = '********';
    }
    if (sanitized.email?.dkimPrivateKey) {
      sanitized.email.dkimPrivateKey = '********';
    }

    ok(res, sanitized);
  } catch (e) {
    next(e);
  }
};

// Test SMTP connection
export const testSmtpConnection = async (req, res, next) => {
  try {
    const { smtpHost, smtpPort, smtpUser, smtpPass, smtpSecure, smtpTLS } = req.body;

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
      throw createError(400, 'SMTP configuration incomplete');
    }

    // Create test transporter
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort),
      secure: smtpSecure,
      requireTLS: smtpTLS,
      auth: {
        user: smtpUser,
        pass: smtpPass
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000
    });

    // Verify connection
    await transporter.verify();
    
    ok(res, { success: true, message: 'SMTP connection successful' });
  } catch (e) {
    if (e.code === 'EAUTH') {
      throw createError(401, 'Authentication failed. Check username and password.');
    } else if (e.code === 'ECONNECTION') {
      throw createError(502, 'Could not connect to SMTP server. Check host and port.');
    } else if (e.code === 'ETIMEDOUT') {
      throw createError(504, 'Connection timed out. Check firewall settings.');
    }
    next(e);
  }
};

// Send test email
export const sendTestEmail = async (req, res, next) => {
  try {
    const { to, smtpHost, smtpPort, smtpUser, smtpPass, smtpSecure, smtpTLS, fromEmail, fromName } = req.body;

    if (!to) {
      throw createError(400, 'Recipient email address required');
    }

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
      throw createError(400, 'SMTP configuration incomplete');
    }

    // Create test transporter
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort),
      secure: smtpSecure,
      requireTLS: smtpTLS,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });

    // Send test email
    await transporter.sendMail({
      from: `${fromName || 'HMS System'} <${fromEmail || smtpUser}>`,
      to,
      subject: 'Test Email - Hospital Management System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">SMTP Configuration Test</h2>
          <p>This is a test email to verify your SMTP settings are working correctly.</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Server:</strong> ${smtpHost}:${smtpPort}</p>
            <p><strong>Secure:</strong> ${smtpSecure ? 'Yes (SSL)' : 'No'}</p>
            <p><strong>TLS:</strong> ${smtpTLS ? 'Enabled' : 'Disabled'}</p>
            <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <p style="color: #10b981;">✓ If you received this email, your SMTP configuration is working correctly!</p>
        </div>
      `
    });

    ok(res, { success: true, message: `Test email sent successfully to ${to}` });
  } catch (e) {
    if (e.code === 'EAUTH') {
      throw createError(401, 'Authentication failed. Check username and password.');
    } else if (e.code === 'EENVELOPE') {
      throw createError(400, 'Invalid sender or recipient email address.');
    }
    next(e);
  }
};

// Get system statistics
export const getSystemStats = async (req, res, next) => {
  try {
    const User = (await import('../models/User.js')).default;
    const Log = (await import('../models/Log.js')).default;
    const Appointment = (await import('../models/Appointment.js')).default;
    
    const [userCount, logCount, todayAppointments] = await Promise.all([
      User.countDocuments(),
      Log.countDocuments(),
      Appointment.countDocuments({
        appointmentDate: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999))
        }
      })
    ]);

    const stats = {
      users: userCount,
      logs: logCount,
      todayAppointments,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version,
      platform: process.platform
    };

    ok(res, stats);
  } catch (e) {
    next(e);
  }
};
