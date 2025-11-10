# Security Audit Report - Role-Based Access Control
**Date:** November 4, 2025
**Project:** Hospital Management System

## Executive Summary
Comprehensive security audit of role-based access control (RBAC) across backend and frontend. Overall security posture is **GOOD** with several critical issues requiring immediate attention.

---

## 🔴 CRITICAL ISSUES (Must Fix)

### 1. **Missing Doctor Authorization Check in Reschedule Endpoint**
**Location:** `server/src/controllers/appointmentController.js:127`
**Severity:** 🔴 Critical
**Issue:** The reschedule function checks Patient ownership but does NOT verify that Doctors can only reschedule their OWN appointments.

```javascript
// Current code only checks Patient role
if (userRole === 'Patient') {
  const patientProfile = await Patient.findOne({ user: user._id });
  if (!patientProfile || original.patient._id.toString() !== patientProfile._id.toString()) {
    throw createError(403, 'Cannot reschedule others appointments');
  }
}
// ❌ MISSING: Doctor should only reschedule their own appointments
```

**Impact:** A doctor could reschedule any other doctor's appointments.
**Fix Required:** Add doctor ownership validation

---

### 2. **Incorrect Role Access in Reschedule Endpoint**
**Location:** `server/src/controllers/appointmentController.js:126`
**Severity:** 🔴 Critical
**Issue:** Code references `user.roles?.[0]?.name` but auth middleware populates `user.role.name` (singular)

```javascript
const userRole = user.roles?.[0]?.name || 'Patient'; // ❌ WRONG
// Should be: user.role.name
```

**Impact:** Role check will always fail, defaulting to 'Patient'
**Fix Required:** Change to `user.role?.name`

---

### 3. **Missing Doctor in Reschedule Route Authorization**
**Location:** `server/src/routes/index.js:57`
**Severity:** 🔴 Critical
**Issue:** Doctor role is missing from reschedule endpoint authorization

```javascript
router.post('/appointments/:id/reschedule', requireAuth, 
  roleCheck(['Patient','Receptionist','Admin']), // ❌ Missing 'Doctor'
  Appt.reschedule
);
```

**Impact:** Doctors cannot reschedule appointments via API despite frontend UI allowing it.
**Fix Required:** Add 'Doctor' to allowed roles

---

### 4. **Missing Ownership Check in Follow-up Endpoint**
**Location:** `server/src/controllers/appointmentController.js:241`
**Severity:** 🔴 Critical
**Issue:** No verification that doctor scheduling follow-up is the actual treating doctor

```javascript
export const scheduleFollowUp = async (req, res, next) => {
  // ...
  const parent = await Appointment.findById(id);
  if (!parent) throw createError(404, 'Appointment not found');
  // ❌ MISSING: Check if req.user is the doctor for this appointment
```

**Impact:** Any doctor can schedule follow-ups for any other doctor's patients.
**Fix Required:** Add doctor ownership validation

---

## 🟡 HIGH PRIORITY ISSUES

### 5. **Missing Ownership Validation in Status Update**
**Location:** `server/src/controllers/appointmentController.js:92`
**Severity:** 🟡 High
**Issue:** Doctor role can update any appointment status without ownership check

```javascript
// Route: roleCheck(['Receptionist','Doctor','Admin'])
export const updateStatus = async (req, res, next) => {
  // No check if doctor owns this appointment
  const appt = await Appointment.findByIdAndUpdate(id, { status }, { new: true });
```

**Impact:** Doctors can mark other doctors' appointments as completed.
**Fix Required:** Add doctor ownership check when role is Doctor

---

### 6. **Patient Can Delete Their Queue Entries Without Validation**
**Location:** `server/src/routes/index.js:84`
**Severity:** 🟡 High
**Issue:** Patient can delete queue entries but no ownership validation in controller

```javascript
router.delete('/waiting-queue/:id', requireAuth, 
  roleCheck(['Patient','Admin','Receptionist']), 
  Queue.leaveQueue
);
```

**Impact:** If controller doesn't check ownership, patient could delete others' queue entries.
**Recommendation:** Verify Queue.leaveQueue has ownership checks

---

## 🟢 GOOD SECURITY PRACTICES

### ✅ Authentication & Authorization
1. **JWT properly validated** in `auth.js` middleware
2. **Role-based access** consistently applied across routes
3. **Password properly hashed** with bcrypt (salt rounds: 10)
4. **Password excluded from queries** by default (`select: false`)
5. **Refresh token rotation** implemented

### ✅ Frontend Protection
1. **ProtectedRoute** component properly guards routes
2. **GuestRoute** prevents authenticated access to public pages
3. **Role-based redirects** working correctly
4. **UI elements** conditionally rendered based on user role

### ✅ Data Access Controls
1. **Patient data filtering** in appointment list (patients see only their appointments)
2. **Doctor data filtering** in appointment list (doctors see only their appointments)
3. **Bill access** properly restricted by patient/doctor ownership
4. **Patient profile** creation auto-linked to logged-in user

---

## 🔵 RECOMMENDATIONS

