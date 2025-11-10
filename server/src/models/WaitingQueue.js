import mongoose from 'mongoose';

const WaitingQueueSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
  requestedDate: { type: Date, required: true },
  flexibleDates: [{ type: Date }],
  priority: { type: String, enum: ['low','medium','high','urgent'], default: 'medium' },
  status: { type: String, enum: ['waiting','scheduled','expired','canceled'], default: 'waiting' },
  notes: String,
  scheduledAppointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  expiresAt: { type: Date },
  notifiedCount: { type: Number, default: 0 },
  lastNotifiedAt: { type: Date }
}, { timestamps: true });

WaitingQueueSchema.index({ doctor: 1, status: 1, priority: -1, createdAt: 1 });
WaitingQueueSchema.index({ patient: 1, status: 1 });

export default mongoose.model('WaitingQueue', WaitingQueueSchema);
