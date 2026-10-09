import { useEffect, useState } from 'react';
import { Save, Plus, Trash2 } from 'lucide-react';
import { api } from '../../api/client.js';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';

const emptyLocalized = { bn: '', en: '' };
const clone = (v) => JSON.parse(JSON.stringify(v));

export default function Settings() {
  const { t } = useLanguage();
  const toast = useToast();
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/admin/settings').then((r) => setForm(r.data.settings)).catch((e) => toast.error(e.message));
  }, [toast]);

  const setPath = (path, value) => setForm((old) => {
    const next = clone(old);
    let cur = next;
    path.slice(0, -1).forEach((key) => { cur[key] ??= {}; cur = cur[key]; });
    cur[path.at(-1)] = value;
    return next;
  });
  const addZone = () => setForm((old) => ({ ...old, deliveryZones: [...(old.deliveryZones || []), { key: `zone-${Date.now()}`, name: clone(emptyLocalized), charge: 0 }] }));
  const removeZone = (i) => setForm((old) => ({ ...old, deliveryZones: old.deliveryZones.filter((_, idx) => idx !== i) }));
  const save = async () => {
    if (!form) return;
    setBusy(true);
    try {
      // Never send Mongo/Mongoose metadata back to the strict settings validator.
      // The editor only submits fields that the owner can actually change.
      const { _id, key, createdAt, updatedAt, __v, ...editable } = form;
      const payload = { ...editable };
      if (payload.payment?.other && !payload.payment.other.instructions) {
        payload.payment = {
          ...payload.payment,
          other: { instructions: payload.payment.other },
        };
      }
      const r = await api.patch('/admin/settings', payload);
      setForm(r.data.settings);
      toast.success(t('admin.settings.saved'));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (!form) return <div className="h-40 animate-pulse rounded-card bg-surface-2" />;
  const zone = (z, i) => <div key={z.key || i} className="grid gap-3 rounded-card border border-line p-3 sm:grid-cols-5">
    <Input label={t('admin.settings.zoneKey')} value={z.key || ''} onChange={(e) => setPath(['deliveryZones', i, 'key'], e.target.value)} />
    <Input label={t('admin.settings.zoneBn')} value={z.name?.bn || ''} onChange={(e) => setPath(['deliveryZones', i, 'name', 'bn'], e.target.value)} />
    <Input label={t('admin.settings.zoneEn')} value={z.name?.en || ''} onChange={(e) => setPath(['deliveryZones', i, 'name', 'en'], e.target.value)} />
    <Input label={t('admin.settings.charge')} type="number" value="0" readOnly hint={t('admin.settings.freeDeliveryHint')} />
    <div className="flex items-end"><Button variant="ghost" className="text-danger" onClick={() => removeZone(i)}><Trash2 size={16} />{t('admin.settings.remove')}</Button></div>
  </div>;

  return <div className="flex flex-col gap-5 pb-8">
    <div className="flex items-center justify-between gap-3"><div><h1 className="text-xl font-bold">{t('admin.settings.title')}</h1><p className="text-sm text-muted">{t('admin.settings.subtitle')}</p></div><Button onClick={save} disabled={busy}><Save size={17}/>{busy ? t('admin.common.loading') : t('admin.settings.save')}</Button></div>

    <section className="rounded-card border border-line bg-surface p-4"><h2 className="mb-4 font-bold">{t('admin.settings.store')}</h2><div className="grid gap-4 sm:grid-cols-2"><Input label={t('admin.settings.siteBn')} value={form.siteName?.bn || ''} onChange={(e)=>setPath(['siteName','bn'],e.target.value)}/><Input label={t('admin.settings.siteEn')} value={form.siteName?.en || ''} onChange={(e)=>setPath(['siteName','en'],e.target.value)}/><Input label={t('admin.settings.logo')} value={form.logo || ''} onChange={(e)=>setPath(['logo'],e.target.value)}/><Input label={t('admin.settings.favicon')} value={form.favicon || ''} onChange={(e)=>setPath(['favicon'],e.target.value)}/><Input label={t('admin.settings.currency')} value={form.currency || ''} onChange={(e)=>setPath(['currency'],e.target.value)}/><label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={form.defaultTheme==='dark'} onChange={(e)=>setPath(['defaultTheme'],e.target.checked?'dark':'light')}/>{t('admin.settings.darkTheme')}</label></div></section>

    <section className="rounded-card border border-line bg-surface p-4"><h2 className="mb-2 font-bold">{t('admin.settings.about')}</h2><p className="mb-4 text-sm text-muted">{t('admin.settings.aboutSubtitle')}</p><div className="grid gap-4 sm:grid-cols-2"><label className="block"><span className="mb-1.5 block text-sm font-medium">{t('admin.settings.aboutBn')}</span><textarea rows={8} value={form.about?.bn||''} onChange={(e)=>setPath(['about','bn'],e.target.value)} className="w-full rounded-control border border-line bg-surface px-4 py-3 outline-none focus:border-accent" /></label><label className="block"><span className="mb-1.5 block text-sm font-medium">{t('admin.settings.aboutEn')}</span><textarea rows={8} value={form.about?.en||''} onChange={(e)=>setPath(['about','en'],e.target.value)} className="w-full rounded-control border border-line bg-surface px-4 py-3 outline-none focus:border-accent" /></label></div></section>

    <section className="rounded-card border border-line bg-surface p-4"><h2 className="mb-4 font-bold">{t('admin.settings.contact')}</h2><div className="grid gap-4 sm:grid-cols-2"><Input label={t('admin.settings.phone')} value={form.contact?.phone||''} onChange={(e)=>setPath(['contact','phone'],e.target.value)}/><Input label={t('admin.settings.whatsapp')} value={form.contact?.whatsapp||''} onChange={(e)=>setPath(['contact','whatsapp'],e.target.value)}/><Input label={t('admin.settings.email')} type="email" value={form.contact?.email||''} onChange={(e)=>setPath(['contact','email'],e.target.value)}/><Input label="Facebook URL" value={form.contact?.facebookUrl||''} onChange={(e)=>setPath(['contact','facebookUrl'],e.target.value)}/><Input label="Messenger URL" value={form.contact?.messengerUrl||''} onChange={(e)=>setPath(['contact','messengerUrl'],e.target.value)}/><Input label="Map URL" value={form.contact?.mapUrl||''} onChange={(e)=>setPath(['contact','mapUrl'],e.target.value)}/><Input label={t('admin.settings.addressBn')} value={form.contact?.address?.bn||''} onChange={(e)=>setPath(['contact','address','bn'],e.target.value)}/><Input label={t('admin.settings.addressEn')} value={form.contact?.address?.en||''} onChange={(e)=>setPath(['contact','address','en'],e.target.value)}/></div></section>

    <section className="rounded-card border border-line bg-surface p-4"><div className="mb-4 flex items-center justify-between"><h2 className="font-bold">{t('admin.settings.delivery')}</h2><Button variant="outline" onClick={addZone}><Plus size={16}/>{t('admin.settings.addZone')}</Button></div><div className="flex flex-col gap-3">{(form.deliveryZones||[]).map(zone)}</div></section>

    <section className="rounded-card border border-line bg-surface p-4"><h2 className="mb-2 font-bold">{t('admin.settings.payment')}</h2><p className="mb-4 text-sm text-muted">{t('admin.settings.advancePolicyHint')}</p><div className="grid gap-4 sm:grid-cols-2"><Input label="bKash" value={form.payment?.bkash?.number||''} onChange={(e)=>setPath(['payment','bkash','number'],e.target.value)}/><select value={form.payment?.bkash?.accountType||'personal'} onChange={(e)=>setPath(['payment','bkash','accountType'],e.target.value)} className="min-h-12 rounded-control border border-line bg-surface px-4"><option value="personal">Personal</option><option value="agent">Agent</option><option value="merchant">Merchant</option></select><Input label="Nagad" value={form.payment?.nagad?.number||''} onChange={(e)=>setPath(['payment','nagad','number'],e.target.value)}/><select value={form.payment?.nagad?.accountType||'personal'} onChange={(e)=>setPath(['payment','nagad','accountType'],e.target.value)} className="min-h-12 rounded-control border border-line bg-surface px-4"><option value="personal">Personal</option><option value="agent">Agent</option><option value="merchant">Merchant</option></select><Input label={t('admin.settings.bankName')} value={form.payment?.bank?.bankName||''} onChange={(e)=>setPath(['payment','bank','bankName'],e.target.value)}/><Input label={t('admin.settings.bankAccount')} value={form.payment?.bank?.accountName||''} onChange={(e)=>setPath(['payment','bank','accountName'],e.target.value)}/><Input label={t('admin.settings.accountNumber')} value={form.payment?.bank?.accountNumber||''} onChange={(e)=>setPath(['payment','bank','accountNumber'],e.target.value)}/><Input label={t('admin.settings.branch')} value={form.payment?.bank?.branch||''} onChange={(e)=>setPath(['payment','bank','branch'],e.target.value)}/></div></section>

    <section className="rounded-card border border-line bg-surface p-4"><h2 className="mb-4 font-bold">{t('admin.settings.announcement')}</h2><label className="mb-4 flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={!!form.announcement?.enabled} onChange={(e)=>setPath(['announcement','enabled'],e.target.checked)}/>{t('admin.settings.enabled')}</label><div className="grid gap-4 sm:grid-cols-2"><Input label={t('admin.settings.announcementBn')} value={form.announcement?.text?.bn||''} onChange={(e)=>setPath(['announcement','text','bn'],e.target.value)}/><Input label={t('admin.settings.announcementEn')} value={form.announcement?.text?.en||''} onChange={(e)=>setPath(['announcement','text','en'],e.target.value)}/><Input label={t('admin.settings.announcementLink')} value={form.announcement?.link||''} onChange={(e)=>setPath(['announcement','link'],e.target.value)}/><Input label={t('admin.settings.background')} value={form.announcement?.background||''} placeholder="#000000" onChange={(e)=>setPath(['announcement','background'],e.target.value)}/></div></section>

    <section className="rounded-card border border-line bg-surface p-4"><h2 className="mb-4 font-bold">{t('admin.settings.seoTitle')}</h2><p className="mb-4 text-sm text-muted">{t('admin.settings.seoSubtitle')}</p><div className="grid gap-4"><Input label={t('admin.settings.seoTitleBn')} value={form.seo?.title?.bn||''} onChange={(e)=>setPath(['seo','title','bn'],e.target.value)}/><Input label={t('admin.settings.seoTitleEn')} value={form.seo?.title?.en||''} onChange={(e)=>setPath(['seo','title','en'],e.target.value)}/><label className="block"><span className="mb-1.5 block text-sm font-medium">{t('admin.settings.seoDescriptionBn')}</span><textarea value={form.seo?.description?.bn||''} onChange={(e)=>setPath(['seo','description','bn'],e.target.value)} maxLength={320} rows={3} className="w-full rounded-control border border-line bg-surface px-4 py-3 outline-none focus:border-accent" /></label><label className="block"><span className="mb-1.5 block text-sm font-medium">{t('admin.settings.seoDescriptionEn')}</span><textarea value={form.seo?.description?.en||''} onChange={(e)=>setPath(['seo','description','en'],e.target.value)} maxLength={320} rows={3} className="w-full rounded-control border border-line bg-surface px-4 py-3 outline-none focus:border-accent" /></label><label className="block"><span className="mb-1.5 block text-sm font-medium">{t('admin.settings.seoKeywordsBn')}</span><textarea value={form.seo?.keywords?.bn||''} onChange={(e)=>setPath(['seo','keywords','bn'],e.target.value)} rows={2} className="w-full rounded-control border border-line bg-surface px-4 py-3 outline-none focus:border-accent" /></label><label className="block"><span className="mb-1.5 block text-sm font-medium">{t('admin.settings.seoKeywordsEn')}</span><textarea value={form.seo?.keywords?.en||''} onChange={(e)=>setPath(['seo','keywords','en'],e.target.value)} rows={2} className="w-full rounded-control border border-line bg-surface px-4 py-3 outline-none focus:border-accent" /></label><Input label={t('admin.settings.ogImage')} value={form.seo?.ogImage||''} onChange={(e)=>setPath(['seo','ogImage'],e.target.value)} /></div></section>

    <section className="rounded-card border border-line bg-surface p-4"><h2 className="mb-4 font-bold">{t('admin.settings.policies')}</h2><p className="mb-4 text-sm text-muted">{t('admin.settings.policiesSubtitle')}</p><div className="grid gap-5">{[['privacy','privacy'],['terms','terms'],['returns','returns'],['shipping','shipping'],['payment','payment']].map(([key,label])=><div key={key} className="grid gap-3 rounded-card border border-line p-3 sm:grid-cols-2"><label className="block"><span className="mb-1.5 block text-sm font-medium">{t(`admin.settings.${label}Bn`)}</span><textarea rows={7} value={form.policies?.[key]?.bn||''} onChange={(e)=>setPath(['policies',key,'bn'],e.target.value)} className="w-full rounded-control border border-line bg-surface px-4 py-3 outline-none focus:border-accent" /></label><label className="block"><span className="mb-1.5 block text-sm font-medium">{t(`admin.settings.${label}En`)}</span><textarea rows={7} value={form.policies?.[key]?.en||''} onChange={(e)=>setPath(['policies',key,'en'],e.target.value)} className="w-full rounded-control border border-line bg-surface px-4 py-3 outline-none focus:border-accent" /></label></div>)}</div></section>

    <section className="rounded-card border border-line bg-surface p-4"><h2 className="mb-4 font-bold">{t('admin.settings.operations')}</h2><label className="mb-3 flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={!!form.maintenance?.enabled} onChange={(e)=>setPath(['maintenance','enabled'],e.target.checked)}/>{t('admin.settings.maintenance')}</label><div className="grid gap-4 sm:grid-cols-2"><Input label={t('admin.settings.maintenanceBn')} value={form.maintenance?.message?.bn||''} onChange={(e)=>setPath(['maintenance','message','bn'],e.target.value)}/><Input label={t('admin.settings.maintenanceEn')} value={form.maintenance?.message?.en||''} onChange={(e)=>setPath(['maintenance','message','en'],e.target.value)}/></div></section>

    <div className="flex justify-end"><Button onClick={save} disabled={busy}><Save size={17}/>{busy ? t('admin.common.loading') : t('admin.settings.save')}</Button></div>
  </div>;
}
