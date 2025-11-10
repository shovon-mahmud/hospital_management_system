import mongoose from 'mongoose'

const LeaveRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  type: { type: String, enum: ['vacation','sick','personal','unpaid','training'], default: 'vacation' },
  reason: String,
  status: { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
  approver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  decidedAt: Date
}, { timestamps: true })

export default mongoose.model('LeaveRequest', LeaveRequestSchema)
