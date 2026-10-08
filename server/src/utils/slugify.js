import { randomToken } from './tokens.js';

// Unicode-aware: keeps Bangla letters AND their vowel signs (\p{M}), so Bangla slugs work.
export function slugify(input = '') {
  return String(input)
    .normalize('NFC')
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\p{M}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

// First non-empty candidate wins; random fallback if nothing usable.
export function slugFrom(prefix, ...candidates) {
  for (const c of candidates) {
    const s = slugify(c);
    if (s) return s;
  }
  return `${prefix}-${randomToken(3)}`;
}

// Append -2, -3 … until the slug is free. `exists(slug)` is supplied by the caller.
export async function uniqueSlug(base, exists) {
  let slug = base;
  let i = 2;
  while (await exists(slug)) slug = `${base}-${i++}`;
  return slug;
}
