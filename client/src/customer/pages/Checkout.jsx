import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertTriangle, ChevronDown, ShieldCheck } from 'lucide-react';
import { api } from '../../api/client.js';
import { useCart } from '../../contexts/CartContext.jsx';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { useSettings } from '../../contexts/SettingsContext.jsx';
import { useQuote, mergeLines } from '../../hooks/useQuote.js';
import { useSeo } from '../../hooks/useSeo.js';
import { DISTRICTS, DHAKA_DISTRICT } from '../../constants/districts.js';
import { formatMoney, formatNumber, localized, isValidBdPhone, toAsciiDigits } from '../../utils/format.js';
import { cld } from '../../utils/cloudinary.js';
import Input from '../../components/ui/Input.jsx';
import PaymentSection from '../../components/checkout/PaymentSection.jsx';

const emptyPayment = { senderPhone: '', trxId: '', amount: '', bankName: '', reference: '', provider: '', paymentDate: '', notes: '' };
const emptyForm = { name: '', phone: '', email: '', address: '', district: '', area: '', postalCode: '', note: '' };
const selectCls = 'min-h-12 w-full rounded-control border border-line bg-surface px-3 text-base';

export default function Checkout() {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const { settings, loading: settingsLoading, failed, siteName } = useSettings();
  const { items, clear, deliveryArea, setDeliveryArea, couponCode, setCouponCode } = useCart();
  const { quote, loading: quoting, reload } = useQuote({ items, deliveryArea, couponCode });
  useSeo({ title: `${t('public.checkout.title')} | ${siteName}` });

  const [form, setForm] = useState(emptyForm);
  const [method, setMethod] = useState('');
  const [payment, setPayment] = useState(emptyPayment);
  const [consent, setConsent] = useState({ email: false, sms: false });
  const [trap, setTrap] = useState(''); // honeypot
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState(null); // { type, text, action? }
  const [busy, setBusy] = useState(false);
  const placed = useRef(false);
  const formRef = useRef(null);

  const pay = settings?.payment || {};
  const zones = quote?.zones || settings?.deliveryZones || [];

  // only offer methods the owner has set up
  const methods = useMemo(() => [
    pay.codEnabled !== false && 'cod',
    pay.bkash?.number && 'bkash',
    pay.nagad?.number && 'nagad',
    pay.bank?.accountNumber && 'bank',
    (pay.other?.instructions?.bn || pay.other?.instructions?.en) && 'other',
  ].filter(Boolean), [pay]);
  useEffect(() => { if (!method && methods.length) setMethod(methods[0]); }, [methods, method]);

  const lines = mergeLines(items, quote);
  const blocked = lines.some((l) => l.issue);
  const total = quote?.total ?? 0;
  const charge = quote?.deliveryCharge;

  // the money amount the customer reports defaults to the order total
  useEffect(() => { if (quote && method !== 'cod') setPayment((p) => (p.amount === '' || p.amountAuto ? { ...p, amount: String(quote.total), amountAuto: true } : p)); }, [quote?.total, method]); // eslint-disable-line react-hooks/exhaustive-deps

  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setPay = (k, v) => setPayment((p) => ({ ...p, [k]: v, ...(k === 'amount' ? { amountAuto: false } : {}) }));

  // Dhaka → "dhaka" zone, anywhere else → "outside" (only when the owner uses those standard zone keys)
  const onDistrict = (e) => {
    const district = e.target.value;
    setForm((f) => ({ ...f, district }));
    const keys = new Set(zones.map((z) => z.key));
    if (district && keys.has('dhaka') && keys.has('outside')) setDeliveryArea(district === DHAKA_DISTRICT ? 'dhaka' : 'outside');
  };

  function validate() {
    const e = {};
    const req = t('public.checkout.required');
    if (form.name.trim().length < 2) e['customer.name'] = req;
    if (!isValidBdPhone(form.phone)) e['customer.phone'] = t('public.checkout.badPhone');
    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) e['customer.email'] = t('public.checkout.badEmail');
    if (form.address.trim().length < 8) e['customer.address'] = t('public.checkout.shortAddress');
    if (!form.district) e['customer.district'] = req;
    if (form.postalCode.trim() && !/^\d{4}$/.test(toAsciiDigits(form.postalCode.trim()))) e['customer.postalCode'] = t('public.checkout.badPostal');
    if (!deliveryArea) e.deliveryArea = t('public.cart.deliveryChoose');
    if (method === 'bkash' || method === 'nagad') {
      if (!isValidBdPhone(payment.senderPhone)) e['payment.senderPhone'] = t('public.checkout.badPhone');
      if (payment.trxId.trim().length < 4) e['payment.trxId'] = req;
    }
    if (method === 'bank') {
      if (!payment.bankName.trim()) e['payment.bankName'] = req;
      if (!payment.reference.trim()) e['payment.reference'] = req;
    }
    if (method === 'other') {
      if (!payment.provider.trim()) e['payment.provider'] = req;
      if (!payment.reference.trim()) e['payment.reference'] = req;
      if (payment.senderPhone.trim() && !isValidBdPhone(payment.senderPhone)) e['payment.senderPhone'] = t('public.checkout.badPhone');
    }
    return e;
  }

  const focusFirstError = (e) => {
    const first = Object.keys(e)[0];
    requestAnimationFrame(() => {
      const el = formRef.current?.querySelector('[aria-invalid="true"]');
      (el || formRef.current)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el?.focus?.({ preventScroll: true });
    });
    return first;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (busy || !quote) return;
    setBanner(null);
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) { focusFirstError(e); return; }
    if (blocked) { setBanner({ type: 'cart', text: t('public.checkout.errCart') }); return; }

    const pick = (obj, keys) => Object.fromEntries(keys.map((k) => [k, obj[k]]).filter(([, v]) => v !== '' && v != null));
    const payKeys = { cod: [], bkash: ['senderPhone', 'trxId', 'amount'], nagad: ['senderPhone', 'trxId', 'amount'], bank: ['bankName', 'reference', 'amount', 'paymentDate'], other: ['provider', 'reference', 'senderPhone', 'amount', 'notes'] }[method];
    const payload = pick({ ...payment, amount: payment.amount === '' ? '' : Number(payment.amount) }, payKeys);
    if (payload.senderPhone) payload.senderPhone = toAsciiDigits(payload.senderPhone);

    const body = {
      items: items.map((i) => ({ productId: i.productId, variantId: i.variantId || undefined, qty: i.qty })),
      deliveryArea,
      couponCode: couponCode || undefined,
      customer: {
        name: form.name.trim(), phone: toAsciiDigits(form.phone), email: form.email.trim(), address: form.address.trim(),
        district: form.district, area: form.area.trim(), postalCode: toAsciiDigits(form.postalCode.trim()),
      },
      paymentMethod: method,
      payment: method === 'cod' ? undefined : payload,
      note: form.note.trim(),
      marketingConsent: { email: consent.email && !!form.email.trim(), sms: consent.sms },
      expectedTotal: quote.total,
      website: trap,
    };

    setBusy(true);
    try {
      const res = await api.post('/orders', body);
      placed.current = true;
      const order = res.data.order;
      try { sessionStorage.setItem('order:last', JSON.stringify(order)); } catch { /* ignore */ }
      clear();
      navigate('/order-success', { replace: true, state: { order } });
    } catch (err) {
      const d = err.details || {};
      if (err.status === 409 && d.code === 'cart_issues') { setBanner({ type: 'cart', text: t('public.checkout.errCart') }); reload(); }
      else if (err.status === 409 && d.code === 'coupon_error') setBanner({ type: 'coupon', text: t('public.checkout.errCoupon') });
      else if (err.status === 409 && d.code === 'price_changed') { setBanner({ type: 'price', text: `${t('public.checkout.errPrice')} ${formatMoney(d.total, lang)}` }); reload(); }
      else if (err.status === 400 && err.details) {
        setErrors(Object.fromEntries(Object.entries(d).map(([k, v]) => [k, Array.isArray(v) ? v[0] : String(v)])));
        setBanner({ type: 'form', text: t('public.checkout.errForm') });
        focusFirstError(d);
      } else setBanner({ type: 'other', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  if (items.length === 0 && !placed.current) return <Navigate to="/cart" replace />;

  if (settingsLoading) return <div className="mx-auto max-w-6xl px-4 py-10" aria-hidden="true"><div className="h-96 animate-pulse rounded-card bg-surface-2" /></div>;
  if (failed) return <p className="mx-auto max-w-md px-4 py-24 text-center text-muted">{t('public.states.loadError')}</p>;

  const submitLabel = busy ? t('public.checkout.placing') : t('public.checkout.placeOrder');
  const e = errors;

  const Summary = (
    <div className="flex flex-col gap-3">
      <ul className="divide-y divide-line">
        {lines.map((l) => (
          <li key={l.key} className="flex items-center gap-3 py-2.5">
            <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-control bg-surface-2">
              {l.image && <img src={cld(l.image, { w: 120, h: 120, crop: 'fill' })} alt="" className="size-full object-cover" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="line-clamp-1 font-medium">{localized(l.name, lang)}</span>
              <span className="block text-sm text-muted">{[l.color, l.size].filter(Boolean).join(' · ')} × {formatNumber(l.qty, lang)}</span>
            </span>
            <span className="font-semibold">{formatMoney(l.lineTotal, lang)}</span>
          </li>
        ))}
      </ul>
      <dl className="flex flex-col gap-2 border-t border-line pt-3">
        <div className="flex justify-between"><dt className="text-muted">{t('public.cart.subtotal')}</dt><dd>{formatMoney(quote?.subtotal ?? 0, lang)}</dd></div>
        {quote?.discount > 0 && <div className="flex justify-between text-success"><dt>{t('public.cart.discount')} ({quote.coupon.code})</dt><dd>-{formatMoney(quote.discount, lang)}</dd></div>}
        <div className="flex justify-between"><dt className="text-muted">{t('public.cart.deliveryCharge')}</dt><dd>{charge != null ? formatMoney(charge, lang) : '—'}</dd></div>
        <div className="flex justify-between border-t border-line pt-3 text-lg font-bold"><dt>{t('public.cart.total')}</dt><dd className={`text-primary ${quoting ? 'opacity-50' : ''}`}>{formatMoney(total, lang)}</dd></div>
      </dl>
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 pb-32 lg:pb-10">
      <Link to="/cart" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary"><ArrowLeft size={18} /> {t('public.checkout.backToCart')}</Link>
      <h1 className="mt-1 font-display text-3xl font-bold md:text-4xl">{t('public.checkout.title')}</h1>

      {banner && (
        <div role="alert" className="mt-4 flex items-start gap-3 rounded-card border border-danger/40 bg-danger/10 p-4 text-danger">
          <AlertTriangle size={20} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">{banner.text}</p>
            {banner.type === 'cart' && <Link to="/cart" className="mt-1 inline-block font-semibold underline">{t('public.checkout.reviewCart')}</Link>}
            {banner.type === 'coupon' && <button type="button" onClick={() => { setCouponCode(''); setBanner(null); }} className="mt-1 font-semibold underline">{t('public.cart.couponRemove')}</button>}
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_24rem]">
        <form id="checkout-form" ref={formRef} onSubmit={submit} noValidate className="flex flex-col gap-6">
          {/* Customer */}
          <section className="rounded-card border border-line bg-surface p-4 md:p-5">
            <h2 className="mb-4 font-semibold">{t('public.checkout.yourInfo')}</h2>
            <div className="flex flex-col gap-4">
              <Input label={`${t('public.checkout.name')} *`} autoComplete="name" value={form.name} error={e['customer.name']} onChange={setField('name')} />
              <Input label={`${t('public.checkout.phone')} *`} type="tel" inputMode="tel" autoComplete="tel" hint={t('public.checkout.phoneHint')} value={form.phone} error={e['customer.phone']} onChange={setField('phone')} />
              <Input label={t('public.checkout.email')} type="email" inputMode="email" autoComplete="email" hint={t('public.checkout.optional')} value={form.email} error={e['customer.email']} onChange={setField('email')} />
              <div>
                <label htmlFor="co-district" className="mb-1.5 block text-sm font-medium">{t('public.checkout.district')} *</label>
                <select id="co-district" value={form.district} onChange={onDistrict} className={selectCls} aria-invalid={!!e['customer.district']} autoComplete="address-level1">
                  <option value="">{t('public.checkout.districtPick')}</option>
                  {DISTRICTS.map((d) => <option key={d.bn} value={d.bn}>{lang === 'en' ? d.en : d.bn}</option>)}
                </select>
                {e['customer.district'] && <p className="mt-1 text-sm text-danger">{e['customer.district']}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label={t('public.checkout.area')} hint={t('public.checkout.optional')} value={form.area} onChange={setField('area')} />
                <Input label={t('public.checkout.postalCode')} inputMode="numeric" maxLength={4} hint={t('public.checkout.optional')} value={form.postalCode} error={e['customer.postalCode']} onChange={setField('postalCode')} />
              </div>
              <div>
                <label htmlFor="co-address" className="mb-1.5 block text-sm font-medium">{t('public.checkout.address')} *</label>
                <textarea id="co-address" rows={3} value={form.address} onChange={setField('address')} aria-invalid={!!e['customer.address']} autoComplete="street-address"
                  className={`w-full rounded-control border bg-surface p-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 ${e['customer.address'] ? 'border-danger' : 'border-line'}`} />
                <p className="mt-1 text-sm text-muted">{t('public.checkout.addressHint')}</p>
                {e['customer.address'] && <p className="text-sm text-danger">{e['customer.address']}</p>}
              </div>
              <div>
                <label htmlFor="co-zone" className="mb-1.5 block text-sm font-medium">{t('public.cart.delivery')} *</label>
                <select id="co-zone" value={deliveryArea} onChange={(ev) => setDeliveryArea(ev.target.value)} className={selectCls} aria-invalid={!!e.deliveryArea}>
                  <option value="">{t('public.cart.deliveryChoose')}</option>
                  {zones.map((z) => <option key={z.key} value={z.key}>{localized(z.name, lang)} — {formatMoney(z.charge, lang)}</option>)}
                </select>
                {e.deliveryArea && <p className="mt-1 text-sm text-danger">{e.deliveryArea}</p>}
              </div>
              <div>
                <label htmlFor="co-note" className="mb-1.5 block text-sm font-medium">{t('public.checkout.note')}</label>
                <textarea id="co-note" rows={2} maxLength={300} value={form.note} onChange={setField('note')} className="w-full rounded-control border border-line bg-surface p-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </div>
            </div>
          </section>

          {/* Payment */}
          <section className="rounded-card border border-line bg-surface p-4 md:p-5">
            <h2 className="mb-4 font-semibold">{t('public.checkout.payment')}</h2>
            {methods.length === 0 ? (
              <p className="text-muted">{t('public.checkout.noMethods')}</p>
            ) : (
              <PaymentSection methods={methods} method={method} onMethod={(m) => { setMethod(m); setErrors((x) => Object.fromEntries(Object.entries(x).filter(([k]) => !k.startsWith('payment.')))); }}
                pay={pay} values={payment} onValue={setPay} errors={e} />
            )}
          </section>

          {/* Consent + honeypot */}
          <section className="rounded-card border border-line bg-surface p-4 md:p-5">
            <label className={`flex min-h-11 items-start gap-3 ${form.email.trim() ? '' : 'opacity-50'}`}>
              <input type="checkbox" checked={consent.email} disabled={!form.email.trim()} onChange={(ev) => setConsent((c) => ({ ...c, email: ev.target.checked }))} className="mt-1 size-5 accent-[rgb(var(--primary))]" />
              <span>{t('public.checkout.consentEmail')}</span>
            </label>
            <label className="flex min-h-11 items-start gap-3">
              <input type="checkbox" checked={consent.sms} onChange={(ev) => setConsent((c) => ({ ...c, sms: ev.target.checked }))} className="mt-1 size-5 accent-[rgb(var(--primary))]" />
              <span>{t('public.checkout.consentSms')}</span>
            </label>
            <p className="mt-3 flex items-start gap-2 text-sm text-muted"><ShieldCheck size={18} className="mt-0.5 shrink-0 text-accent" /> {t('public.checkout.privacy')}</p>
            <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}>
              <label>Website<input tabIndex={-1} autoComplete="off" value={trap} onChange={(ev) => setTrap(ev.target.value)} /></label>
            </div>
          </section>

          <button type="submit" disabled={busy || !quote || methods.length === 0 || blocked}
            className="hidden min-h-14 items-center justify-center gap-2 rounded-control bg-primary text-base font-semibold text-primary-fg disabled:opacity-50 lg:flex">
            {busy && <Loader2 className="animate-spin" size={20} />} {submitLabel} · {formatMoney(total, lang)}
          </button>
        </form>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          {/* phones: collapsible; desktop: always open */}
          <details className="group rounded-card border border-line bg-surface p-4 lg:hidden">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between font-semibold">
              {t('public.checkout.summary')} <span className="flex items-center gap-2 text-primary">{formatMoney(total, lang)} <ChevronDown size={18} className="transition group-open:rotate-180" /></span>
            </summary>
            <div className="mt-3">{Summary}</div>
          </details>
          <div className="hidden rounded-card border border-line bg-surface p-5 lg:block">
            <h2 className="mb-2 font-semibold">{t('public.checkout.summary')}</h2>
            {Summary}
          </div>
        </aside>
      </div>

      {/* phones: sticky confirm bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-line bg-surface/95 px-4 pt-3 backdrop-blur lg:hidden" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}>
        <div>
          <p className="text-sm text-muted">{t('public.cart.total')}</p>
          <p className={`text-lg font-bold text-primary ${quoting ? 'opacity-50' : ''}`}>{formatMoney(total, lang)}</p>
        </div>
        <button type="submit" form="checkout-form" disabled={busy || !quote || methods.length === 0 || blocked}
          className="ms-auto inline-flex min-h-12 items-center gap-2 rounded-control bg-primary px-6 font-semibold text-primary-fg disabled:opacity-50">
          {busy && <Loader2 className="animate-spin" size={18} />} {submitLabel}
        </button>
      </div>
    </div>
  );
}
