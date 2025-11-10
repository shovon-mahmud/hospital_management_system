import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  type: { type: String },
  title: String,
  message: String,
  read: { type: Boolean, default: false },
  meta: {}
}, { timestamps: true });

export default mongoose.model('Notification', NotificationSchema);
