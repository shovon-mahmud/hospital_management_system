import mongoose from 'mongoose';

const AppointmentSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
  appointmentDate: { type: Date, required: true, index: true },
  status: { type: String, enum: ['pending', 'confirmed', 'completed', 'canceled', 'rescheduled'], default: 'pending' },
  notes: String,
  bill: { type: mongoose.Schema.Types.ObjectId, ref: 'Bill' },
  // Confirmation tracking
  confirmationSentAt: { type: Date },
  confirmationMethod: { type: String, enum: ['email','sms','both'] },
  confirmedByPatient: { type: Boolean, default: false },
  confirmedAt: { type: Date },
  // Rescheduling
  originalDate: { type: Date },
  rescheduledFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  rescheduledTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  rescheduledReason: String,
  // Follow-up
  isFollowUp: { type: Boolean, default: false },
  parentAppointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  followUpDate: { type: Date },
  followUpReason: String
}, { timestamps: true });

AppointmentSchema.index({ doctor: 1, appointmentDate: 1 });

export default mongoose.model('Appointment', AppointmentSchema);
