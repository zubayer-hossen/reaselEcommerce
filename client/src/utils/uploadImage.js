import { api } from '../api/client.js';

const MAX_INPUT_BYTES = 15 * 1024 * 1024;

// Shrink big phone photos before upload: saves the owner's mobile data and speeds up the site.
export async function compressImage(file, maxSide = 1600, quality = 0.85) {
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file');
  if (file.size > MAX_INPUT_BYTES) throw new Error('Image is too large (max 15 MB)');
  if (file.type === 'image/gif' || typeof createImageBitmap !== 'function') return file;

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
  return blob && blob.size < file.size ? blob : file;
}

// Browser → Cloudinary directly, using a signature from our server.
export async function uploadImage(file, folder) {
  const prepared = await compressImage(file);
  const { data: sig } = await api.post('/admin/uploads/sign', { folder });

  const body = new FormData();
  body.append('file', prepared, prepared.name || 'image.webp');
  body.append('api_key', sig.apiKey);
  body.append('timestamp', sig.timestamp);
  body.append('signature', sig.signature);
  body.append('folder', sig.folder);
  body.append('allowed_formats', sig.allowedFormats);

  // Plain fetch (not `api`): Cloudinary must not receive our cookies or custom headers.
  const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, { method: 'POST', body });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error?.message || 'Upload failed');
  return { url: json.secure_url, publicId: json.public_id };
}
