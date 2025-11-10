import mongoose from 'mongoose'

const EmployeeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  position: String,
  salary: { type: Number, default: 0 },
  joinDate: Date,
  status: { type: String, enum: ['active','inactive'], default: 'active' }
}, { timestamps: true })

export default mongoose.model('Employee', EmployeeSchema)
