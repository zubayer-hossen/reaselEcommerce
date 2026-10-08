import { SiteSetting } from '../models/SiteSetting.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Only fields that are safe to show every visitor. Admin-only settings never go through here.
export const publicSettings = asyncHandler(async (req, res) => {
  const s = await SiteSetting.getMain();
  const now = new Date();
  const a = s.announcement;
  const announcementActive =
    a?.enabled && a.text?.bn && (!a.startAt || a.startAt <= now) && (!a.endAt || a.endAt >= now);

  res.set('Cache-Control', 'public, max-age=60');
  res.json({
    success: true,
    message: 'OK',
    data: {
      siteName: s.siteName,
      about: s.about,
      logo: s.logo,
      favicon: s.favicon,
      contact: s.contact,
      social: s.social,
      currency: s.currency,
      deliveryZones: s.deliveryZones,
      payment: s.payment,
      defaultTheme: s.defaultTheme,
      seo: s.seo,
      maintenance: { enabled: !!s.maintenance?.enabled, message: s.maintenance?.message },
      announcement: announcementActive ? { text: a.text, link: a.link, background: a.background } : null,
    },
  });
});
