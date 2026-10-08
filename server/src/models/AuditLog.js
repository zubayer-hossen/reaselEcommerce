import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', index: true },
    adminName: String,
    action: { type: String, required: true }, // e.g. auth.login, product.update
    resource: String,
    resourceId: String,
    details: String,
    ip: String,
    result: { type: String, enum: ['success', 'failure'], default: 'success' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
auditLogSchema.index({ createdAt: -1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
