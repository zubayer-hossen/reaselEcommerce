import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const sha256 = (v) => crypto.createHash('sha256').update(v).digest('hex');
export const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

export const signAccess = (adminId) =>
  jwt.sign({ sub: String(adminId) }, env.jwt.accessSecret, { expiresIn: `${env.jwt.accessTtlMin}m` });

export const signRefresh = (adminId) =>
  jwt.sign({ sub: String(adminId), jti: randomToken(8) }, env.jwt.refreshSecret, { expiresIn: `${env.jwt.refreshTtlDays}d` });

export const verifyAccess = (token) => jwt.verify(token, env.jwt.accessSecret);
export const verifyRefresh = (token) => jwt.verify(token, env.jwt.refreshSecret);
