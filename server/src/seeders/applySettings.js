import fs from 'node:fs';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { SiteSetting } from '../models/SiteSetting.js';

// Stop-gap until the admin Settings page (Phase 11): set business details from a JSON file.
//   cp settings.example.json settings.local.json   (edit it — settings.local.json is git-ignored)
//   npm run settings:apply
// Each top-level key you include REPLACES that whole section (e.g. "payment" or "deliveryZones").
const ALLOWED = ['siteName', 'about', 'policies', 'contact', 'social', 'currency', 'deliveryZones', 'payment', 'announcement', 'maintenance', 'seo', 'logo', 'favicon', 'defaultTheme'];

async function run() {
  const file = process.argv[2] || 'settings.local.json';
  if (!fs.existsSync(file)) { console.error(`File not found: ${file}`); process.exit(1); }
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const unknown = Object.keys(data).filter((k) => !ALLOWED.includes(k));
  if (unknown.length) { console.error(`Unknown keys: ${unknown.join(', ')}. Allowed: ${ALLOWED.join(', ')}`); process.exit(1); }
  if (!(await connectDB())) { console.error('MONGO_URI is required'); process.exit(1); }

  await SiteSetting.getMain(); // make sure the document exists
  await SiteSetting.updateOne({ key: 'main' }, { $set: data }, { runValidators: true });
  console.log(`Updated: ${Object.keys(data).join(', ')}`);
  await mongoose.disconnect();
}
run().catch((e) => { console.error(e.message); process.exit(1); });
