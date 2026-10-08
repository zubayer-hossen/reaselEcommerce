import 'dotenv/config';
import crypto from 'node:crypto';

const isProd = process.env.NODE_ENV === 'production';

const required = ['MONGO_URI', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'CLIENT_URL'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length && isProd) {
  throw new Error(`Missing required env vars: ${missing.join(', ')}`);
}

// In development a missing secret gets a random one (sessions reset on restart).
const devSecret = (name) => {
  if (process.env[name]) return process.env[name];
  console.warn(`[env] ${name} not set — using a temporary random secret (dev only)`);
  return crypto.randomBytes(48).toString('hex');
};

export const env = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd,
  mongoUri: process.env.MONGO_URI || '',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  orderPrefix: process.env.ORDER_PREFIX || 'SAJ',
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },
  email: {
    provider: process.env.EMAIL_PROVIDER || '',
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT) || 465,
    secure: String(process.env.EMAIL_SECURE || 'true').toLowerCase() === 'true',
    user: process.env.EMAIL_USER || '',
    appPassword: process.env.EMAIL_APP_PASSWORD || '',
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER || '',
    campaignMaxRecipients: Number(process.env.EMAIL_CAMPAIGN_MAX_RECIPIENTS) || 100,
  },
  jwt: {
    accessSecret: devSecret('JWT_ACCESS_SECRET'),
    refreshSecret: devSecret('JWT_REFRESH_SECRET'),
    accessTtlMin: 15,
    refreshTtlDays: 7,
  },
};
