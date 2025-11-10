# Email Configuration Guide

## Overview
The HMS appointment system sends automatic email notifications for:
- Appointment confirmations (on booking)
- Rescheduling notifications (old vs new date)
- Queue scheduling confirmations

## Setup Instructions

### 1. Environment Variables
Add these to your `server/.env` file:

```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="HMS Notifications <noreply@hms.local>"
```

### 2. Gmail Setup (Recommended for Development)

**Step 1:** Enable 2-Factor Authentication
1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification

**Step 2:** Create App Password
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Other (Custom name)"
3. Name it "HMS Server"
4. Copy the 16-character password
5. Use this as `SMTP_PASS` in your `.env`

**Step 3:** Update `.env`
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your.email@gmail.com
SMTP_PASS=abcd efgh ijkl mnop  # Your 16-char app password
SMTP_FROM="HMS Notifications <your.email@gmail.com>"
```

### 3. Other Email Providers

#### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

#### Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASS=your-mailgun-password
```

#### AWS SES
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-aws-access-key-id
SMTP_PASS=your-aws-secret-access-key
```

### 4. Testing Email Configuration

**Test 1: Create an Appointment**
```bash
POST /appointments
{
  "doctor": "doctor-id",
  "appointmentDate": "2024-12-25T10:00:00Z",
  "notes": "Test appointment"
}
```
✅ Patient should receive confirmation email

**Test 2: Resend Confirmation**
```bash
POST /appointments/:id/resend-confirmation
```
✅ Patient should receive another confirmation

**Test 3: Reschedule**
```bash
POST /appointments/:id/reschedule
{
  "newDate": "2024-12-26T10:00:00Z",
  "reason": "Conflict with another appointment"
}
```
✅ Patient should receive reschedule notification showing old vs new date

### 5. Email Templates

All email templates are in `server/src/utils/notifications.js`:

**Confirmation Email:**
- Subject: "Appointment Confirmation"
- Includes: Doctor name, date/time, appointment ID
- Action: Confirm button (links to confirmation endpoint)

**Reschedule Email:**
- Subject: "Appointment Rescheduled"
- Shows old date → new date
- Includes reason for reschedule

**Reminder Email (for future cron job):**
- Subject: "Appointment Reminder"
- Sent 24h before appointment

### 6. Customizing Email Templates

Edit `server/src/utils/notifications.js`:

```javascript
export async function sendAppointmentConfirmation({ to, patientName, doctorName, appointmentDate, appointmentId }) {
  // Customize HTML here
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Your custom header</h2>
      <!-- Add your branding, logo, etc. -->
    </div>
  `;
  
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: 'Your custom subject',
    html
  });
}
```

### 7. Troubleshooting

**Emails not sending?**
1. Check server logs for errors
2. Verify SMTP credentials are correct
3. Test SMTP connection with a simple script:
```javascript
import nodemailer from 'nodemailer';
const transporter = nodemailer.createTransporter({
  host: 'smtp.gmail.com',
  port: 587,
  auth: { user: 'your@email.com', pass: 'your-app-password' }
});
transporter.verify((err, success) => {
  if (err) console.error('SMTP Error:', err);
  else console.log('SMTP Ready:', success);
});
```

**Gmail blocking emails?**
- Ensure 2FA is enabled
- Use App Password, not regular password
- Check "Less secure app access" is OFF (use App Password instead)

**Emails going to spam?**
- Add SPF record to your domain
- Use authenticated sender address
- Consider using a transactional email service (SendGrid, Mailgun)

### 8. Production Recommendations

**For Production, use a dedicated email service:**
- SendGrid (12,000 free emails/month)
- Mailgun (10,000 free emails/month)
- AWS SES (62,000 free emails/month)

**Benefits:**
- Better deliverability
- Automatic spam handling
- Email analytics
- Bounce management
- Scalability

### 9. SMS Configuration (Optional)

To enable SMS notifications, add to `.env`:

```env
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890
```

Then update `sendSMS()` in `notifications.js` to use Twilio SDK.

### 10. Monitoring

**Check email delivery:**
- Server logs show "Confirmation email sent" or error messages
- Frontend shows success/error toasts
- Patient receives email within 1-2 minutes

**Failed emails:**
- Logged to console with error details
- Do not block appointment creation
- Can be resent via "Resend Confirmation" button

---

## Quick Start

1. Copy `.env.example` to `.env`
2. Fill in SMTP credentials
3. Restart server: `npm run dev`
4. Create a test appointment
5. Check patient email inbox
6. ✅ Done!

For support, check server logs or contact system administrator.
