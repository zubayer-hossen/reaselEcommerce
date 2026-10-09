import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { Check, Copy, PackageSearch, MessageCircle } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { useSettings } from '../../contexts/SettingsContext.jsx';
import { useSeo } from '../../hooks/useSeo.js';
import { cld } from '../../utils/cloudinary.js';
import { formatMoney, formatNumber } from '../../utils/format.js';

function loadOrder(state) {
  if (state?.order) return state.order;
  try { return JSON.parse(sessionStorage.getItem('order:last')); } catch { return null; }
}

export default function OrderSuccess() {
  const { t, lang } = useLanguage();
  const { settings, siteName } = useSettings();
  const { state } = useLocation();
  const [order] = useState(() => loadOrder(state));
  const [copied, setCopied] = useState(false);
  const reduce = useReducedMotion();
  useSeo({ title: order ? `${t('public.success.title')} | ${siteName}` : '' });
  useEffect(() => { window.scrollTo({ top: 0 }); }, []);

  if (!order) return <Navigate to="/" replace />;

  const copy = async () => {
    try { await navigator.clipboard.writeText(order.orderNo); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* clipboard blocked */ }
  };
  const wa = String(settings?.contact?.whatsapp || '').replace(/[^\d]/g, '');
  const waLink = wa ? `https://wa.me/${wa}?text=${encodeURIComponent(`${t('public.success.waMessage')} ${order.orderNo}`)}` : null;
  const paid = true;

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <div className="text-center">
        <motion.div
          initial={reduce ? false : { scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 14 }}
          className="mx-auto grid size-20 place-items-center rounded-full bg-success text-white"
        >
          <Check size={40} strokeWidth={3} />
        </motion.div>
        <h1 className="mt-5 font-display text-3xl font-bold">{t('public.success.title')}</h1>
        <p className="mt-2 text-muted">{paid ? t('public.success.nextPaid') : t('public.success.nextCod')}</p>
      </div>

      <section className="mt-6 rounded-card border border-line bg-surface p-5 text-center">
        <p className="text-sm text-muted">{t('public.success.orderId')}</p>
        <p className="mt-1 break-all text-2xl font-bold tracking-wide text-primary">{order.orderNo}</p>
        <button onClick={copy} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-control border border-line px-4 text-sm font-medium">
          {copied ? <Check size={16} className="text-success" /> : <Copy size={16} />} {copied ? t('public.checkout.copied') : t('public.success.copyId')}
        </button>
        <p className="mt-3 text-sm text-muted">{t('public.success.saveNote')}</p>
      </section>

      <section className="mt-5 rounded-card border border-line bg-surface p-5">
        <ul className="divide-y divide-line">
          {order.items.map((i, idx) => (
            <li key={idx} className="flex items-center gap-3 py-2.5">
              <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-control bg-surface-2">{i.image && <img src={cld(i.image, { w: 120, h: 120, crop: 'fill' })} alt="" className="size-full object-cover" />}</span>
              <span className="min-w-0 flex-1">
                <span className="line-clamp-1 font-medium">{i.name}</span>
                <span className="block text-sm text-muted">{[i.color, i.size].filter(Boolean).join(' · ')} × {formatNumber(i.qty, lang)}</span>
              </span>
              <span className="font-semibold">{formatMoney(i.price * i.qty, lang)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 flex flex-col gap-2 border-t border-line pt-3">
          <div className="flex justify-between"><dt className="text-muted">{t('public.cart.subtotal')}</dt><dd>{formatMoney(order.subtotal, lang)}</dd></div>
          {order.discount > 0 && <div className="flex justify-between text-success"><dt>{t('public.cart.discount')}</dt><dd>-{formatMoney(order.discount, lang)}</dd></div>}
          <div className="flex justify-between"><dt className="text-muted">{t('public.cart.deliveryCharge')}</dt><dd>{formatMoney(order.deliveryCharge, lang)}</dd></div>
          <div className="flex justify-between border-t border-line pt-3 text-lg font-bold"><dt>{t('public.cart.total')}</dt><dd className="text-primary">{formatMoney(order.total, lang)}</dd></div>
          <div className="flex justify-between text-sm"><dt className="text-muted">{lang === 'bn' ? 'অগ্রিম জমা (যাচাই সাপেক্ষে)' : 'Advance submitted (pending verification)'}</dt><dd>{formatMoney(order.advanceAmount ?? 150, lang)}</dd></div>
          <div className="flex justify-between text-sm"><dt className="text-muted">{lang === 'bn' ? 'বাকি পরিশোধযোগ্য' : 'Remaining balance'}</dt><dd>{formatMoney(order.balanceDue ?? Math.max(0, order.total - 150), lang)}</dd></div>
          <div className="flex justify-between text-sm"><dt className="text-muted">{t('public.checkout.payment')}</dt><dd>{t(`public.checkout.methods.${order.paymentMethod}`)} · {t(`public.success.pay_${order.paymentStatus}`)}</dd></div>
        </dl>
      </section>

      <div className="mt-6 flex flex-col gap-3">
        <Link to={`/track?order=${encodeURIComponent(order.orderNo)}`} className="inline-flex min-h-14 items-center justify-center gap-2 rounded-control bg-primary font-semibold text-primary-fg"><PackageSearch size={20} /> {t('public.success.track')}</Link>
        {waLink && <a href={waLink} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-control border border-line font-semibold"><MessageCircle size={20} /> {t('public.success.whatsapp')}</a>}
        <Link to="/shop" className="inline-flex min-h-12 items-center justify-center font-medium text-primary">{t('public.cart.continue')}</Link>
      </div>
    </div>
  );
}
