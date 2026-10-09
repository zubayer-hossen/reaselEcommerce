import { SiteSetting } from '../models/SiteSetting.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logAudit } from '../services/audit.service.js';

export const getSettings = asyncHandler(async (req, res) => {
  const settings = await SiteSetting.getMain();
  res.json({ success: true, message: 'OK', data: { settings } });
});

export const updateSettings = asyncHandler(async (req, res) => {
  const settings = await SiteSetting.getMain();
  const before = Object.keys(req.body);
  Object.assign(settings, req.body);
  await settings.save();
  await logAudit(req, { action: 'settings.update', resource: 'SiteSetting', resourceId: String(settings._id), details: before.join(',') });
  res.json({ success: true, message: 'Settings updated', data: { settings } });
});
