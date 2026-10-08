import { Counter } from '../models/Counter.js';
import { env } from '../config/env.js';

// Brand + Year + Serial → SAJ-2026-000125. Serial restarts each year.
export async function generateOrderNo(date = new Date()) {
  const year = date.getFullYear();
  const seq = await Counter.next(`order-${year}`);
  return `${env.orderPrefix}-${year}-${String(seq).padStart(6, '0')}`;
}

// Support tickets: TKT-2026-000001 (serial restarts each year, same idea as orders).
export async function generateTicketNo(date = new Date()) {
  const year = date.getFullYear();
  const seq = await Counter.next(`ticket-${year}`);
  return `TKT-${year}-${String(seq).padStart(6, '0')}`;
}
