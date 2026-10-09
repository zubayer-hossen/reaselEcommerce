import { HomepageSection } from '../models/HomepageSection.js';
import { SiteSetting } from '../models/SiteSetting.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logAudit } from '../services/audit.service.js';

const DEFAULTS = [
  ['hero', true, 10], ['trust', true, 20], ['track', true, 30], ['categories', true, 40],
  ['featured', true, 50], ['newArrivals', true, 60], ['howItWorks', true, 70], ['faq', true, 80], ['finalCta', true, 90],
];

async function ensureDefaults() {
  const count = await HomepageSection.countDocuments();
  if (!count) await HomepageSection.insertMany(DEFAULTS.map(([key, enabled, sortOrder]) => ({ key, enabled, sortOrder })));
}

export const publicHomepage = asyncHandler(async (req, res) => {
  await ensureDefaults();
  const sections = await HomepageSection.find({ enabled: true }).sort({ sortOrder: 1, _id: 1 }).lean();
  const settings = await SiteSetting.getMain();
  res.set('Cache-Control', 'public, max-age=60');
  res.json({ success: true, data: { sections, hero: { siteName: settings.siteName, logo: settings.logo } } });
});

export const listAdmin = asyncHandler(async (req, res) => {
  await ensureDefaults();
  const sections = await HomepageSection.find().sort({ sortOrder: 1, _id: 1 }).lean();
  res.json({ success: true, data: { sections } });
});

export const update = asyncHandler(async (req, res) => {
  const section = await HomepageSection.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
  if (!section) return res.status(404).json({ success: false, message: 'Homepage section not found' });
  await logAudit(req, 'homepage.section.update', 'HomepageSection', section._id, { key: section.key });
  res.json({ success: true, data: { section } });
});

export const reorder = asyncHandler(async (req, res) => {
  await Promise.all(req.body.items.map(({ id, sortOrder }) => HomepageSection.findByIdAndUpdate(id, { $set: { sortOrder } })));
  await logAudit(req, 'homepage.section.reorder', 'HomepageSection', null, { count: req.body.items.length });
  const sections = await HomepageSection.find().sort({ sortOrder: 1, _id: 1 }).lean();
  res.json({ success: true, data: { sections } });
});
