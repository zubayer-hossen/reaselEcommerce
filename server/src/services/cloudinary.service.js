import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

export const UPLOAD_FOLDERS = ['categories', 'products', 'banners', 'ads', 'reviews', 'content', 'misc'];
const ALLOWED_FORMATS = 'jpg,jpeg,png,webp,avif';
export const ROOT_FOLDER = 'shajghor';

const isConfigured = () => env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret;

// Cloudinary signature: sha1 of "k=v&k=v" (params sorted by key) + api_secret
const sign = (params) => {
  const str = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join('&');
  return crypto.createHash('sha1').update(str + env.cloudinary.apiSecret).digest('hex');
};

// The API secret never leaves the server — the browser only gets a short-lived signature.
export function createUploadSignature(folder) {
  if (!isConfigured()) throw new ApiError(503, 'Image upload is not configured (set CLOUDINARY_* in server/.env)');
  const timestamp = Math.floor(Date.now() / 1000);
  const fullFolder = `${ROOT_FOLDER}/${folder}`;
  const signature = sign({ allowed_formats: ALLOWED_FORMATS, folder: fullFolder, timestamp });
  return {
    cloudName: env.cloudinary.cloudName,
    apiKey: env.cloudinary.apiKey,
    timestamp,
    signature,
    folder: fullFolder,
    allowedFormats: ALLOWED_FORMATS,
  };
}

// Best-effort delete: never throws (an orphaned image is better than a failed save).
export async function destroyImage(publicId) {
  try {
    if (!isConfigured() || !publicId?.startsWith(`${ROOT_FOLDER}/`)) return;
    const timestamp = Math.floor(Date.now() / 1000);
    const body = new URLSearchParams({
      public_id: publicId,
      timestamp: String(timestamp),
      api_key: env.cloudinary.apiKey,
      signature: sign({ public_id: publicId, timestamp }),
    });
    await fetch(`https://api.cloudinary.com/v1_1/${env.cloudinary.cloudName}/image/destroy`, { method: 'POST', body });
  } catch (err) {
    console.error('[cloudinary] destroy failed:', err.message);
  }
}
