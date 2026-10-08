import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export const ROLES = [
  'owner', 'super_admin', 'admin',
  'order_manager', 'product_manager', 'support_manager', 'marketing_manager', 'content_manager',
];

const sessionSchema = new mongoose.Schema(
  { tokenHash: { type: String, required: true }, expiresAt: Date, userAgent: String, ip: String, createdAt: { type: Date, default: Date.now } },
  { _id: false }
);

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: 'admin' },
    permissions: { type: [String], default: [] }, // extra permissions on top of the role
    isActive: { type: Boolean, default: true },
    lastLoginAt: Date,
    failedAttempts: { type: Number, default: 0 },
    lockUntil: Date,
    refreshTokens: { type: [sessionSchema], default: [], select: false },
    passwordResetHash: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    twoFactor: { enabled: { type: Boolean, default: false }, secret: { type: String, select: false } }, // 2FA-ready
  },
  { timestamps: true }
);

adminSchema.methods.setPassword = async function setPassword(plain) {
  this.passwordHash = await bcrypt.hash(plain, 12);
};
adminSchema.methods.verifyPassword = function verifyPassword(plain) {
  return bcrypt.compare(plain, this.passwordHash);
};
adminSchema.methods.isLocked = function isLocked() {
  return !!this.lockUntil && this.lockUntil > new Date();
};
adminSchema.methods.toSafeJSON = function toSafeJSON() {
  return { id: this._id, name: this.name, email: this.email, role: this.role, permissions: this.permissions, lastLoginAt: this.lastLoginAt };
};

export const Admin = mongoose.model('Admin', adminSchema);
