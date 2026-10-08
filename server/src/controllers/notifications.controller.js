import { Notification } from '../models/Notification.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Each admin only sees notifications their permissions allow (the owner sees everything).
const visibleTo = (req) => ({ permission: { $in: [...req.permissions] } });

// GET /api/admin/notifications?limit=30&unreadOnly=true  → { unreadCount, notifications[] }
// The client polls this with limit=1 just to refresh the bell's unread counter.
export const listNotifications = asyncHandler(async (req, res) => {
  const { limit, unreadOnly } = req.query;
  const me = req.admin._id;
  const base = visibleTo(req);
  const unreadFilter = { ...base, readBy: { $ne: me } };
  const [items, unreadCount] = await Promise.all([
    Notification.find(unreadOnly === 'true' ? unreadFilter : base).sort({ createdAt: -1 }).limit(limit).lean(),
    Notification.countDocuments(unreadFilter),
  ]);
  res.json({
    success: true, message: 'OK',
    data: {
      unreadCount,
      notifications: items.map((n) => ({
        _id: n._id, type: n.type, title: n.title, body: n.body, link: n.link, createdAt: n.createdAt,
        read: (n.readBy || []).some((id) => String(id) === String(me)),
      })),
    },
  });
});

// POST /api/admin/notifications/read  { ids: [...] } or { all: true }
export const markRead = asyncHandler(async (req, res) => {
  const { ids, all } = req.body;
  const filter = { ...visibleTo(req), ...(all ? {} : { _id: { $in: ids } }) };
  await Notification.updateMany(filter, { $addToSet: { readBy: req.admin._id } });
  res.json({ success: true, message: 'OK' });
});
