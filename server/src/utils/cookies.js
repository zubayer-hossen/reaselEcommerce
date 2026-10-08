
import { env } from '../config/env.js';

export const COOKIE = {
  access: 'sg_at',
  refresh: 'sg_rt',
};

export const ACCESS_MS = env.jwt.accessTtlMin * 60 * 1000;

export const REFRESH_MS =
  env.jwt.refreshTtlDays * 24 * 60 * 60 * 1000;

// Netlify frontend + Render backend are cross-site in production.
// Therefore production auth cookies must use SameSite=None + Secure.
const base = {
  httpOnly: true,
  secure: env.isProd,
  sameSite: env.isProd ? 'none' : 'lax',
};

const accessOpts = {
  ...base,
  path: '/',
};

const refreshOpts = {
  ...base,
  path: '/api/auth',
};

export function setAuthCookies(res, { access, refresh }) {
  res.cookie(COOKIE.access, access, {
    ...accessOpts,
    maxAge: ACCESS_MS,
  });

  res.cookie(COOKIE.refresh, refresh, {
    ...refreshOpts,
    maxAge: REFRESH_MS,
  });
}

export function clearAuthCookies(res) {
  res.clearCookie(COOKIE.access, accessOpts);
  res.clearCookie(COOKIE.refresh, refreshOpts);
}

