// Insert Cloudinary transformations (auto format/quality, width) into a delivery URL.
// cld(url, { w: 400 }) → …/upload/f_auto,q_auto,w_400,c_limit/…
export function cld(url, { w, h, crop = 'limit' } = {}) {
  if (!url || !url.includes('/upload/')) return url;
  const t = ['f_auto', 'q_auto', w && `w_${w}`, h && `h_${h}`, (w || h) && `c_${crop}`].filter(Boolean).join(',');
  return url.replace('/upload/', `/upload/${t}/`);
}
