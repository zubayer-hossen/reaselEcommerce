import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import { FAQ } from '../models/FAQ.js';
import { SiteSetting } from '../models/SiteSetting.js';
import { ChatbotKnowledge } from '../models/ChatbotKnowledge.js';
import { ChatUnanswered } from '../models/ChatUnanswered.js';
import { normalizeText, bestKeywordMatch, faqScore, detectOrderNo, intentsOf, productTokens, scrubForLog } from '../utils/chatMatch.js';

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const safeHttps = (u) => (/^https:\/\//i.test(String(u || '').trim()) ? String(u).trim() : '');
const pick = (obj, lang) => (lang === 'en' ? obj?.en || obj?.bn : obj?.bn || obj?.en) || '';
const money = (n, lang) => `৳${Number(n).toLocaleString(lang === 'en' ? 'en-BD' : 'bn-BD')}`;
const num = (n, lang) => Number(n).toLocaleString(lang === 'en' ? 'en-BD' : 'bn-BD');
const digits = (s) => String(s || '').replace(/[^\d]/g, '');

// Everything the bot says by itself lives here. Facts (prices, charges, payment methods…) are NEVER written
// into these strings — they are filled in from the database at answer time, so the bot cannot go out of date.
const T = {
  bn: {
    greet: 'আসসালামু আলাইকুম! আমি স্বয়ংক্রিয় সহকারী। পণ্য, দাম, ডেলিভারি চার্জ, পেমেন্ট বা অর্ডার ট্র্যাকিং নিয়ে জিজ্ঞেস করুন।',
    thanks: 'আপনাকেও ধন্যবাদ! আর কিছু জানার থাকলে বলুন।',
    track: 'অর্ডারের অবস্থা দেখতে অর্ডার আইডি ও ফোন নম্বরের শেষ ৪ অঙ্ক লাগে। গোপনীয়তার জন্য আমি চ্যাটে অর্ডারের তথ্য দেখাই না, নিচের লিংকে ট্র্যাকিং পেজে দেখুন।',
    delivery: 'ডেলিভারি চার্জ',
    payment: 'আমরা এই পদ্ধতিতে পেমেন্ট নিই',
    paymentNote: 'অনলাইনে টাকা পাঠালে কখনো PIN বা OTP কাউকে দেবেন না।',
    contact: 'আমাদের সাথে যোগাযোগ',
    phone: 'ফোন', address: 'ঠিকানা',
    methods: { cod: 'ক্যাশ অন ডেলিভারি', bkash: 'বিকাশ', nagad: 'নগদ', bank: 'ব্যাংক', other: 'অন্যান্য মাধ্যম' },
    found: 'এই পণ্যগুলো পেয়েছি',
    price: 'দাম', sale: 'ছাড়', before: 'আগের দাম', sizes: 'সাইজ', colors: 'রং',
    noSizes: 'এই পণ্যের আলাদা সাইজ তালিকা নেই', noColors: 'এই পণ্যের আলাদা রঙের তালিকা নেই',
    in_stock: 'স্টকে আছে', low_stock: 'স্টক কম আছে', out_of_stock: 'বর্তমানে স্টক শেষ',
    fallback: 'দুঃখিত, এই প্রশ্নের উত্তর আমি নিশ্চিতভাবে দিতে পারছি না।\n\nআমাদের support team-এর সাথে যোগাযোগ করুন।',
    empty: 'কিছু লিখুন, আমি সাহায্য করার চেষ্টা করব।',
  },
  en: {
    greet: 'Hello! I am an automatic assistant. Ask me about products, prices, delivery charges, payment or order tracking.',
    thanks: 'You are welcome! Let me know if you need anything else.',
    track: 'To see an order you need the order ID and the last 4 digits of the phone number. For privacy I do not show order details in chat — please use the tracking page below.',
    delivery: 'Delivery charge',
    payment: 'We accept payment by',
    paymentNote: 'If you pay online, never share your PIN or OTP with anyone.',
    contact: 'Contact us',
    phone: 'Phone', address: 'Address',
    methods: { cod: 'Cash on delivery', bkash: 'bKash', nagad: 'Nagad', bank: 'Bank', other: 'Other methods' },
    found: 'Here is what I found',
    price: 'Price', sale: 'off', before: 'was', sizes: 'Sizes', colors: 'Colors',
    noSizes: 'This product has no separate size list', noColors: 'This product has no separate color list',
    in_stock: 'In stock', low_stock: 'Low stock', out_of_stock: 'Currently out of stock',
    fallback: 'Sorry, I cannot answer this question with certainty.\n\nPlease contact our support team.',
    empty: 'Type something and I will try to help.',
  },
};

// Buttons shown under a reply. The client turns `key` into a translated label.
function contactActions(c = {}) {
  const out = [];
  const phone = String(c.phone || '').replace(/[^\d+]/g, '');
  const wa = digits(c.whatsapp);
  const ms = safeHttps(c.messengerUrl);
  if (phone) out.push({ key: 'call', href: `tel:${phone}` });
  if (wa) out.push({ key: 'whatsapp', href: `https://wa.me/${wa}` });
  if (ms) out.push({ key: 'messenger', href: ms });
  return out;
}

async function logUnanswered(message) {
  try {
    const sample = scrubForLog(message);
    const key = normalizeText(sample).slice(0, 120);
    if (key.length < 2) return;
    await ChatUnanswered.updateOne({ key }, { $setOnInsert: { sample }, $inc: { count: 1 }, $set: { lastAt: new Date() } }, { upsert: true });
  } catch (err) { console.error('[chatbot] log failed:', err.message); }
}

function productCard(p) {
  return { slug: p.slug, name: p.name, price: p.price, regularPrice: p.regularPrice, image: p.images?.[0]?.url, stockStatus: p.stockStatus };
}

function productDetail(p, want, lang, s) {
  const all = !want.price && !want.size && !want.color && !want.stock;
  const lines = [pick(p.name, lang)];
  if (all || want.price) {
    let l = `${s.price}: ${money(p.price, lang)}`;
    if (p.discountPercent > 0) l += ` (${num(p.discountPercent, lang)}% ${s.sale}, ${s.before} ${money(p.regularPrice, lang)})`;
    lines.push(l);
  }
  if (all || want.size) lines.push(p.sizes?.length ? `${s.sizes}: ${p.sizes.join(', ')}` : s.noSizes);
  if (all || want.color) lines.push(p.colors?.length ? `${s.colors}: ${p.colors.join(', ')}` : s.noColors);
  if (all || want.stock) lines.push(s[p.stockStatus]);
  return lines.join('\n');
}

async function findProducts(norm) {
  const tokens = productTokens(norm).slice(0, 5);
  if (!tokens.length) return [];
  const rxs = tokens.map((t) => new RegExp(esc(t), 'i'));
  const cats = await Category.find({ status: 'active', $or: rxs.flatMap((rx) => [{ 'name.bn': rx }, { 'name.en': rx }]) }).select('_id name');
  const products = await Product.find({
    status: 'active',
    $or: [...rxs.flatMap((rx) => [{ 'name.bn': rx }, { 'name.en': rx }, { tags: rx }, { brand: rx }, { sku: rx }]), ...(cats.length ? [{ category: { $in: cats.map((c) => c._id) } }] : [])],
  }).select('name slug images regularPrice salePrice stock variants lowStockThreshold sizes colors tags brand category soldCount').limit(40);

  const catIds = new Set(cats.map((c) => String(c._id)));
  const scored = products.map((p) => {
    const hay = normalizeText(`${p.name.bn || ''} ${p.name.en || ''} ${(p.tags || []).join(' ')} ${p.brand || ''}`);
    const score = tokens.filter((t) => hay.includes(t)).length + (catIds.has(String(p.category)) ? 1 : 0);
    return { p, score };
  }).filter((x) => x.score > 0);
  scored.sort((a, b) => b.score - a.score || (b.p.soldCount || 0) - (a.p.soldCount || 0));
  const top = scored[0]?.score || 0;
  return scored.filter((x) => x.score === top).slice(0, 4).map((x) => x.p);
}

// answer({ message, lang, dry }) → { kind, text, products?, actions? }
// Order: owner-taught answers → order tracking → FAQ → live shop facts (delivery, payment, contact) → products → small talk → honest fallback.
export async function answer({ message, lang = 'bn', dry = false }) {
  const s = T[lang] || T.bn;
  const norm = normalizeText(message);
  if (!norm) return { kind: 'empty', text: s.empty };

  const settings = await SiteSetting.getMain();
  const intents = intentsOf(norm);

  // 1. what the owner taught the bot
  const knowledge = await ChatbotKnowledge.find({ active: true });
  let best = null; let bestScore = 0;
  for (const k of knowledge) { const sc = bestKeywordMatch(norm, k.keywords); if (sc > bestScore) { best = k; bestScore = sc; } }
  if (best) {
    if (!dry) ChatbotKnowledge.updateOne({ _id: best._id }, { $inc: { hits: 1 } }).catch(() => {});
    return { kind: 'knowledge', text: pick(best.answer, lang) };
  }

  // 2. order tracking (never reads orders: tracking needs the phone digits, which only the tracking page checks)
  const orderNo = detectOrderNo(message);
  if (orderNo || intents.track) {
    return { kind: 'order', text: s.track, actions: [{ key: 'track', href: orderNo ? `/track?order=${encodeURIComponent(orderNo)}` : '/track' }] };
  }

  // 3. FAQ
  const faqs = await FAQ.find({ active: true }).select('question answer');
  let bestFaq = null; let bestRatio = 0;
  for (const f of faqs) {
    const r = Math.max(faqScore(norm, normalizeText(f.question.bn || '')), faqScore(norm, normalizeText(f.question.en || '')));
    if (r > bestRatio) { bestFaq = f; bestRatio = r; }
  }
  if (bestFaq) return { kind: 'faq', text: pick(bestFaq.answer, lang), actions: [{ key: 'faq', href: '/faq' }] };

  // 4. live facts from the shop settings
  if (intents.delivery && !intents.deliveryTime) {
    const zones = settings.deliveryZones || [];
    if (zones.length) return { kind: 'delivery', text: `${s.delivery}:\n${zones.map((z) => `• ${pick(z.name, lang)}: ${money(z.charge, lang)}`).join('\n')}` };
  }
  if (intents.payment) {
    const p = settings.payment || {};
    const methods = [p.codEnabled !== false && 'cod', p.bkash?.number && 'bkash', p.nagad?.number && 'nagad', p.bank?.accountNumber && 'bank', (p.other?.instructions?.bn || p.other?.instructions?.en) && 'other'].filter(Boolean);
    if (methods.length) return { kind: 'payment', text: `${s.payment}: ${methods.map((m) => s.methods[m]).join(', ')}।\n${s.paymentNote}`.replace('।\n', lang === 'en' ? '.\n' : '।\n') };
  }
  if (intents.contact) {
    const c = settings.contact || {};
    const lines = [c.phone && `${s.phone}: ${c.phone}`, pick(c.address, lang) && `${s.address}: ${pick(c.address, lang)}`].filter(Boolean);
    const actions = contactActions(c);
    if (lines.length || actions.length) return { kind: 'contact', text: [s.contact, ...lines].join('\n'), actions: [...actions, { key: 'contactPage', href: '/contact' }] };
  }

  // 5. products (price, sizes, colors, stock — straight from the catalogue)
  const found = await findProducts(norm);
  if (found.length === 1) {
    const p = found[0];
    return { kind: 'product', text: productDetail(p, intents, lang, s), products: [productCard(p)], actions: [{ key: 'viewProduct', href: `/product/${p.slug}` }] };
  }
  if (found.length > 1) return { kind: 'products', text: `${s.found}:`, products: found.map(productCard), actions: [{ key: 'shop', href: '/shop' }] };

  // 6. small talk
  if (intents.thanks) return { kind: 'thanks', text: s.thanks };
  if (intents.greet && norm.split(' ').length <= 4) return { kind: 'greeting', text: s.greet };

  // 7. honest fallback — remember the question so the owner can teach the bot
  if (!dry) logUnanswered(message);
  return { kind: 'fallback', text: s.fallback, actions: [...contactActions(settings.contact), { key: 'ticket', href: '/contact?tab=ticket' }] };
}
