// Visual tone per status (classes use the design tokens, so they follow light/dark themes).
export const STATUS_TONE = {
  pending: 'bg-warning/20 text-warning',
  confirmed: 'bg-info/15 text-info',
  processing: 'bg-info/15 text-info',
  packed: 'bg-info/15 text-info',
  shipped: 'bg-primary/15 text-primary',
  out_for_delivery: 'bg-primary/15 text-primary',
  delivered: 'bg-success/15 text-success',
  cancelled: 'bg-danger/15 text-danger',
  failed: 'bg-danger/15 text-danger',
  returned: 'bg-warning/20 text-warning',
};

export const PAY_TONE = {
  pending: 'bg-surface-2 text-muted',
  submitted: 'bg-info/15 text-info',
  verified: 'bg-success/15 text-success',
  rejected: 'bg-danger/15 text-danger',
  refunded: 'bg-warning/20 text-warning',
};

// List tabs → which order statuses they show.
export const ORDER_GROUPS = {
  all: [],
  pending: ['pending'],
  processing: ['confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery'],
  delivered: ['delivered'],
  cancelled: ['cancelled', 'failed'],
  returns: ['returned'],
};

export const MAIN_FLOW = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered'];
