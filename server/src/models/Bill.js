import mongoose from 'mongoose';

const ItemSchema = new mongoose.Schema({
  description: String,
  qty: { type: Number, default: 1 },
  unitPrice: { type: Number, default: 0 },
  total: { type: Number, default: 0 }
}, { _id: false });

const BillSchema = new mongoose.Schema({
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', index: true },
  items: [ItemSchema],
  subtotal: Number,
  tax: Number,
  total: Number,
  status: { type: String, enum: ['unpaid', 'paid', 'refunded'], default: 'unpaid' },
  transactionId: String,
  provider: String
}, { timestamps: true });

export default mongoose.model('Bill', BillSchema);
