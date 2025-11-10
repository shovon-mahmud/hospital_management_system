import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
  isEmailVerified: { type: Boolean, default: false },
  verificationCode: { type: String, select: false },
  verificationCodeExpiry: { type: Date, select: false },
  lastLoginAt: { type: Date },
  refreshTokens: [{ token: String, createdAt: { type: Date, default: Date.now } }]
}, { timestamps: true });

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model('User', UserSchema);
