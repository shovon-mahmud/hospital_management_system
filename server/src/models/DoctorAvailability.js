import mongoose from 'mongoose';

const TimeSlotSchema = new mongoose.Schema({
  start: { type: String, required: true }, // e.g., "09:00"
  end: { type: String, required: true } // e.g., "17:00"
}, { _id: false });

const BreakSchema = new mongoose.Schema({
  start: { type: String, required: true },
  end: { type: String, required: true },
  reason: String
}, { _id: false });

// Inline day off schema (not used standalone)

const DoctorAvailabilitySchema = new mongoose.Schema({
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
  dayOfWeek: { type: String, enum: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'], required: true },
  workingHours: TimeSlotSchema,
  breaks: [BreakSchema],
  isAvailable: { type: Boolean, default: true },
  effectiveFrom: { type: Date, default: Date.now },
  effectiveTo: { type: Date }
}, { timestamps: true });

DoctorAvailabilitySchema.index({ doctor: 1, dayOfWeek: 1, effectiveFrom: 1 });

const DayOffSchema2 = new mongoose.Schema({
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  reason: String,
  type: { type: String, enum: ['vacation','sick','personal','training'], default: 'personal' }
}, { timestamps: true });

DayOffSchema2.index({ doctor: 1, startDate: 1, endDate: 1 });

export const DoctorAvailability = mongoose.model('DoctorAvailability', DoctorAvailabilitySchema);
export const DayOff = mongoose.model('DayOff', DayOffSchema2);
