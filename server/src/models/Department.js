import mongoose from 'mongoose';

const DepartmentSchema = new mongoose.Schema({
  name: { type: String, unique: true, index: true },
  description: String
}, { timestamps: true });

export default mongoose.model('Department', DepartmentSchema);
