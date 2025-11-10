import mongoose from 'mongoose';

const AvailabilitySchema = new mongoose.Schema({
  day: { type: String, enum: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] },
  slots: [{ start: String, end: String }]
}, { _id: false });

const DoctorSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  specialization: String,
  experienceYears: Number,
  availability: [AvailabilitySchema],
  // Extended profile
  qualifications: [String],
  languages: [String],
  bio: String,
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  consultationFee: Number,
  // Location details
  buildingName: String,
  buildingNo: String,
  floorNo: String,
  roomNo: String
}, { timestamps: true });

export default mongoose.model('Doctor', DoctorSchema);
