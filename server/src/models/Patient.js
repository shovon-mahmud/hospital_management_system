import mongoose from 'mongoose';

const PatientSchema = new mongoose.Schema({
  patientId: { type: String, unique: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // Personal details
  gender: { type: String, enum: ['Male','Female','Other'], default: 'Other' },
  dateOfBirth: { type: Date },
  bloodGroup: { type: String, enum: ['A+','A-','B+','B-','AB+','AB-','O+','O-'] },
  heightCm: { type: Number },
  weightKg: { type: Number },
  contact: {
    phone: String,
    address: String,
    emergencyContact: String
  },
  insurance: {
    provider: String,
    number: String
  },
  medical: {
    history: [String],
    allergies: [String],
    prescriptions: [String]
  },
  notes: { type: String },
  files: [{ key: String, url: String, type: String }]
}, { timestamps: true });

PatientSchema.pre('save', function (next) {
  if (!this.patientId) {
    this.patientId = `P-${Date.now().toString().slice(-8)}`;
  }
  next();
});

export default mongoose.model('Patient', PatientSchema);
