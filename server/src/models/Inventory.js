import mongoose from 'mongoose';

const InventorySchema = new mongoose.Schema({
  name: { type: String, index: true },
  sku: { type: String, unique: true, index: true },
  type: { type: String, enum: ['medicine', 'equipment', 'consumable'], default: 'medicine' },
  quantity: { type: Number, default: 0 },
  reorderLevel: { type: Number, default: 10 },
  expiryDate: { type: Date },
  vendor: String
}, { timestamps: true });

export default mongoose.model('Inventory', InventorySchema);
