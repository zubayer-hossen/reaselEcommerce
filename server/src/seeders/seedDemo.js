import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { Coupon } from '../models/Coupon.js';
import { FAQ } from '../models/FAQ.js';

// Sample data so the storefront is not empty during development.
//   npm run seed:demo            → add demo categories + products (skips if demo data already exists)
//   npm run seed:demo -- --clear → remove ONLY the demo data (isDemo: true)
// Demo products have no photos: add real photos from Admin → Products.

const CATEGORIES = [
  { slug: 'abaya', bn: 'আবায়া', en: 'Abaya', icon: '🧕' },
  { slug: 'hijab', bn: 'হিজাব', en: 'Hijab', icon: '🧣' },
  { slug: 'panjabi', bn: 'পাঞ্জাবি', en: 'Panjabi', icon: '👘' },
  { slug: 'shirt', bn: 'শার্ট', en: 'Shirt', icon: '👔' },
  { slug: 'shoes', bn: 'জুতা', en: 'Shoes', icon: '👞' },
  { slug: 'accessories', bn: 'এক্সেসরিজ', en: 'Accessories', icon: '👜' },
];

// colors × sizes → variants. stock is deterministic so the demo is repeatable.
const mk = (colors, sizes, base = 12) => {
  const out = [];
  colors.forEach((color, ci) => (sizes.length ? sizes : ['']).forEach((size, si) => {
    out.push({ color, size: size || undefined, stock: Math.max(0, base - ci * 3 - si * 2) });
  }));
  return out;
};

const PRODUCTS = [
  { cat: 'abaya', bn: 'প্রিমিয়াম আবায়া', en: 'Premium Abaya', price: 3200, sale: 2790, colors: ['কালো', 'নেভি', 'মেরুন'], sizes: ['52', '54', '56'], featured: true, best: true },
  { cat: 'abaya', bn: 'ইস্তাম্বুল আবায়া', en: 'Istanbul Abaya', price: 3900, colors: ['কালো', 'ডার্ক গ্রিন'], sizes: ['52', '54', '56'], featured: true, isNew: true },
  { cat: 'hijab', bn: 'কটন হিজাব', en: 'Cotton Hijab', price: 450, sale: 390, colors: ['কালো', 'অফ হোয়াইট', 'ধূসর'], sizes: [], featured: true, best: true },
  { cat: 'hijab', bn: 'সিল্ক হিজাব', en: 'Silk Hijab', price: 850, colors: ['মেরুন', 'নেভি'], sizes: [], isNew: true },
  { cat: 'panjabi', bn: 'কটন পাঞ্জাবি', en: 'Cotton Panjabi', price: 1850, sale: 1590, colors: ['সাদা', 'নেভি'], sizes: ['M', 'L', 'XL'], featured: true },
  { cat: 'panjabi', bn: 'এমব্রয়ডারি পাঞ্জাবি', en: 'Embroidered Panjabi', price: 2900, colors: ['অফ হোয়াইট', 'কালো'], sizes: ['M', 'L', 'XL'], isNew: true, best: true },
  { cat: 'shirt', bn: 'ক্যাজুয়াল শার্ট', en: 'Casual Shirt', price: 1250, colors: ['আকাশি', 'সাদা'], sizes: ['M', 'L', 'XL'], isNew: true },
  { cat: 'shirt', bn: 'ফরমাল শার্ট', en: 'Formal Shirt', price: 1450, sale: 1290, colors: ['সাদা', 'হালকা নীল'], sizes: ['M', 'L', 'XL'] },
  { cat: 'shoes', bn: 'চামড়ার স্যান্ডেল', en: 'Leather Sandal', price: 1650, colors: ['কালো', 'বাদামি'], sizes: ['40', '41', '42', '43'], featured: true },
  { cat: 'accessories', bn: 'ক্রসবডি ব্যাগ', en: 'Crossbody Bag', price: 1350, colors: [], sizes: [], stock: 20, isNew: true },
];

