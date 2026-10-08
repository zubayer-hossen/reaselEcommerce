import crypto from 'node:crypto';
import { env } from '../config/env.js';

const secret = () => env.jwt.refreshSecret;

export function createUnsubscribeToken(email) {
  const normalized = String(email).trim().toLowerCase();
  const payload = Buffer.from(normalized).toString('base64url');
  const signature = crypto.createHmac('sha256', secret()).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function verifyUnsubscribeToken(token) {
  if (!token || typeof token !== 'string') return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;
  const expected = crypto.createHmac('sha256', secret()).update(payload).digest('base64url');
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const email = Buffer.from(payload, 'base64url').toString('utf8').trim().toLowerCase();
    return email.includes('@') ? email : null;
  } catch { return null; }
}
