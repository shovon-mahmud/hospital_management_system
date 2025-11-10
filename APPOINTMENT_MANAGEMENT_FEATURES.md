# Appointment Management Features - Authority Roles

## Overview
The HMS now has comprehensive appointment management features across all authority roles (Admin, Receptionist, Doctor). Each role can:
- **Reschedule** appointments (pending/confirmed only)
- **Confirm** appointments (pending only)
- **Complete** appointments (pending/confirmed only)
- **Cancel** appointments (pending/confirmed only)
- **Generate Bills** (completed appointments only)
- **Schedule Follow-ups** (completed appointments only)

## Feature Implementation by Role

### 1. **Receptionist Dashboard** (`client/src/features/appointments/ReceptionDashboard.jsx`)
**Tab: Today's Appointments**
- Enhanced with status badges (pending/confirmed/completed/canceled)
- **Actions Available:**
  - ✅ **Confirm** - Change pending → confirmed
  - 🔄 **Reschedule** - Change date/time with reason (pending/confirmed only)
  - ✔️ **Complete** - Mark as completed (pending/confirmed only)
  - ❌ **Cancel** - Cancel appointment (pending/confirmed only)
  - 💰 **Generate Bill** - Create bill (completed only)

**Reschedule Modal:**
- Shows current appointment details (patient, doctor, current date)
- `DateTimeInput` component for new date selection (picker + manual typing)
- Reason textarea (required)
- Calls: `POST /appointments/:id/reschedule`

**Other Features:**
- Quick Booking form (Tab: Booking)
- Waiting Queue management (Tab: Queue)
- Billing overview (Tab: Billing)
- Doctor filter dropdown
- Status filter (All/Pending/Confirmed/Completed/Canceled)

---

### 2. **Doctor Dashboard** (`client/src/features/doctors/DoctorDashboard.jsx`)
**Section: Today's Appointments**
- Enhanced with status badges
- **Actions Available:**
  - 🔄 **Reschedule** - Change date/time (pending/confirmed only)
  - ✔️ **Complete** - Mark as completed (pending/confirmed only)

**Reschedule Modal:**
- Same design as receptionist modal
- Shows patient name and current appointment date
- `DateTimeInput` for new date selection
- Reason textarea (required)
- Calls: `POST /appointments/:id/reschedule`

**Other Features:**
- Stats cards (Today's Appointments, Waiting Queue, Pending Reviews)
- Recent Completed Appointments section with **Schedule Follow-up** button
- Quick links to Appointments, My Schedule, Waiting Queue

---

### 3. **Patient Dashboard** (`client/src/features/patients/PatientDashboard.jsx`)
**Section: Upcoming Appointments**
- Shows all future appointments
- **Actions Available:**
  - 🔄 **Reschedule** - Self-service reschedule (pending/confirmed only)

**Reschedule Modal:**
- Shows doctor name and current appointment date
- `DateTimeInput` for new date selection
- Reason textarea (required)
- Calls: `POST /appointments/:id/reschedule`

**Other Features:**
- Book new appointment form
- View bills section

---

### 4. **Appointments Page** (`client/src/features/appointments/AppointmentsPage.jsx`)
Full appointments management page for staff (Admin/Receptionist/Doctor)
- List view with search & filters
- Create/edit forms
- Reschedule modal
- Follow-up scheduling modal
- All use `DateTimeInput` component

---

### 5. **Waiting Queue Page** (`client/src/features/queue/WaitingQueuePage.jsx`)
- Schedule appointment from queue
- Uses `DateTimeInput` component

---

## Reusable Components

### `DateTimeInput` (`client/src/components/DateTimeInput.jsx`)
- Side-by-side date and time inputs
- Both widget-selectable AND manually writable
- Emits combined "YYYY-MM-DDTHH:mm" format
- Used consistently across all date/time entry points

---

## Backend API Support

### Reschedule Endpoint
**Route:** `POST /appointments/:id/reschedule`

**Body:**
```json
{
  "newDate": "2024-12-25T14:30",
  "reason": "Doctor unavailable due to emergency"
}
```

**Process:**
1. Validates new date
2. Creates new appointment with "pending" status
3. Marks old appointment as "canceled" with cancellation reason
4. Links old → new via `rescheduledFrom` and `rescheduledTo` fields
5. Sends email notification to patient

**Authorization:**
- Patient can reschedule their own appointments
- Staff (Admin/Receptionist/Doctor) can reschedule any appointment

---

## Button Visibility Logic

### Status-based Action Visibility
```javascript
// Reschedule button
(appt.status === 'pending' || appt.status === 'confirmed')

// Confirm button (Receptionist only)
appt.status === 'pending'

// Complete button
(appt.status === 'pending' || appt.status === 'confirmed')

// Cancel button
(appt.status === 'pending' || appt.status === 'confirmed')

// Generate Bill button (Receptionist only)
appt.status === 'completed'

// Schedule Follow-up button (Doctor only)
appt.status === 'completed'
```

---

## User Experience Highlights

### Receptionist Today Tab
- Status badges provide quick visual status identification
- Multiple action buttons side-by-side for efficient workflow
- Actions automatically hidden when inappropriate for appointment status
- Instant feedback via toast notifications

### Doctor Dashboard
- Focus on today's appointments with quick complete/reschedule actions
- Separate section for completed appointments with follow-up scheduling
- Streamlined for clinical workflow

### Patient Dashboard
- Self-service reschedule for flexibility
- Clear indication of appointment status
- Simple booking form for new appointments

---

## Common Flows

### 1. Receptionist Rescheduling an Appointment
1. Navigate to **Receptionist Dashboard → Today tab**
2. Find appointment (use doctor/status filters if needed)
3. Click **Reschedule** button (only visible for pending/confirmed)
4. Modal opens with current details
5. Select new date/time using picker or manual typing
6. Enter reason for rescheduling
7. Click **Confirm Reschedule**
8. Old appointment canceled, new appointment created
9. Patient receives email notification

### 2. Doctor Rescheduling from Dashboard
1. View **Today's Appointments** section on Doctor Dashboard
2. Click **Reschedule** on pending/confirmed appointment
3. Choose new date/time in modal
4. Enter reason
5. Submit → Patient notified automatically

### 3. Patient Self-Reschedule
1. Login to Patient Dashboard
2. Find appointment in **Upcoming Appointments**
3. Click **Reschedule** (only for pending/confirmed)
4. Select new date/time
5. Enter reason
6. Submit → Staff notified, new appointment created

---

## Test Credentials (from seed data)

```
Admin:
- Email: admin@hms.local
- Password: Admin@123

Receptionist:
- Email: reception@hms.local
- Password: Pass@123

Doctors:
- Email: dr.alice@hms.local / dr.bob@hms.local
- Password: Pass@123

Patients:
- Email: peter@hms.local / paula@hms.local
- Password: Pass@123
```

---

## Database Models

### Appointment Schema Extensions
```javascript
{
  rescheduledFrom: { type: ObjectId, ref: 'Appointment' },
  rescheduledTo: { type: ObjectId, ref: 'Appointment' },
  cancellationReason: String,
  // ... other fields
}
```

---

## Notes
- All reschedule actions track reason for audit purposes
- Old appointments maintain history (canceled status + reason)
- Email notifications sent automatically via Nodemailer
- SMS notifications ready for integration (placeholder in code)
- Conflict checking built into appointment creation/reschedule
- Doctor availability respected during rescheduling
