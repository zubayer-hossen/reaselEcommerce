// Numbers/dates follow the active language (বাংলা digits when lang = 'bn').
const locale = (lang) => (lang === 'en' ? 'en-BD' : 'bn-BD');

export const formatNumber = (n, lang) => Number(n || 0).toLocaleString(locale(lang));
export const formatMoney = (n, lang) => `৳${formatNumber(n, lang)}`;
export const formatDateTime = (d, lang) =>
  d ? new Date(d).toLocaleString(locale(lang), { dateStyle: 'medium', timeStyle: 'short' }) : '';

// Pick the text for the current language, falling back to the other one.
export const localized = (obj, lang) => (lang === 'en' ? obj?.en || obj?.bn : obj?.bn || obj?.en) || '';

// Bangla digits (০-৯) → ASCII, so phone numbers typed on a Bangla keyboard are accepted.
export const toAsciiDigits = (s) => String(s ?? '').replace(/[০-৯]/g, (d) => '০১২৩৪৫৬৭৮৯'.indexOf(d));
export const isValidBdPhone = (s) => /^(?:\+?88)?01[3-9]\d{8}$/.test(toAsciiDigits(s).replace(/[\s\-()]/g, ''));

// Admin-entered links are only used when they are real web links (never javascript: or data: URLs).
export const safeUrl = (u) => (/^https?:\/\//i.test(String(u || '').trim()) ? String(u).trim() : '');

// Accepts a Google Maps embed URL, or the whole <iframe ...> snippet pasted from Google; returns a safe src or ''.
export function mapEmbedSrc(input) {
  if (!input) return '';
  const m = /src=["']([^"']+)["']/.exec(input);
  const url = (m ? m[1] : input).trim();
  return /^https:\/\/www\.google\.com\/maps\/embed/.test(url) ? url : '';
}
