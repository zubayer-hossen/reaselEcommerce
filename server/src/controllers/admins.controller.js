import mongoose from 'mongoose';
import { Admin } from '../models/Admin.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logAudit } from '../services/audit.service.js';

const toJSON = (a) => ({
  id: a._id, name: a.name, email: a.email, role: a.role, permissions: a.permissions,
  isActive: a.isActive, lastLoginAt: a.lastLoginAt, createdAt: a.createdAt,
});

export const listAdmins = asyncHandler(async (req, res) => {
  const admins = await Admin.find().sort({ createdAt: 1 });
  res.json({ success: true, message: 'OK', data: { admins: admins.map(toJSON) } });
});

export const createAdmin = asyncHandler(async (req, res) => {
  const { name, email, password, role, permissions } = req.body;
  if (await Admin.exists({ email })) throw new ApiError(409, 'An admin with this email already exists');

  const admin = new Admin({ name, email, role, permissions });
  await admin.setPassword(password);
  await admin.save();
  await logAudit(req, { action: 'admin.create', resource: 'Admin', resourceId: String(admin._id), details: `${email} (${role})` });
  res.status(201).json({ success: true, message: 'Admin created', data: { admin: toJSON(admin) } });
});

export const updateAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'Invalid ID');

  const admin = await Admin.findById(id).select('+refreshTokens');
  if (!admin) throw new ApiError(404, 'Admin not found');
  if (admin.role === 'owner') throw new ApiError(403, 'The owner account cannot be changed here');

  const { name, role, isActive, permissions } = req.body;
  const accessChanged = (role && role !== admin.role) || isActive === false || permissions;
  if (name !== undefined) admin.name = name;
  if (role !== undefined) admin.role = role;
  if (isActive !== undefined) admin.isActive = isActive;
  if (permissions !== undefined) admin.permissions = permissions;
  if (accessChanged) admin.refreshTokens = []; // force re-login so new rights apply
  await admin.save();

  await logAudit(req, { action: 'admin.update', resource: 'Admin', resourceId: id, details: Object.keys(req.body).join(',') });
  res.json({ success: true, message: 'Admin updated', data: { admin: toJSON(admin) } });
});
