# Prescription Feature Documentation

## Overview
Complete prescription management system for the Hospital Management System with PDF generation, QR code verification, signature support, and comprehensive UI integration.

## Features Implemented

### 1. Backend Features

#### Data Model (`server/src/models/Prescription.js`)
- **Prescription Schema** with embedded medications subdocument
- **Indexes**: patient, doctor, appointment (supports multiple prescriptions per appointment)
- **Medications**: name, strength, dosage, frequency, duration, route, instructions, PRN flag
- **Additional Fields**: advice, followUpAfterDays, nextTests (recommended tests), warnings
- **Audit**: createdBy, createdAt, updatedAt

#### API Endpoints (`server/src/routes/index.js`)
All endpoints with comprehensive Swagger/JSDoc documentation:

- `POST /appointments/:id/prescription` - Create prescription (Doctor/Admin)
- `GET /appointments/:id/prescription` - Get all prescriptions for appointment (All roles)
- `GET /prescriptions/mine` - Get user's prescriptions (Patient: as patient, Doctor: as doctor)
- `GET /prescriptions/:id` - Get prescription by ID (All roles)
- `PUT /prescriptions/:id` - Update prescription (Doctor/Admin)
- `DELETE /prescriptions/:id` - Delete prescription (Doctor/Admin)
- `GET /prescriptions/:id/pdf` - Download prescription PDF (All roles)

#### PDF Generation (`server/src/controllers/prescriptionController.js`)
- **PDFKit** integration for professional prescription PDFs
- **QR Code** with verification URL (links to `/prescriptions/:id`)
- **Doctor Signature** support via Settings (base64 image rendering)
- **Complete Details**: Patient info, doctor info, date, medications table, advice, tests, follow-up
- **Professional Styling**: Hospital header, formatted tables, proper margins

#### Settings Integration (`server/src/models/Settings.js`)
- Added `doctorSignature` field to general settings (base64 image)
- Signature automatically included in prescription PDFs when configured

#### Seed Data (`server/src/scripts/seed.js`)
8 sample prescriptions covering various scenarios:
1. Antibiotics + fever medication (Amoxicillin, Paracetamol)
2. Allergy treatment (Cetirizine)
3. Gastric treatment (Omeprazole)
4. Diabetes management (Metformin, Atorvastatin)
5. Asthma inhaler (Salbutamol)
6. Pain + gastric protection (Ibuprofen, Pantoprazole)
7. Antibiotic short course (Azithromycin)
8. Hypertension management (Amlodipine, Losartan)

Each with appropriate advice, recommended tests, and follow-up intervals.

### 2. Frontend Features

#### Doctor Dashboard Integration (`client/src/features/doctors/DoctorDashboard.jsx`)
- **"Rx" Button** on today's appointments
- **"View Rx" Button** on completed appointments
- **Prescription Modal** with dark/light theme support:
  - Shows existing prescription (most recent if multiple)
  - Displays PrescriptionForm for new prescription
  - Proper dark mode: borders, text colors, background panels
  - Loading states and error handling

#### Prescription Form (`client/src/features/prescriptions/PrescriptionForm.jsx`)
- **Dynamic medication entry** (add/remove rows)
- **Complete medication fields**: name, dosage, frequency, duration, route, instructions, PRN flag
- **General fields**: advice, recommended tests (comma-separated), follow-up days
- **Full dark mode support**: all inputs, borders, backgrounds, text colors
- **Validation**: medications array required
- **Auto-refresh**: updates parent component on successful creation

#### Patient Dashboard Integration (`client/src/features/patients/PatientDashboard.jsx`)
- **Prescription List** in "My Prescriptions" section
- **Click-to-view** interaction for detailed prescription view
- **Detail Drawer Modal** with:
  - Medication-by-medication breakdown
  - Dosage, frequency, duration, route display
  - Special instructions and PRN indicators
  - Advice section (styled background)
  - Recommended tests list
  - Follow-up information
  - PDF download button
- **Full dark mode support** with proper text contrast

#### Admin Settings (`client/src/features/admin/AdminSettings.jsx`)
- **Doctor Signature Field** in General Settings tab
- **Base64 image textarea** with helper text
- Saves to Settings model for PDF rendering

### 3. Dark Mode Theme Fixes
All prescription UIs properly themed:
- Text: `text-gray-900 dark:text-white` for headings
- Secondary text: `text-gray-600 dark:text-gray-400`
- Backgrounds: `bg-white dark:bg-gray-800`
- Borders: `border-gray-200 dark:border-gray-700`
- Input fields: `bg-white dark:bg-gray-700 text-gray-900 dark:text-white`
- Proper contrast ratios for accessibility

### 4. Multiple Prescriptions Support
- **Removed unique index** on appointment field in Prescription model
- **Updated controller**: `createForAppointment()` allows multiple prescriptions
- **Array responses**: `getByAppointment()` returns array of prescriptions
- **Frontend handling**: Shows most recent prescription, displays multiple in lists

## API Usage Examples

