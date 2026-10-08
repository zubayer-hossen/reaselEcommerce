import { AuditLog } from '../models/AuditLog.js';

// Never throws — an audit failure must not break the user's action.
export async function logAudit(req, { action, resource, resourceId, details, result = 'success', admin }) {
  try {
    const actor = admin || req.admin;
    await AuditLog.create({
      admin: actor?._id, adminName: actor?.name, action, resource, resourceId, details, result, ip: req.ip,
    });
  } catch (err) {
    console.error('[audit] failed:', err.message);
  }
}
