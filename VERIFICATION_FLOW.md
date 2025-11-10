# Email Verification Flow Documentation

## Overview
The HMS application implements a secure 6-digit verification code system for email verification. This document describes the complete user journey for both new registrations and returning unverified users.

## Features
- ✅ 6-digit numeric verification codes
- ✅ 15-minute code expiration
- ✅ Auto-resend on expired codes during login
- ✅ Manual resend option
- ✅ Login enforcement (403 block for unverified users)
- ✅ Seamless frontend/backend integration
- ✅ Responsive UI with Tailwind CSS
- ✅ Toast notifications for user feedback

## User Flows

### 1. New User Registration Flow

```
User → Signup Form → Submit
  ↓
Backend: 
  - Create user account
  - Generate 6-digit code
  - Save code with 15min expiry
  - Send email with code
  ↓
Frontend:
  - Show success toast
  - Redirect to /verify-email?email=user@example.com
  ↓
Verify Email Page:
  - Email pre-filled (disabled)
  - Code input field (6 digits)
  - Submit button
  - "Resend Code" button
  - "Back to Login" link
  ↓
User enters code → Submit
  ↓
Backend:
  - Validate email + code
  - Check expiration
  - Mark user as verified
  - Clear verification code
  - Send welcome email
  ↓
Frontend:
  - Show success toast
  - Redirect to /login with success message
  ↓
User logs in successfully ✓
```

### 2. Returning Unverified User Flow

```
User (not verified) → Login Form → Submit
  ↓
Backend:
  - Check credentials (valid)
  - Check isEmailVerified (false)
  - Check if code expired/missing
  - Auto-generate new code
  - Send fresh verification email
  - Return 403 error
  ↓
Frontend:
  - Detect 403 "verify" error
  - Show error toast
  - Redirect to /verify-email?email=user@example.com
  - Show info message about code sent
  ↓
Verify Email Page:
  - Email pre-filled
  - Fresh code sent to inbox
  - User enters new code → Submit
  ↓
Backend: Verify & mark as verified
  ↓
Frontend: Redirect to login
  ↓
User logs in successfully ✓
```

### 3. Code Expired During Verification

```
User on /verify-email → Enters expired code → Submit
  ↓
Backend: Returns error "Verification code expired or invalid"
  ↓
Frontend: Shows error toast
  ↓
User clicks "Resend Code"
  ↓
Backend:
  - Generate new code
  - Update expiry to +15 minutes
  - Send new email
  ↓
Frontend:
  - Show success toast "Code sent!"
  - Clear code input
  ↓
User checks email → Enters new code → Success ✓
```

## API Endpoints

### POST /api/auth/register
**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "patientData": { /* optional patient fields */ }
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Registration successful. Please verify your email.",
  "data": {
    "user": {
      "_id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "isEmailVerified": false,
      "role": "Patient"
    }
  }
}
```

**Side Effect:** Sends email with 6-digit code (expires in 15min)

---

### POST /api/auth/verify-email
**Request:**
```json
{
  "email": "john@example.com",
  "code": "123456"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Email verified successfully!",
  "data": {
    "user": {
      "_id": "...",
      "email": "john@example.com",
      "isEmailVerified": true
    }
  }
}
```

**Errors:**
- 400: Missing email or code
- 400: Invalid code format (must be 6 digits)
- 404: User not found
- 400: Already verified
- 400: Code expired or invalid

**Side Effect:** Sends welcome email after successful verification

---

### POST /api/auth/resend-code
**Request:**
```json
{
  "email": "john@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Verification code sent!",
  "data": {
    "email": "john@example.com",
    "expiresInMinutes": 15
  }
}
```

**Errors:**
- 400: Missing email
- 404: User not found
- 400: Email already verified

**Side Effect:** Generates new code and sends email

---

### POST /api/auth/login
**Request:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response (200) - Verified User:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { /* user object */ },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

**Response (403) - Unverified User:**
```json
{
  "success": false,
  "message": "Please verify your email before logging in. A verification code has been sent to your inbox."
}
```

**Side Effect (403):** If code is expired/missing, automatically generates and sends fresh code

**Errors:**
- 401: Invalid credentials
- 403: Email not verified (auto-resends code)

---

## Frontend Components

### `/verify-email` Route (VerifyEmail.jsx)

**Features:**
- Email input (pre-filled from URL query param, disabled)
- 6-digit code input (numeric only, auto-trim)
- Submit button (disabled until 6 digits entered)
- Resend Code button
- Back to Login link
- Toast notifications for all states
- Gradient design matching HMS theme

**Props/State:**
- `email` - from URL query param `?email=...`
- `code` - controlled input, 6-digit validation
- `loading` - submit button state
- `resending` - resend button state

**Validation:**
- Email: required, valid format
- Code: required, exactly 6 digits, numeric only

**User Messages:**
- Success: "Email verified successfully!" → redirect to login
- Error: API error message (e.g., "Code expired")
- Resend success: "A new verification code has been sent to your email!"
- Resend error: "Failed to resend code. Please try again."

---

## Backend Implementation

### User Model Fields
```javascript
{
  verificationCode: { 
    type: String, 
    select: false  // Hidden by default, must explicitly select
  },
  verificationCodeExpiry: { 
    type: Date, 
    select: false 
  },
  isEmailVerified: { 
    type: Boolean, 
    default: false 
  }
}
```

### Verification Utilities (`src/utils/verificationCode.js`)

**generateVerificationCode()**
- Returns 6-digit random number as string
- Range: 100000 - 999999

**getCodeExpiry(minutes = 15)**
- Returns Date object for expiry
- Default: 15 minutes from now

**isCodeValid(inputCode, storedCode, expiry)**
- Validates code match and expiration
- Returns boolean

### Email Templates (`src/utils/emailTemplates.js`)

**verifyEmailCodeTemplate({ name, verificationCode, expiresInMinutes })**
- Returns { html, text }
- Displays code prominently in monospace font
- Includes expiry warning

**welcomeEmailTemplate({ name, role, dashboardUrl })**
- Sent after successful verification
- Role-specific dashboard link

**loginGreetingTemplate({ name, loginTime, ip, userAgent, lastLoginAt })**
- Optional security notification
- Shows login details and previous login time

---

## Configuration (.env)

```bash
# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="HMS Team <noreply@hms.com>"

