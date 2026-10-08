import { Notification } from '../models/Notification.js';

// Never throws — a failed alert must never break an order or a stock update.
export async function notify({ type, permission, title, body, link, dedupeKey }) {
  try {
    if (dedupeKey) {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      if (await Notification.exists({ dedupeKey, createdAt: { $gte: since } })) return;
    }
    await Notification.create({ type, permission, title, body, link, dedupeKey });
  } catch (err) {
    console.error('[notify] failed:', err.message);
  }
}
