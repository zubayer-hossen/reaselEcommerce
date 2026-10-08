import { toAsciiDigits } from './phone.js';

// ---- text helpers (pure; unit-tested) ----
export const normalizeText = (s) =>
  toAsciiDigits(String(s ?? '')).normalize('NFC').toLowerCase().replace(/[^\p{L}\p{M}\p{N}\s-]/gu, ' ').replace(/\s+/g, ' ').trim();

const isAscii = (s) => /^[\x00-\x7f]+$/.test(s);
export const tokensOf = (norm) => norm.split(' ').filter(Boolean);

// Bangla has no spaces inside inflected words (ডেলিভারিতে ⊃ ডেলিভারি), so we match by substring.
// Very short English words ("hi", "pay") must match a whole word, or "hi" would match "this".
export function hasKeyword(norm, tokens, keyword) {
  const kw = normalizeText(keyword);
  if (kw.length < 2) return false;
  if (isAscii(kw) && kw.length <= 3) return tokens.includes(kw);
  return norm.includes(kw);
}

// Owner-taught entries: score = total length of matched keywords (longer = more specific).
export function bestKeywordMatch(norm, keywords) {
  const tokens = tokensOf(norm);
  let score = 0;
  for (const k of keywords) if (hasKeyword(norm, tokens, k)) score += normalizeText(k).length;
  return score;
}

const STOP = new Set([
  'কি', 'কী', 'কেন', 'কিভাবে', 'কীভাবে', 'আমি', 'আমার', 'আমাকে', 'করব', 'করবো', 'করতে', 'হবে', 'হয়', 'এর', 'এই', 'ও', 'না', 'কত', 'কোথায়', 'কখন', 'কবে',
  'আছে', 'আপনাদের', 'আপনারা', 'আপনি', 'জন্য', 'থেকে', 'একটা', 'একটি', 'দেন', 'দিন', 'চাই', 'জানতে', 'বলুন', 'প্লিজ', 'আর', 'কোন', 'কোনো', 'যাবে', 'পাব', 'পাবো',
  'the', 'is', 'a', 'an', 'are', 'do', 'does', 'i', 'my', 'me', 'you', 'your', 'how', 'what', 'when', 'where', 'can', 'to', 'of', 'for', 'in', 'on', 'it', 'this', 'that',
  'have', 'has', 'want', 'need', 'tell', 'about', 'please', 'pls', 'and', 'or', 'there', 'any',
]);

export const contentTokens = (norm) => tokensOf(norm).filter((t) => t.length >= 2 && !STOP.has(t));

// FAQ match: how many of the customer's meaningful words appear in the question?
// At least 2 shared words are required — one common word ("অর্ডার") must never pull in an unrelated answer.
export function faqScore(norm, questionNorm) {
  const words = contentTokens(norm);
  if (words.length < 2) return 0;
  const hit = words.filter((w) => questionNorm.includes(w)).length;
  if (hit < 2) return 0;
  const ratio = hit / words.length;
  return ratio >= 0.5 ? ratio : 0;
}

export const detectOrderNo = (text) => (/\b([A-Za-z0-9]{2,12}-\d{4}-\d{4,8})\b/.exec(String(text)) || [])[1]?.toUpperCase();

// ---- intents ----
export const INTENTS = {
  greet: ['হ্যালো', 'হাই', 'সালাম', 'আসসালামু', 'নমস্কার', 'hello', 'hi', 'hey', 'salam'],
  thanks: ['ধন্যবাদ', 'থ্যাংক', 'শুকরিয়া', 'thanks', 'thank'],
  track: ['ট্র্যাক', 'ট্রাক', 'অর্ডার কোথায়', 'অর্ডারের অবস্থা', 'track', 'order status', 'where is my order'],
  delivery: ['ডেলিভারি', 'ডেলিভারী', 'ডেলিভারি চার্জ', 'শিপিং', 'delivery', 'shipping', 'courier', 'কুরিয়ার'],
  deliveryTime: ['কত দিন', 'কতদিন', 'কবে পাব', 'কবে পাবো', 'কতক্ষণ', 'সময় লাগ', 'how long', 'how many days', 'when will'],
  payment: ['পেমেন্ট', 'বিকাশ', 'নগদ', 'টাকা পাঠ', 'ক্যাশ অন', 'bkash', 'nagad', 'payment', 'cod', 'cash on'],
  contact: ['যোগাযোগ', 'ফোন নম্বর', 'হোয়াটসঅ্যাপ', 'ঠিকানা', 'contact', 'phone number', 'whatsapp', 'address', 'location'],
  price: ['দাম', 'প্রাইস', 'মূল্য', 'price', 'cost', 'how much'],
  size: ['সাইজ', 'মাপ', 'size'],
  color: ['রং', 'রঙ', 'কালার', 'color', 'colour'],
  stock: ['স্টক', 'পাওয়া যাবে', 'available', 'stock'],
};

export function intentsOf(norm) {
  const tokens = tokensOf(norm);
  return Object.fromEntries(Object.entries(INTENTS).map(([k, list]) => [k, list.some((kw) => hasKeyword(norm, tokens, kw))]));
}

// words that describe the question rather than the product ("দাম", "size", …)
const INTENT_WORDS = new Set(Object.values(INTENTS).flat().flatMap((k) => tokensOf(normalizeText(k))));
export const productTokens = (norm) => contentTokens(norm).filter((t) => t.length >= 3 && !INTENT_WORDS.has(t));

// Stored with unanswered questions: long digit runs (phone numbers, order numbers) are removed.
export const scrubForLog = (s) => String(s ?? '').replace(/\d[\d\s-]{5,}\d/g, '•••').slice(0, 200).trim();