# Application
FRONTEND_URL=http://localhost:5173
APP_NAME=Airelus Hospital Ltd

# Features
LOGIN_GREETING=true
LOGIN_NOTIFY=false
```

**Development Mode:**
- If SMTP credentials missing → auto-provision Ethereal test account
- Preview URLs logged in console
- No real emails sent

---

## Security Considerations

### Current Implementation
- ✅ Codes expire in 15 minutes
- ✅ Codes stored in plain text (6 digits, single-use, short-lived)
- ✅ Codes hidden from queries (`select: false`)
- ✅ Auto-cleared after verification
- ✅ Rate limiting on auth endpoints
- ✅ XSS protection, helmet, HPP

### Potential Improvements
- Hash verification codes before storing
- Add attempt counter (max 5 failed attempts → lock account)
- Separate verification secret from JWT secret
- Add IP-based rate limiting for resend
- Log verification attempts for audit trail

---

## Testing

### Manual Test Flow
1. **Register new account** at `/signup`
2. **Check email** for 6-digit code (or Ethereal preview URL in console)
3. **Verify on `/verify-email`** - enter code
4. **Logout** (if auto-logged in)
5. **Login** - should succeed
6. **Test expired code:**
   - Register new account
   - Wait 16+ minutes
   - Try to verify → should fail
   - Click "Resend Code"
   - Enter new code → should succeed
7. **Test unverified login:**
   - Register new account
   - Don't verify
   - Try to login → should get 403
   - Should redirect to `/verify-email`
   - Check email for auto-sent code
   - Verify → login succeeds

### Automated Test (server)
```bash
cd server
node src/scripts/testVerificationFlow.js
```

**Tests:**
- ✅ Register creates code
- ✅ Login blocked (403) before verification
- ✅ Verify with code succeeds
- ✅ Login succeeds after verification
- ✅ Resend code works

---

## Troubleshooting

### "Code expired or invalid"
- Code expires in 15 minutes
- Click "Resend Code" to get fresh code
- Check correct email address

### "Email already verified"
- User already verified, can login directly
- No need to verify again

### Email not received
- Check spam/junk folder
- In development: Check console for Ethereal preview URL
- Verify SMTP credentials in `.env`
- Check `sendMail` errors in server logs

### Redirect not working after signup
- Verify `/verify-email` route exists in `App.jsx`
- Check `useNavigate` import in `signup.jsx`
- Check browser console for routing errors

### Login not blocking unverified users
- Verify `isEmailVerified` field in User model
- Check authController login logic (line ~60)
- Ensure user was created AFTER code system implementation

---

## File Changes Summary

### Backend
- `server/src/models/User.js` - Added verificationCode, verificationCodeExpiry fields
- `server/src/utils/verificationCode.js` - New utility for code generation/validation
- `server/src/utils/emailTemplates.js` - Updated templates with code display
- `server/src/controllers/authController.js` - Updated register, login, verify, added resend
- `server/src/validation/auth.js` - Added verifyEmailSchema, resendCodeSchema
- `server/src/routes/index.js` - Updated routes for POST verify-email, resend-code
- `server/.env` - Added LOGIN_GREETING, APP_NAME, FRONTEND_URL
- `server/README.md` - Documented verification flow

### Frontend
- `client/src/features/auth/VerifyEmail.jsx` - **New component** for code entry
- `client/src/features/auth/login.jsx` - Added 403 handling, redirect to verify
- `client/src/features/auth/signup.jsx` - Added redirect to verify after registration
- `client/src/App.jsx` - Added `/verify-email` route under GuestRoute

---

## Success Criteria
- ✅ Users cannot login without verification
- ✅ Verification codes sent via email
- ✅ Codes expire after 15 minutes
- ✅ Expired codes can be resent
- ✅ Login auto-resends code if expired
- ✅ UI guides users through verification
- ✅ Welcome email sent after verification
- ✅ No breaking changes to existing flows
- ✅ Clean error messages and UX
- ✅ Responsive design matching app theme
