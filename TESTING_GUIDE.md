# Prescription Feature Testing Guide

## Quick Start

### 1. Reset Database with New Seed Data
```bash
cd server
npm run seed
```

This will create 8 sample prescriptions with varied medications and scenarios.

### 2. Login Credentials

**Doctor Account**:
- Email: `dr.nami@hms.bd`
- Password: `Pass@123`

**Patient Account**:
- Email: `chitoge@example.bd`
- Password: `Pass@123`

**Admin Account** (for Settings):
- Email: `admin@hms.bd`
- Password: `Admin@123`

## Testing Scenarios

### Scenario 1: Doctor Creates Prescription

1. Login as Doctor (`dr.nami@hms.bd`)
2. Go to Doctor Dashboard
3. Find an appointment in "Today's Appointments"
4. Click the **"Rx"** button
5. If no existing prescription:
   - Fill out the prescription form
   - Add medications using "Add Medication" button
   - Enter advice and tests
   - Click "Create Prescription"
6. If prescription exists:
   - View existing prescription details
   - Can create another prescription for same appointment

**Expected**: 
- Modal opens with proper dark/light theme
- Form validates required fields
- Success message on creation
- Modal refreshes to show created prescription

### Scenario 2: Patient Views Prescription

1. Login as Patient (`chitoge@example.bd`)
2. Go to Patient Dashboard
3. Scroll to "My Prescriptions" section
4. Click on any prescription in the list
5. View the detailed drawer

**Expected**:
- Drawer opens with full prescription details
- Medications listed with dosage, frequency, duration
- Advice section visible (if provided)
- Recommended tests listed (if any)
- Follow-up information displayed
- "Download PDF" button functional

### Scenario 3: Download Prescription PDF

#### Without Signature:
1. Login as Patient
2. Open prescription detail drawer
3. Click "Download PDF"

**Expected**:
- PDF downloads with prescription details
- QR code visible in top-right corner
- No signature image

#### With Signature:
1. Login as Admin (`admin@hms.bd`)
2. Go to Admin Settings
3. Navigate to "General Settings" tab
4. Paste base64 image in "Doctor Signature" field:
   ```
   data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==
   ```
   (This is a minimal 1x1 red pixel - replace with actual signature)
5. Click "Save Changes"
6. Logout and login as Patient
7. Download prescription PDF again

**Expected**:
- PDF now includes doctor signature image
- Signature positioned below doctor name

### Scenario 4: Multiple Prescriptions per Appointment

1. Login as Doctor
2. Find an appointment that already has a prescription
3. Click "View Rx" on that appointment
4. Close the modal showing existing prescription
5. Click "Rx" button again
6. Create a new prescription (different medications)

**Expected**:
- System allows creating second prescription
- Both prescriptions saved in database
- "View Rx" shows most recent prescription
- Patient can see all prescriptions for that appointment

### Scenario 5: Dark Mode Testing

1. Toggle system theme between light and dark
2. Open prescription modal (as Doctor)
3. Open prescription detail drawer (as Patient)
4. Check all text visibility

**Expected**:
- All text readable in both themes
- Borders visible in both themes
- Inputs properly themed
- No white-on-white or black-on-black text

## API Testing with cURL

### Create Prescription
```bash
# Replace <TOKEN> and <APPOINTMENT_ID>
curl -X POST http://localhost:5000/api/appointments/<APPOINTMENT_ID>/prescription \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "medications": [
      {
        "name": "Aspirin",
        "dosage": "100mg",
        "frequency": "once daily",
        "duration": "30 days",
        "route": "Oral",
        "instructions": "Take in the morning",
        "isPRN": false
      }
    ],
    "advice": "Regular exercise and healthy diet",
    "recommendedTests": ["Lipid Profile", "ECG"],
    "followUpDays": 30
  }'
```

### Get Prescriptions for Appointment
```bash
curl -X GET http://localhost:5000/api/appointments/<APPOINTMENT_ID>/prescription \
  -H "Authorization: Bearer <TOKEN>"
```

### Download PDF
```bash
curl -X GET http://localhost:5000/api/prescriptions/<PRESCRIPTION_ID>/pdf \
  -H "Authorization: Bearer <TOKEN>" \
  --output prescription.pdf
```