// Only things that are true by how this site works — add your own delivery/return answers from Admin → FAQ.
const DEMO_FAQS = [
  { question: { bn: 'অর্ডার করতে কি অ্যাকাউন্ট লাগে?', en: 'Do I need an account to order?' }, answer: { bn: 'না। রেজিস্ট্রেশন বা লগইন ছাড়াই শুধু নাম, ফোন নম্বর ও ঠিকানা দিয়ে অর্ডার করা যায়।', en: 'No. You can order with just your name, phone number and address, without registering or logging in.' } },
  { question: { bn: 'আমার অর্ডার এখন কোথায় দেখব?', en: 'How can I see where my order is?' }, answer: { bn: '"অর্ডার ট্র্যাক করুন" পেজে অর্ডার আইডি ও ফোন নম্বরের শেষ ৪ অঙ্ক দিলে অর্ডারের বর্তমান অবস্থা দেখা যাবে।', en: 'Open the "Track order" page and enter your order ID and the last 4 digits of your phone number.' } },
  { question: { bn: 'অর্ডার আইডি কোথায় পাব?', en: 'Where do I find my order ID?' }, answer: { bn: 'অর্ডার সফল হলে স্ক্রিনে অর্ডার আইডি (যেমন SAJ-2026-000125) দেখানো হয়। সেটি সংরক্ষণ করে রাখুন।', en: 'After you order, the order ID (like SAJ-2026-000125) is shown on screen. Please save it.' } },
  { question: { bn: 'পেমেন্ট কীভাবে করব?', en: 'How do I pay?' }, answer: { bn: 'চেকআউটে যে পেমেন্ট পদ্ধতিগুলো দেখানো হয় তার মধ্য থেকে বেছে নিন। অনলাইনে টাকা পাঠালে কখনো PIN বা OTP কাউকে দেবেন না।', en: 'Choose from the payment methods shown at checkout. If you pay online, never share your PIN or OTP with anyone.' } },
];

async function run() {
  if (!(await connectDB())) { console.error('MONGO_URI is required'); process.exit(1); }

  if (process.argv.includes('--clear')) {
    const p = await Product.deleteMany({ isDemo: true });
    const c = await Category.deleteMany({ isDemo: true });
    await Coupon.deleteOne({ code: 'DEMO10' });
    await FAQ.deleteMany({ isDemo: true });
    console.log(`Removed ${p.deletedCount} demo products, ${c.deletedCount} demo categories.`);
  } else if (await Product.exists({ isDemo: true })) {
    console.log('Demo data already exists — nothing to do. (Use -- --clear to remove it.)');
  } else {
    const byslug = {};
    for (const [i, c] of CATEGORIES.entries()) {
      const doc = await Category.findOneAndUpdate(
        { slug: c.slug },
        { $setOnInsert: { slug: c.slug, name: { bn: c.bn, en: c.en }, icon: c.icon, order: i, status: 'active', isDemo: true } },
        { new: true, upsert: true }
      );
      byslug[c.slug] = doc;
    }
    for (const p of PRODUCTS) {
      const variants = p.colors.length ? mk(p.colors, p.sizes) : [];
      await Product.create({
        name: { bn: p.bn, en: p.en },
        slug: p.en.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        shortDescription: { bn: 'নমুনা পণ্য — আসল ছবি ও বিবরণ অ্যাডমিন প্যানেল থেকে যোগ করুন।' },
        category: byslug[p.cat]._id,
        regularPrice: p.price,
        salePrice: p.sale,
        stock: p.stock || 0,
        variants,
        sizes: [...new Set(variants.map((v) => v.size).filter(Boolean))],
        colors: [...new Set(variants.map((v) => v.color).filter(Boolean))],
        tags: ['demo'],
        isFeatured: !!p.featured,
        isNewArrival: !!p.isNew,
        isBestSeller: !!p.best,
        status: 'active',
        isDemo: true,
      });
    }
    await Coupon.updateOne(
      { code: 'DEMO10' },
      { $setOnInsert: { code: 'DEMO10', type: 'percent', value: 10, minOrder: 1000, maxDiscount: 500, isActive: true, description: { bn: 'ডেমো কুপন: ১০% ছাড়', en: 'Demo coupon: 10% off' } } },
      { upsert: true }
    );
    await FAQ.insertMany(DEMO_FAQS.map((f, i) => ({ ...f, order: i, active: true, isDemo: true })));
    console.log(`Created ${PRODUCTS.length} demo products in ${CATEGORIES.length} categories, plus coupon DEMO10 (10% off, min ৳1000, max ৳500).`);
  }
  await mongoose.disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