### 7. Add Rate Limiting
**Priority:** Medium
**Location:** Server entry point
**Recommendation:** Add rate limiting to prevent brute force attacks on login endpoint

```javascript
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many login attempts, please try again later'
});

router.post('/auth/login', loginLimiter, validate(loginSchema), Auth.login);
```

---

### 8. Add CSRF Protection
**Priority:** Medium
**Location:** Server middleware
**Recommendation:** Implement CSRF tokens for state-changing operations

---

### 9. Enhance Logging for Security Events
**Priority:** Medium
**Location:** Auth controller
**Recommendation:** Log failed login attempts, role changes, sensitive data access

---

### 10. Add Input Sanitization
**Priority:** Medium
**Location:** All controllers
**Recommendation:** Sanitize user inputs to prevent NoSQL injection

```javascript
import mongoSanitize from 'express-mongo-sanitize';
app.use(mongoSanitize());
```

---

## ROLE PERMISSION MATRIX

| Resource | Admin | Receptionist | Doctor | Patient |
|----------|-------|--------------|--------|---------|
| **Patients** |
| List | ✅ | ✅ | ✅ | ❌ |
| View | ✅ | ✅ | ✅ | ❌ |
| Create | ✅ | ✅ | ❌ | ❌ |
| Update | ✅ | ✅ | ❌ | ❌ |
| Delete | ✅ | ❌ | ❌ | ❌ |
| **Doctors** |
| List | ✅ | ✅ | ✅ | ✅ |
| View | ✅ | ✅ | ✅ | ✅ |
| Create | ✅ | ❌ | ❌ | ❌ |
| Update | ✅ | ❌ | ❌ | ❌ |
| Delete | ✅ | ❌ | ❌ | ❌ |
| **Appointments** |
| List | ✅ | ✅ | ✅ (own) | ✅ (own) |
| View | ✅ | ✅ | ✅ | ✅ |
| Create | ✅ | ✅ | ❌ | ✅ |
| Update | ✅ | ✅ | ❌ | ❌ |
| Update Status | ✅ | ✅ | ✅ (own) | ❌ |
| Reschedule | ✅ | ✅ | ✅ (own) | ✅ (own) |
| Follow-up | ✅ | ✅ | ✅ (own) | ❌ |
| Generate Bill | ✅ | ✅ | ❌ | ❌ |
| **Bills** |
| List | ✅ | ✅ | ✅ (own) | ✅ (own) |
| View | ✅ | ✅ | ✅ (own) | ✅ (own) |
| Update | ✅ | ✅ | ❌ | ❌ |
| **Availability** |
| View | ✅ | ✅ | ✅ | ✅ |
| Manage | ✅ | ❌ | ✅ (own) | ❌ |
| **Waiting Queue** |
| View | ✅ | ✅ | ✅ | ❌ |
| Join | ✅ | ✅ | ❌ | ✅ |
| Update | ✅ | ✅ | ❌ | ❌ |
| Leave | ✅ | ✅ | ❌ | ✅ (own) |
| Schedule | ✅ | ✅ | ❌ | ❌ |

**Note:** "(own)" indicates ownership validation required

---

## REQUIRED FIXES SUMMARY

### Immediate Action Required:
1. ✅ Fix role access in reschedule controller (user.role.name)
2. ✅ Add Doctor to reschedule route authorization
3. ✅ Add Doctor ownership check in reschedule controller
4. ✅ Add Doctor ownership check in follow-up controller
5. ✅ Add Doctor ownership check in updateStatus controller

### Review Required:
6. ⚠️ Verify Queue.leaveQueue has ownership validation
7. ⚠️ Check if doctor availability endpoints validate ownership

---

## TESTING CHECKLIST

After fixes, test the following scenarios:

### ❌ Should FAIL (Security Tests):
- [ ] Patient A tries to reschedule Patient B's appointment
- [ ] Doctor A tries to reschedule Doctor B's appointment
- [ ] Doctor A tries to mark Doctor B's appointment as completed
- [ ] Doctor A tries to schedule follow-up for Doctor B's patient
- [ ] Patient A tries to view Patient B's bills
- [ ] Doctor A tries to view Doctor B's patient bills
- [ ] Patient A tries to delete Patient B's queue entry
- [ ] Doctor tries to modify another doctor's availability

### ✅ Should SUCCEED (Functional Tests):
- [ ] Patient can reschedule their own appointment
- [ ] Doctor can reschedule their own appointment
- [ ] Receptionist can reschedule any appointment
- [ ] Doctor can complete their own appointments
- [ ] Doctor can schedule follow-ups for their patients
- [ ] Patient can view their own bills
- [ ] Doctor can view bills for their appointments

---

## CONCLUSION

The application has a **solid foundation** for role-based access control with proper authentication, authorization middleware, and frontend protection. However, **critical ownership validation gaps** exist in appointment management endpoints that could allow unauthorized actions.

**Priority:** Fix all 🔴 CRITICAL issues before production deployment.

**Next Steps:**
1. Apply fixes to appointment controller
2. Add comprehensive integration tests for RBAC
3. Implement recommended security enhancements (rate limiting, CSRF)
4. Conduct penetration testing with different role combinations
