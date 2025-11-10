# Email Verification System - All Scenarios

## Overview
Your system uses **link-based email verification** (not 6-digit codes). Here's a comprehensive breakdown of all verification scenarios.

---

## 🔐 Verification Flow Architecture

### Components:
1. **Backend**: JWT-based verification tokens (24h validity)
2. **Frontend**: Token extraction from URL and API verification
3. **Email**: SMTP-based delivery via Nodemailer
4. **Database**: MongoDB User model with verification fields

### Key Fields in User Model:
- `isEmailVerified` (Boolean): Verification status
- `verificationCode` (String): Stores JWT token (not a 6-digit code)
- `verificationCodeExpiry` (Date): Token expiration timestamp

---

## 📋 All Verification Scenarios

### 1️⃣ **New User Registration**

**Flow:**
1. User submits signup form → `POST /auth/register`
2. Backend creates user with `isEmailVerified: false`
3. Backend generates JWT token (24h expiry)
4. Token stored in `user.verificationCode`
5. Email sent with verification link (non-blocking)
6. Frontend receives tokens immediately
7. User redirected to "Check your email" page

**Verification Link Format:**
```
https://hospital-management-system-o9as.vercel.app/verify-email?token=eyJhbGciOiJIUzI1NiIs...
```

**User States:**
- ✅ Account created
- ❌ Cannot login (blocked until verified)
- 📧 Email sent (best-effort, non-blocking)

**Edge Cases:**
- ✅ Duplicate email → Returns 409 "Email already in use"
- ✅ Weak password → Returns 400 with validation message
- ✅ Email send failure → User still created, manual resend available

---

### 2️⃣ **Email Verification via Link Click**

**Flow:**
1. User clicks link in email → `GET /auth/verify-email?token=...`
2. Backend verifies JWT token signature
3. Backend checks token matches stored `verificationCode`
4. Backend verifies token not expired
5. Backend sets `isEmailVerified: true`
6. Welcome email sent (non-blocking)
7. Frontend shows success message
8. Auto-redirect to login after 3 seconds

**Success Response:**
```json
{
  "success": true,
  "message": "Email verified successfully!"
}
```

**Edge Cases:**

**Case A: Token Expired**
```json
{
  "success": false,
  "message": "Verification link expired",
  "email": "user@example.com"
}
```
- Frontend shows "Resend Link" button
- Uses returned email to call resend endpoint

**Case B: Invalid Token (tampered/wrong)**
```json
{
  "success": false,
  "message": "Invalid verification link"
}
```
- User directed to login page
- New link auto-sent on login attempt

**Case C: Already Verified**
```json
{
  "success": true,
  "message": "Email already verified"
}
```
- User can proceed to login
- Auto-redirects to login page

**Case D: Token Mismatch (old token after resend)**
```json
{
  "success": false,
  "message": "Invalid or expired verification link",
  "email": "user@example.com"
}
```
- Happens when user requests new link but uses old one
- Only latest token is valid

---

### 3️⃣ **Login Attempt with Unverified Email**

**Flow:**
1. User enters credentials → `POST /auth/login`
2. Backend validates credentials ✅
3. Backend checks `isEmailVerified: false`
4. Backend checks if verification link expired
5. If expired/missing, auto-generates new token
6. New verification email sent
7. Login blocked with 403 error

**Response:**
```json
{
  "success": false,
  "message": "Please verify your email before logging in. A verification link has been sent to your inbox."
}
```

**Auto-Resend Triggers:**
- ✅ No verification code exists
- ✅ Verification code expired
- ✅ Legacy 6-digit code detected (auto-converted to link)

**User Experience:**
- Login form shows error message
- Check email for new verification link
- Click link → Verify → Login

---

### 4️⃣ **Manual Resend Verification Link**

