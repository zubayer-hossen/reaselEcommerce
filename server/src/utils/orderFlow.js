// Order lifecycle rules (pure functions — no database).
export const MAIN_FLOW = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered'];
export const TERMINAL = ['cancelled', 'failed', 'returned'];

// Forward to any later step (stores sometimes skip steps), plus the exits that make sense at each point:
//   cancel  : before the parcel leaves (pending … packed)
//   failed  : delivery did not work out (packed … out_for_delivery)
//   returned: after it left the shop (shipped … delivered)
// Cancelled / failed / returned are final. No going backwards: add a custom tracking message instead.
export function allowedNext(status) {
  if (TERMINAL.includes(status)) return [];
  const i = MAIN_FLOW.indexOf(status);
  if (i < 0) return [];
  const next = MAIN_FLOW.slice(i + 1);
  const exits = [];
  if (i <= 3) exits.push('cancelled');
  if (i >= 3 && i <= 5) exits.push('failed');
  if (i >= 4) exits.push('returned');
  return [...next, ...exits];
}

// These statuses give the reserved stock back to the shelf.
export const releasesStock = (status) => TERMINAL.includes(status);

export const DEFAULT_MESSAGES = {
  pending: { bn: 'আপনার অর্ডার গ্রহণ করা হয়েছে', en: 'Your order has been received' },
  confirmed: { bn: 'আপনার অর্ডার কনফার্ম করা হয়েছে', en: 'Your order is confirmed' },
  processing: { bn: 'অর্ডারটি প্রস্তুত করা হচ্ছে', en: 'Your order is being prepared' },
  packed: { bn: 'অর্ডারটি প্যাকেজিং করা হয়েছে', en: 'Your order has been packed' },
  shipped: { bn: 'অর্ডারটি কুরিয়ারে পাঠানো হয়েছে', en: 'Your order has been shipped' },
  out_for_delivery: { bn: 'ডেলিভারি ম্যান আপনার ঠিকানার পথে আছে', en: 'Your order is out for delivery' },
  delivered: { bn: 'অর্ডারটি ডেলিভারি সম্পন্ন হয়েছে', en: 'Your order has been delivered' },
  cancelled: { bn: 'অর্ডারটি বাতিল করা হয়েছে', en: 'Your order has been cancelled' },
  failed: { bn: 'ডেলিভারি সম্ভব হয়নি', en: 'Delivery was not successful' },
  returned: { bn: 'অর্ডারটি ফেরত এসেছে', en: 'Your order has been returned' },
};

// How far a (possibly cancelled/failed/returned) order got along the main flow.
// `eventStatuses` = every status the order ever had (hidden tracking messages included), so the
// customer's progress bar stays truthful even when the admin hid some updates.
export function lastMainStatus(status, eventStatuses = []) {
  if (MAIN_FLOW.includes(status)) return status;
  let best = 0;
  for (const s of eventStatuses) best = Math.max(best, MAIN_FLOW.indexOf(s));
  return MAIN_FLOW[best];
}
