import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { STATUS_TONE, PAY_TONE } from '../../constants/orderStatus.js';

export function OrderStatusBadge({ status }) {
  const { t } = useLanguage();
  return <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_TONE[status] || 'bg-surface-2'}`}>{t(`admin.orders.status.${status}`)}</span>;
}

export function PayStatusBadge({ status }) {
  const { t } = useLanguage();
  return <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${PAY_TONE[status] || 'bg-surface-2'}`}>{t(`admin.orders.payStatus.${status}`)}</span>;
}