**Flow:**
1. User clicks "Resend Link" → `POST /auth/resend-code`
2. Backend generates new JWT token (24h)
3. Old token invalidated (replaced)
4. New email sent (non-blocking)
5. Response returned immediately

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Verification link resent",
  "data": {
    "email": "user@example.com",
    "expiresInHours": 24
  }
}
```

**Edge Cases:**
- Email already verified → Returns "Email already verified"
- User not found → Returns 404
- Email send fails → User still gets success (best-effort email)

---

### 5️⃣ **Legacy User Auto-Verification**

**Flow:**
1. Existing user (before verification system) tries to login
2. Backend detects `isEmailVerified: undefined` or `false` with no code
3. Backend auto-sets `isEmailVerified: true`
4. Login proceeds normally

**Conditions for Auto-Verify:**
```javascript
if (user.isEmailVerified === undefined || 
    (user.isEmailVerified === false && !user.verificationCode)) {
  user.isEmailVerified = true;
  await user.save();
}
```

**Handles:**
- ✅ Users created before verification system
- ✅ Manual account creations by admin
- ✅ Seeded demo accounts

---

### 6️⃣ **Legacy Code Migration (6-digit to Link)**

**Flow:**
1. Old user with 6-digit code tries to login
2. Backend detects regex pattern `/^\d{6}$/`
3. Backend generates new JWT token
4. Old code replaced with link token
5. Email sent with new link
6. Login still blocked

**Detection:**
```javascript
const isLegacyCode = !!user.verificationCode && /^\d{6}$/.test(user.verificationCode);
```

**Why:**
- Smooth migration from old code-based system
- No manual intervention needed
- Users automatically upgraded

---

### 7️⃣ **Verification Link Expiry Handling**

**Token Lifetime:** 24 hours

**Expiry Checks:**
1. JWT library checks signature expiry
2. Database field `verificationCodeExpiry` checked
3. Both must be valid

**When Expired:**
- User clicks link → Gets "expired" message
- Email included in response for easy resend
- Frontend shows "Resend Link" button
- New link generated on resend

**Code:**
```javascript
if (!user.verificationCodeExpiry || new Date() > user.verificationCodeExpiry) {
  return res.status(400).json({ 
    success: false, 
    message: 'Verification link expired',
    email: user.email 
  });
}
```

---

### 8️⃣ **Welcome Email After Verification**

**Trigger:** Successful email verification

**Content:**
- Welcome message
- User's role
- Dashboard link
- App name

**Delivery:** Non-blocking (fire-and-forget)

**Failure Handling:**
- Errors caught and logged
- User verification still succeeds
- Does not block response

---

### 9️⃣ **Multiple Verification Attempts**

**Scenario:** User clicks verification link multiple times

**First Click:**
- ✅ Email verified
- Welcome email sent
- Redirect to login

**Subsequent Clicks:**
- Returns "Email already verified"
- Frontend detects and auto-redirects
- No errors shown

**Code:**
```javascript
if (user.isEmailVerified) {
  return ok(res, null, 'Email already verified');
}
```

---

### 🔟 **Token Security Validation**

**Security Checks:**

1. **JWT Signature Verification**
   ```javascript
   jwt.verify(token, env.jwt.accessSecret)
   ```

2. **Token Matches Database**
   ```javascript
   if (user.verificationCode !== token) {
     throw error('Invalid or expired verification link');
   }
   ```

3. **Expiry Validation**
   ```javascript
   if (new Date() > user.verificationCodeExpiry) {
     throw error('Verification link expired');
   }
   ```

4. **User Exists Check**
   ```javascript
   if (!user) throw createError(404, 'User not found');
   ```

**Why Multiple Checks:**
- JWT can be valid but old (after resend)
- Database token is source of truth
- Prevents replay attacks
- Ensures only latest token works

---

## 🧪 Testing Scenarios

### Test Case 1: Happy Path
1. Register new account
2. Check email
3. Click verification link
4. See success message
5. Login successfully

**Expected:** ✅ All steps succeed

---

### Test Case 2: Expired Link
1. Register account
2. Wait 25 hours (or manually expire token in DB)
3. Click verification link
4. See "expired" message
5. Click "Resend Link"
6. Check email for new link
7. Click new link
8. Verify successfully

**Expected:** ✅ Resend works, new link succeeds

---

### Test Case 3: Login Before Verification
1. Register account
2. Try to login immediately
3. See error: "Please verify your email..."
4. Check email for auto-resent link
5. Click link
6. Try login again

**Expected:** ✅ Login blocked initially, succeeds after verification

---

### Test Case 4: Multiple Resends
1. Register account
2. Request resend 3 times
3. Check email (should have 4 emails total)
4. Try all links
5. Only latest link works

**Expected:** ✅ Only most recent link succeeds, old links fail

---

### Test Case 5: Already Verified
1. Register and verify account
2. Try to verify again with same link
3. See "already verified" message
4. Auto-redirect to login

**Expected:** ✅ No error, graceful redirect

---

### Test Case 6: Invalid/Tampered Token
1. Register account
2. Manually modify token in URL
3. Click link
4. See "Invalid verification link"

**Expected:** ✅ Rejected, user can request new link

---

### Test Case 7: Email Send Failure
1. Register with invalid SMTP config
2. Account still created
3. Email fails silently
4. User can login and trigger resend
5. Or manually request resend

**Expected:** ✅ Account creation succeeds, manual resend available

---

### Test Case 8: Legacy User Login
1. Seed user without verification fields
2. Try to login
3. Auto-verified on login
4. Login succeeds

**Expected:** ✅ Seamless auto-verification

---

## 🔧 Configuration

### Environment Variables (Render):

```bash
# Email verification link expires in 24h
JWT_ACCESS_SECRET=<your-secret>

