import mongoose from 'mongoose'

const PayrollSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  month: { type: String, match: /^\d{4}-\d{2}$/ }, // YYYY-MM
  baseSalary: { type: Number, default: 0 },
  allowances: { type: Number, default: 0 },
  deductions: { type: Number, default: 0 },
  netPay: { type: Number, default: 0 },
  status: { type: String, enum: ['unpaid','paid'], default: 'unpaid' },
  paidAt: Date
}, { timestamps: true })

export default mongoose.model('Payroll', PayrollSchema)
