import mongoose from 'mongoose';

const LogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: String, // CREATE_PATIENT, UPDATE_APPOINTMENT, etc
  entity: String, // Patient, Appointment
  entityId: String,
  meta: {},
  ip: String
}, { timestamps: true });

export default mongoose.model('Log', LogSchema);