## Checking Database Directly

### MongoDB Shell Commands

```javascript
// Connect to MongoDB
mongosh "mongodb://localhost:27017/hms"

// Count prescriptions
db.prescriptions.countDocuments()

// View all prescriptions with patient names
db.prescriptions.aggregate([
  {
    $lookup: {
      from: "patients",
      localField: "patient",
      foreignField: "_id",
      as: "patientData"
    }
  },
  {
    $project: {
      "patientData.user": 1,
      "medications": 1,
      "createdAt": 1
    }
  }
])

// Check if appointment has multiple prescriptions
db.prescriptions.aggregate([
  {
    $group: {
      _id: "$appointment",
      count: { $sum: 1 }
    }
  },
  {
    $match: { count: { $gt: 1 } }
  }
])

// View doctor signature in Settings
db.settings.findOne({}, { general: 1 })
```

## Common Issues and Solutions

### Issue: PDF not generating
**Solution**: Check server logs for errors. Ensure PDFKit and qrcode packages installed.

### Issue: Signature not appearing in PDF
**Solution**: 
1. Verify signature saved in Settings (check MongoDB)
2. Ensure base64 string includes data URI prefix (`data:image/png;base64,`)
3. Check server logs for image decoding errors

### Issue: Can't create second prescription for appointment
**Solution**: 
1. Verify Prescription model doesn't have unique index on appointment
2. Check `prescriptionController.createForAppointment()` removed unique check
3. Re-run seed script to rebuild indexes

### Issue: Prescription modal not themed properly
**Solution**:
1. Check browser dark mode setting
2. Inspect elements for missing `dark:` prefixes
3. Verify TailwindCSS dark mode enabled in config

### Issue: Detail drawer not opening
**Solution**:
1. Check browser console for errors
2. Verify `selectedPrescription` state management
3. Ensure prescription has required fields (medications, patient, doctor)

## Performance Testing

### Load Test: Create 100 Prescriptions
```bash
# Requires authentication token
for i in {1..100}; do
  curl -X POST http://localhost:5000/api/appointments/<APPOINTMENT_ID>/prescription \
    -H "Authorization: Bearer <TOKEN>" \
    -H "Content-Type: application/json" \
    -d '{"medications":[{"name":"Test","dosage":"1mg","frequency":"once","duration":"1 day"}]}'
done
```

### Stress Test: Generate 50 PDFs Concurrently
```bash
# Install GNU parallel first: choco install parallel (Windows) or apt-get install parallel (Linux)
seq 50 | parallel -j 10 "curl -X GET http://localhost:5000/api/prescriptions/<PRESCRIPTION_ID>/pdf \
  -H 'Authorization: Bearer <TOKEN>' --output prescription_{}.pdf"
```

## Swagger API Documentation

Access Swagger docs at: `http://localhost:5000/api-docs`

Search for "Prescriptions" tag to see all prescription endpoints with:
- Request/response schemas
- Example payloads
- Parameter descriptions
- Authentication requirements
- Role-based access details

## Verification Checklist

- [ ] Seed data creates 8 prescriptions
- [ ] Doctor can create prescription from dashboard
- [ ] Doctor can view existing prescriptions
- [ ] Multiple prescriptions per appointment supported
- [ ] Patient can view prescription list
- [ ] Patient detail drawer shows all medication fields
- [ ] PDF downloads successfully
- [ ] QR code in PDF is valid
- [ ] Signature appears in PDF when configured
- [ ] Dark mode works in all prescription UIs
- [ ] API endpoints return correct data
- [ ] Swagger docs accessible and accurate
- [ ] No console errors in browser
- [ ] No server errors in terminal

## Next Steps After Testing

1. **Production Deployment**:
   - Set environment variables for production MongoDB
   - Configure PDF storage (S3, local disk, etc.)
   - Set up SSL for secure PDF downloads
   - Enable CORS for frontend domain

2. **Monitoring**:
   - Track prescription creation rate
   - Monitor PDF generation performance
   - Log failed prescription attempts
   - Alert on unusual activity

3. **User Training**:
   - Create user manual for doctors
   - Demo video for prescription workflow
   - FAQ for common questions
   - Support contact information

---

**Happy Testing! 🧪**