### Create Prescription
```javascript
POST /appointments/:appointmentId/prescription
Authorization: Bearer <token>
Content-Type: application/json

{
  "medications": [
    {
      "name": "Amoxicillin",
      "dosage": "500mg",
      "frequency": "3 times daily",
      "duration": "7 days",
      "route": "Oral",
      "instructions": "Take after meals",
      "isPRN": false
    }
  ],
  "advice": "Rest and hydrate well",
  "recommendedTests": ["CBC", "Blood Sugar"],
  "followUpDays": 14
}
```

### Get Prescription PDF
```javascript
GET /prescriptions/:id/pdf
Authorization: Bearer <token>

Response: application/pdf (binary)
```

### Get My Prescriptions
```javascript
GET /prescriptions/mine
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "patient": { ... },
      "doctor": { ... },
      "appointment": "...",
      "medications": [...],
      "advice": "...",
      "createdAt": "..."
    }
  ]
}
```

## Configuration

### Doctor Signature Setup
1. Login as Admin
2. Navigate to Settings
3. Go to "General Settings" tab
4. Paste base64-encoded image in "Doctor Signature" field
5. Click "Save Changes"

Image will automatically appear on all prescription PDFs.

### Recommended Image Format
- **Format**: PNG with transparent background
- **Size**: 200x100 pixels recommended
- **Encoding**: Base64 (e.g., `data:image/png;base64,iVBORw0KGgo...`)

## Testing Checklist

### Backend
- [x] Create prescription for appointment
- [x] Create multiple prescriptions for same appointment
- [x] Get prescriptions by appointment ID (returns array)
- [x] Get prescription by ID
- [x] Update prescription
- [x] Delete prescription
- [x] Generate PDF without signature
- [x] Generate PDF with signature from Settings
- [x] QR code verification link works

### Frontend - Doctor
- [x] "Rx" button visible on today's appointments
- [x] "View Rx" button on completed appointments
- [x] Modal opens with proper dark mode styling
- [x] Shows existing prescription when available
- [x] Shows form for new prescription
- [x] Form validates required fields
- [x] Successfully creates prescription
- [x] Modal refreshes after creation

### Frontend - Patient
- [x] Prescription list displays all prescriptions
- [x] Click prescription to view details
- [x] Detail drawer shows all medication fields
- [x] Advice and tests sections display correctly
- [x] PDF download button works
- [x] Dark mode styling proper throughout

### Frontend - Admin
- [x] Signature field visible in Settings
- [x] Can paste base64 image
- [x] Saves to Settings model
- [x] Signature appears in PDFs after configuration

## Security Considerations

- All endpoints require authentication via JWT
- Role-based access control enforced
- Doctors can only create/update/delete prescriptions
- Patients can only view their own prescriptions
- PDF verification URL includes prescription ID for tracking

## Database Indexes

```javascript
prescriptionSchema.index({ patient: 1 });
prescriptionSchema.index({ doctor: 1 });
prescriptionSchema.index({ appointment: 1 }); // Non-unique for multiple prescriptions
```

## File Structure

```
server/
├── src/
│   ├── models/
│   │   ├── Prescription.js         # Prescription data model
│   │   └── Settings.js             # Extended with doctorSignature
│   ├── controllers/
│   │   └── prescriptionController.js  # CRUD + PDF generation
│   ├── routes/
│   │   └── index.js                # API routes with Swagger docs
│   └── scripts/
│       └── seed.js                 # 8 sample prescriptions

client/
└── src/
    └── features/
        ├── prescriptions/
        │   ├── PrescriptionForm.jsx      # Medication entry form
        │   ├── PrescriptionsPage.jsx     # All prescriptions view
        │   └── DoctorPrescriptions.jsx   # Doctor's prescriptions
        ├── doctors/
        │   └── DoctorDashboard.jsx       # Rx modal integration
        ├── patients/
        │   └── PatientDashboard.jsx      # Detail drawer integration
        └── admin/
            └── AdminSettings.jsx         # Signature configuration
```

## Known Limitations

1. **Signature Format**: Only base64 images supported (no file upload UI yet)
2. **PDF Customization**: Fixed layout (no template customization)
3. **Prescription Templates**: No predefined medication templates
4. **Drug Interaction**: No automatic drug interaction checking
5. **Inventory Integration**: No automatic inventory deduction

## Future Enhancements

1. **File upload** for doctor signature (instead of base64 paste)
2. **Prescription templates** for common medications
3. **Drug interaction warnings** via external API
4. **Inventory integration** (deduct medications from stock)
5. **E-signature** with digital certificate support
6. **Multi-language PDFs** (Bengali/English toggle)
7. **SMS/Email** prescription delivery
8. **Prescription history** comparison view
9. **Medication reminders** for patients
10. **Pharmacy integration** for direct medication ordering

## Compliance Notes

This implementation provides basic prescription functionality. For production use in Bangladesh:

1. Verify compliance with Bangladesh Medical & Dental Council (BMDC) guidelines
2. Ensure proper digital signature standards if required
3. Implement audit logging for prescription access
4. Consider data retention policies per regulatory requirements
5. Add appropriate disclaimers and legal notices to PDFs

---

**Version**: 1.0  
**Last Updated**: 2024  
**Maintainer**: HMS Development Team
