import mongoose from 'mongoose';

const RoleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, index: true }, // Admin, Doctor, Receptionist, Patient, HR
  permissions: [{ type: String }]
}, { timestamps: true });

export default mongoose.model('Role', RoleSchema);
