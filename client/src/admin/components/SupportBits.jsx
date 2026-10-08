import { Phone, MessageCircle, Mail } from 'lucide-react';

export const TICKET_TONE = { open: 'bg-danger/15 text-danger', pending: 'bg-warning/20 text-warning', resolved: 'bg-success/15 text-success' };
export const MSG_TONE = { new: 'bg-danger/15 text-danger', read: 'bg-info/15 text-info', replied: 'bg-success/15 text-success', closed: 'bg-surface-2 text-muted' };
export const PRIORITY_TONE = { low: 'bg-surface-2 text-muted', normal: 'bg-info/15 text-info', high: 'bg-warning/20 text-warning', urgent: 'bg-danger/15 text-danger' };

export function Pill({ tone, children }) {
  return <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>{children}</span>;
}

// Call / WhatsApp / email buttons for replying to a customer (customers have no login, so replies go outside the site).
export function ContactButtons({ phone, email, subject }) {
  return (
    <div className="flex flex-wrap gap-2">
      {phone && <a href={`tel:${phone}`} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-control bg-primary px-4 font-medium text-primary-fg"><Phone size={18} /> {phone}</a>}
      {phone && <a href={`https://wa.me/88${phone}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-control border border-line px-4 font-medium"><MessageCircle size={18} /> WhatsApp</a>}
      {email && <a href={`mailto:${email}?subject=${encodeURIComponent(`Re: ${subject || ''}`)}`} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-control border border-line px-4 font-medium"><Mail size={18} /> Email</a>}
    </div>
  );
}
