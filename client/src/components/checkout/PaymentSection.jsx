import { useState } from 'react';
import { Banknote, Smartphone, Landmark, Wallet, Copy, Check, ShieldAlert } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { localized } from '../../utils/format.js';
import Input from '../ui/Input.jsx';

const ICONS = { cod: Banknote, bkash: Smartphone, nagad: Smartphone, bank: Landmark, other: Wallet };

function CopyValue({ label, value }) {
  const { t } = useLanguage();
  const [done, setDone] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(value); setDone(true); setTimeout(() => setDone(false), 1500); } catch { /* clipboard blocked */ }
  };
  return (
    <div className="flex items-center justify-between gap-3 rounded-control bg-surface-2 px-3 py-2">
      <div className="min-w-0">
        <p className="text-xs text-muted">{label}</p>
        <p className="break-all text-lg font-bold tracking-wide">{value}</p>
      </div>
      <button type="button" onClick={copy} className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-control border border-line bg-surface px-3 text-sm font-medium">
        {done ? <Check size={16} className="text-success" /> : <Copy size={16} />} {done ? t('public.checkout.copied') : t('public.checkout.copy')}
      </button>
    </div>
  );
}

// Method picker + the instructions and input fields for the chosen method.
// `pay` = settings.payment (where the owner receives money). `errors` use server-style keys ('payment.trxId').
export default function PaymentSection({ methods, method, onMethod, pay, values, onValue, errors }) {
  const { t, lang } = useLanguage();
  const set = (k) => (e) => onValue(k, e.target.value);
  const err = (k) => errors[`payment.${k}`];
  const typeLabel = (x) => t(`public.checkout.accountType.${x || 'personal'}`);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label={t('public.checkout.payment')}>
        {methods.map((m) => {
          const Icon = ICONS[m];
          return (
            <label key={m} className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-control border px-3 ${method === m ? 'border-primary bg-primary/5' : 'border-line'}`}>
              <input type="radio" name="method" value={m} checked={method === m} onChange={() => onMethod(m)} className="size-5 accent-[rgb(var(--primary))]" />
              <Icon size={20} className="text-accent" />
              <span className="font-medium">{t(`public.checkout.methods.${m}`)}</span>
            </label>
          );
        })}
      </div>

      {method === 'cod' && <p className="rounded-control bg-surface-2 px-3 py-3 text-muted">{t('public.checkout.codText')}</p>}

      {(method === 'bkash' || method === 'nagad') && (
        <div className="flex flex-col gap-4">
          <p className="text-muted">{t('public.checkout.sendTo')} <strong className="text-ink">({typeLabel(pay[method]?.accountType)})</strong></p>
          <CopyValue label={t(`public.checkout.methods.${method}`)} value={pay[method]?.number} />
          <Input label={t('public.checkout.senderPhone')} inputMode="tel" autoComplete="tel" value={values.senderPhone} error={err('senderPhone')} onChange={set('senderPhone')} />
          <Input label={t('public.checkout.trxId')} autoCapitalize="characters" value={values.trxId} error={err('trxId')} onChange={set('trxId')} />
          <Input label={t('public.checkout.amount')} type="number" inputMode="numeric" min="150" value={values.amount} onChange={set('amount')} hint={lang === 'bn' ? 'অগ্রিম ঠিক ১৫০ টাকা লিখুন' : 'Enter exactly Tk 150 as the advance'} error={err('amount')} />
        </div>
      )}

      {method === 'bank' && (
        <div className="flex flex-col gap-4">
          <dl className="divide-y divide-line rounded-control border border-line text-sm">
            {[[t('public.checkout.bankName'), pay.bank?.bankName], [t('public.checkout.accountName'), pay.bank?.accountName], [t('public.checkout.accountNumber'), pay.bank?.accountNumber], [t('public.checkout.branch'), pay.bank?.branch]]
              .filter(([, v]) => v).map(([k, v]) => <div key={k} className="flex justify-between gap-4 px-3 py-2.5"><dt className="text-muted">{k}</dt><dd className="break-all text-end font-semibold">{v}</dd></div>)}
          </dl>
          <Input label={t('public.checkout.yourBank')} value={values.bankName} error={err('bankName')} onChange={set('bankName')} />
          <Input label={t('public.checkout.reference')} value={values.reference} error={err('reference')} onChange={set('reference')} />
          <div className="grid grid-cols-2 gap-3">
            <Input label={t('public.checkout.amount')} type="number" inputMode="numeric" min="1" value={values.amount} error={err('amount')} onChange={set('amount')} />
            <Input label={t('public.checkout.paymentDate')} type="date" value={values.paymentDate} error={err('paymentDate')} onChange={set('paymentDate')} />
          </div>
        </div>
      )}

      {method === 'other' && (
        <div className="flex flex-col gap-4">
          <p className="whitespace-pre-line rounded-control bg-surface-2 px-3 py-3">{localized(pay.other?.instructions, lang)}</p>
          <Input label={t('public.checkout.provider')} value={values.provider} error={err('provider')} onChange={set('provider')} />
          <Input label={t('public.checkout.reference')} value={values.reference} error={err('reference')} onChange={set('reference')} />
          <Input label={t('public.checkout.senderPhoneOptional')} inputMode="tel" value={values.senderPhone} error={err('senderPhone')} onChange={set('senderPhone')} />
          <Input label={t('public.checkout.amount')} type="number" inputMode="numeric" min="1" value={values.amount} error={err('amount')} onChange={set('amount')} />
          <Input label={t('public.checkout.paymentNotes')} value={values.notes} onChange={set('notes')} />
        </div>
      )}

      {method !== 'cod' && (
        <p className="flex items-start gap-2 text-sm text-muted"><ShieldAlert size={18} className="mt-0.5 shrink-0 text-warning" /> {t('public.checkout.noPin')}</p>
      )}
    </div>
  );
}
