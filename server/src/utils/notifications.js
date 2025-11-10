import nodemailer from 'nodemailer';
import env from '../config/env.js';

const transporter = nodemailer.createTransport({
  host: env.smtp?.host || 'smtp.example.com',
  port: env.smtp?.port || 587,
  secure: false,
  auth: {
    user: env.smtp?.user || 'noreply@hms.local',
    pass: env.smtp?.pass || 'password'
  }
});

export const sendAppointmentConfirmation = async ({ to, patientName, doctorName, appointmentDate, appointmentId }) => {
  try {
    const formattedDate = new Date(appointmentDate).toLocaleString();
    await transporter.sendMail({
      from: env.smtp?.from || 'HMS <noreply@hms.local>',
      to,
      subject: 'Appointment Confirmation - Hospital Management System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Appointment Confirmed</h2>
          <p>Dear ${patientName},</p>
          <p>Your appointment has been scheduled with the following details:</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Doctor:</strong> ${doctorName}</p>
            <p><strong>Date & Time:</strong> ${formattedDate}</p>
            <p><strong>Confirmation ID:</strong> ${appointmentId}</p>
          </div>
          <p>Please arrive 15 minutes before your scheduled time.</p>
          <p style="color: #6b7280; font-size: 12px;">If you need to reschedule, please contact us at least 24 hours in advance.</p>
        </div>
      `
    });
    return true;
  } catch (error) {
    console.error('Email send failed:', error);
    return false;
  }
};

export const sendAppointmentReminder = async ({ to, patientName, doctorName, appointmentDate }) => {
  try {
    const formattedDate = new Date(appointmentDate).toLocaleString();
    await transporter.sendMail({
      from: env.smtp?.from || 'HMS <noreply@hms.local>',
      to,
      subject: 'Appointment Reminder - Tomorrow',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">Appointment Reminder</h2>
          <p>Dear ${patientName},</p>
          <p>This is a reminder of your upcoming appointment:</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Doctor:</strong> ${doctorName}</p>
            <p><strong>Date & Time:</strong> ${formattedDate}</p>
          </div>
          <p>We look forward to seeing you!</p>
        </div>
      `
    });
    return true;
  } catch (error) {
    console.error('Reminder send failed:', error);
    return false;
  }
};

export const sendRescheduleNotification = async ({ to, patientName, doctorName, oldDate, newDate }) => {
  try {
    const formattedOld = new Date(oldDate).toLocaleString();
    const formattedNew = new Date(newDate).toLocaleString();
    await transporter.sendMail({
      from: env.smtp?.from || 'HMS <noreply@hms.local>',
      to,
      subject: 'Appointment Rescheduled',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f59e0b;">Appointment Rescheduled</h2>
          <p>Dear ${patientName},</p>
          <p>Your appointment has been rescheduled:</p>
          <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Doctor:</strong> ${doctorName}</p>
            <p style="text-decoration: line-through; color: #6b7280;"><strong>Previous:</strong> ${formattedOld}</p>
            <p><strong>New Date & Time:</strong> ${formattedNew}</p>
          </div>
          <p>Please mark your calendar with the new time.</p>
        </div>
      `
    });
    return true;
  } catch (error) {
    console.error('Reschedule notification failed:', error);
    return false;
  }
};

// SMS placeholder (would integrate with Twilio, AWS SNS, etc.)
export const sendSMS = async ({ to, message }) => {
  console.log(`[SMS] To: ${to}, Message: ${message}`);
  // In production: integrate with SMS provider
  return true;
};
