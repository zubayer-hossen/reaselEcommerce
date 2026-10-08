import bcrypt from 'bcryptjs';
import { Admin } from '../models/Admin.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sha256, randomToken, signAccess, signRefresh, verifyRefresh } from '../utils/tokens.js';
import { COOKIE, REFRESH_MS, setAuthCookies, clearAuthCookies } from '../utils/cookies.js';
import { logAudit } from '../services/audit.service.js';
import { sendEmail } from '../services/email.service.js';
import { env } from '../config/env.js';
import { permissionsFor } from '../config/permissions.js';

const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;
const MAX_SESSIONS = 10;
const INVALID = 'Invalid email or password';
const DUMMY_HASH = bcrypt.hashSync('timing-protection', 10);

const publicAdmin = (admin) => ({ ...admin.toSafeJSON(), permissions: [...permissionsFor(admin)] });

// Create a new access+refresh pair and store the refresh hash. `admin` must have refreshTokens selected.
async function startSession(admin, req, res) {
  const access = signAccess(admin._id);
  const refresh = signRefresh(admin._id);
  const now = new Date();
  admin.refreshTokens = (admin.refreshTokens || [])
    .filter((s) => s.expiresAt > now)
    .slice(-(MAX_SESSIONS - 1));
  admin.refreshTokens.push({
    tokenHash: sha256(refresh),
    expiresAt: new Date(now.getTime() + REFRESH_MS),
    userAgent: req.get('user-agent')?.slice(0, 200),
    ip: req.ip,
  });
  await admin.save();
  setAuthCookies(res, { access, refresh });
}

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const admin = await Admin.findOne({ email }).select('+passwordHash +refreshTokens');

  if (!admin) {
    await bcrypt.compare(password, DUMMY_HASH); // keep timing similar
    throw new ApiError(401, INVALID);
  }
  if (admin.isLocked()) {
    throw new ApiError(423, 'Too many failed attempts. Try again in 15 minutes.');
  }
  if (!admin.isActive) throw new ApiError(403, 'This account is disabled');

  if (!(await admin.verifyPassword(password))) {
    admin.failedAttempts += 1;
    if (admin.failedAttempts >= MAX_ATTEMPTS) {
      admin.lockUntil = new Date(Date.now() + LOCK_MS);
      admin.failedAttempts = 0;
    }
    await admin.save();
    await logAudit(req, { admin, action: 'auth.login', result: 'failure' });
    throw new ApiError(401, INVALID);
  }

  admin.failedAttempts = 0;
  admin.lockUntil = undefined;
  admin.lastLoginAt = new Date();
  await startSession(admin, req, res);
  await logAudit(req, { admin, action: 'auth.login' });

  res.json({ success: true, message: 'Logged in', data: { admin: publicAdmin(admin) } });
});

// Refresh-token rotation: each refresh token works once. Reuse of an old one ends all sessions.
export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[COOKIE.refresh];
  if (!token) throw new ApiError(401, 'Authentication required');

  let payload;
  try {
    payload = verifyRefresh(token);
  } catch {
    clearAuthCookies(res);
    throw new ApiError(401, 'Session expired');
  }

  const admin = await Admin.findById(payload.sub).select('+refreshTokens');
  if (!admin || !admin.isActive) {
    clearAuthCookies(res);
    throw new ApiError(401, 'Authentication required');
  }

  const hash = sha256(token);
  const known = admin.refreshTokens.some((s) => s.tokenHash === hash);
  if (!known) {
    admin.refreshTokens = []; // possible token theft
    await admin.save();
    clearAuthCookies(res);
    throw new ApiError(401, 'Session expired');
  }

  admin.refreshTokens = admin.refreshTokens.filter((s) => s.tokenHash !== hash);
  await startSession(admin, req, res);
  res.json({ success: true, message: 'Session refreshed', data: { admin: publicAdmin(admin) } });
});

export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.[COOKIE.refresh];
  if (token) {
    try {
      const { sub } = verifyRefresh(token);
      await Admin.updateOne({ _id: sub }, { $pull: { refreshTokens: { tokenHash: sha256(token) } } });
    } catch { /* already invalid — nothing to revoke */ }
  }
  clearAuthCookies(res);
  res.json({ success: true, message: 'Logged out' });
});

export const logoutAll = asyncHandler(async (req, res) => {
  await Admin.updateOne({ _id: req.admin._id }, { $set: { refreshTokens: [] } });
  await logAudit(req, { action: 'auth.logout_all' });
  clearAuthCookies(res);
  res.json({ success: true, message: 'Logged out from all devices' });
});

export const me = (req, res) => {
  res.json({ success: true, message: 'OK', data: { admin: publicAdmin(req.admin) } });
};

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const admin = await Admin.findById(req.admin._id).select('+passwordHash +refreshTokens');
  if (!(await admin.verifyPassword(currentPassword))) throw new ApiError(400, 'Current password is incorrect');

  await admin.setPassword(newPassword);
  admin.refreshTokens = []; // sign out every other device
  await startSession(admin, req, res); // keep this device signed in
  await logAudit(req, { action: 'auth.change_password' });
  res.json({ success: true, message: 'Password changed' });
});

// Always answers the same way so emails cannot be enumerated.
export const forgotPassword = asyncHandler(async (req, res) => {
  const generic = { success: true, message: 'If this email belongs to an admin, a reset link has been sent' };
  const admin = await Admin.findOne({ email: req.body.email, isActive: true });
  if (!admin) return res.json(generic);

  const token = randomToken(32);
  admin.passwordResetHash = sha256(token);
  admin.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000);
  await admin.save();

  const link = `${env.clientUrl}/admin/reset-password?token=${token}`;
  await sendEmail({
    to: admin.email,
    subject: 'Reset your password',
    text: `Open this link to reset your password (valid for 30 minutes):\n${link}`,
  });
  res.json(generic);
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  const admin = await Admin.findOne({
    passwordResetHash: sha256(token),
    passwordResetExpires: { $gt: new Date() },
  }).select('+passwordResetHash +passwordResetExpires +passwordHash +refreshTokens');
  if (!admin) throw new ApiError(400, 'Reset link is invalid or has expired');

  await admin.setPassword(newPassword);
  admin.passwordResetHash = undefined;
  admin.passwordResetExpires = undefined;
  admin.refreshTokens = [];
  admin.failedAttempts = 0;
  admin.lockUntil = undefined;
  await admin.save();
  await logAudit(req, { admin, action: 'auth.reset_password' });
  res.json({ success: true, message: 'Password updated. Please log in.' });
});