# Frontend URL for verification links
FRONTEND_URL=https://hospital-management-system-o9as.vercel.app

# SMTP for sending emails
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=shovon340x2@gmail.com
SMTP_PASS=<app-password>
SMTP_FROM="Airelus Hospital Ltd <shovon340x2@gmail.com>"
```

### Important Notes:
- ✅ All email sending is **non-blocking** (won't hang signup)
- ✅ Verification tokens stored as **JWT**, not 6-digit codes
- ✅ Tokens expire in **24 hours**
- ✅ Only **latest token** is valid (resends invalidate old tokens)
- ✅ **Legacy users** auto-verified on first login
- ✅ **Welcome email** sent after verification (best-effort)

---

## 🐛 Common Issues & Solutions

### Issue 1: "Creating account..." Hangs
**Cause:** Email sending was blocking (FIXED)
**Solution:** Made all `sendMail()` non-blocking

### Issue 2: Links Expire Too Fast
**Cause:** Token expiry too short
**Solution:** Set to 24h (configurable via JWT expiresIn)

### Issue 3: Old Links Don't Work After Resend
**Expected Behavior:** Only latest link works
**Solution:** Explain to users, auto-invalidation is security feature

### Issue 4: Emails Not Arriving
**Cause:** SMTP misconfiguration or spam filter
**Solutions:**
- Check SMTP credentials in Render
- Use Gmail App Password (not regular password)
- Check spam/junk folder
- Verify Render logs for email errors

### Issue 5: "Email Already Verified" on First Click
**Cause:** User clicked link twice quickly
**Solution:** Auto-redirect to login, no error shown

---

## 📊 Verification Status Flow

```
┌─────────────┐
│   Register  │
└──────┬──────┘
       │
       ▼
┌─────────────────────────┐
│ isEmailVerified: false  │
│ verificationCode: JWT   │
│ expiry: +24h            │
└──────┬──────────────────┘
       │
       ▼
  ┌────────┐
  │ Email  │
  │  Sent  │
  └────┬───┘
       │
       ▼
 ┌──────────────┐
 │ User Clicks  │
 │    Link      │
 └──────┬───────┘
        │
        ▼
  ┌──────────────────┐
  │ Token Validated  │
  └──────┬───────────┘
         │
         ├─ Valid ────────────┐
         │                    ▼
         │          ┌──────────────────┐
         │          │ isEmailVerified  │
         │          │    = true        │
         │          │ verificationCode │
         │          │    = undefined   │
         │          └────────┬─────────┘
         │                   │
         │                   ▼
         │          ┌──────────────┐
         │          │ Welcome Email│
         │          └──────────────┘
         │
         ├─ Expired ──────┐
         │                ▼
         │       ┌────────────────┐
         │       │ Resend Button  │
         │       └────────┬───────┘
         │                │
         │                ▼
         │       ┌────────────────┐
         │       │  New Token +   │
         │       │  New Email     │
         │       └────────────────┘
         │
         └─ Invalid ──────┐
                          ▼
                 ┌────────────────┐
                 │ Error Message  │
                 │ Redirect Login │
                 └────────────────┘
```

---

## ✅ Verification System Status

| Feature | Status | Notes |
|---------|--------|-------|
| Link-based verification | ✅ Working | JWT tokens, 24h expiry |
| Non-blocking emails | ✅ Fixed | Signup won't hang |
| Auto-resend on login | ✅ Working | Expired links regenerated |
| Manual resend | ✅ Working | User-triggered |
| Legacy user handling | ✅ Working | Auto-verification |
| Legacy code migration | ✅ Working | 6-digit → Link |
| Token validation | ✅ Secure | Multiple checks |
| Welcome email | ✅ Working | Non-blocking |
| Expiry handling | ✅ Robust | Clear error messages |
| Frontend UI | ✅ Complete | Success/error states |

---

**Last Updated:** November 11, 2025  
**System Version:** Production (Vercel + Render)  
**Verification Method:** JWT Link-based (24h expiry)
