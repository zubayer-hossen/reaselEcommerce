import { Admin } from '../models/Admin.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { verifyAccess } from '../utils/tokens.js';
import { COOKIE } from '../utils/cookies.js';
import { permissionsFor } from '../config/permissions.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export const requireAuth = asyncHandler(async (req, res, next) => {
  // CSRF defence: cookie-authenticated writes must carry a custom header.
  // Browsers only send it cross-site after a CORS preflight, which our CORS policy rejects.
  if (!SAFE_METHODS.has(req.method) && req.get('x-requested-with') !== 'XMLHttpRequest') {
    throw new ApiError(403, 'Invalid request origin');
  }
  const token = req.cookies?.[COOKIE.access];
  if (!token) throw new ApiError(401, 'Authentication required');

  let payload;
  try {
    payload = verifyAccess(token);
  } catch {
    throw new ApiError(401, 'Session expired');
  }
  const admin = await Admin.findById(payload.sub);
  if (!admin || !admin.isActive) throw new ApiError(401, 'Authentication required');

  req.admin = admin;
  req.permissions = permissionsFor(admin);
  next();
});

// can('orders:update') — use after requireAuth
export const can = (...needed) => (req, res, next) => {
  if (needed.every((p) => req.permissions?.has(p))) return next();
  next(new ApiError(403, 'You do not have permission to do this'));
};

export const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.admin?.role) ? next() : next(new ApiError(403, 'You do not have permission to do this'));

// canAny('a','b') — at least one of the permissions is enough
export const canAny = (...options) => (req, res, next) => {
  if (options.some((p) => req.permissions?.has(p))) return next();
  next(new ApiError(403, 'You do not have permission to do this'));
};
