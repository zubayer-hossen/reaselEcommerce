import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, BarChart3, RefreshCw } from 'lucide-react';
import { api } from '../../api/client.js';
import { useLanguage } from '../../contexts/LanguageContext.jsx';

const empty = { title: { bn: '', en: '' }, body: { bn: '', en: '' }, imageUrl: '', mobileImageUrl: '', link: '', placement: 'home_banner', priority: 0, isActive: true, startsAt: '', endsAt: '' };
const placements = ['home_hero', 'home_banner', 'shop_banner', 'product_banner', 'popup'];

export default function Ads() {
  const { t } = useLanguage();
  const [ads, setAds] = useState([]); const [form, setForm] = useState(empty); const [editing, setEditing] = useState(null); const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('30d'); const [analytics, setAnalytics] = useState(null); const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState('');
  const load = async () => { setLoading(true); try { const r = await api.get('/admin/ads?limit=50'); setAds(r.data?.ads || []); } finally { setLoading(false); } };
  const loadAnalytics = async () => {
    setAnalyticsLoading(true); setAnalyticsError('');
    try {
      const end = new Date();
      const start = new Date(end);
      start.setDate(start.getDate() - (range === '7d' ? 6 : range === '90d' ? 89 : 29));
      const r = await api.get(`/admin/ads/analytics?from=${encodeURIComponent(start.toISOString())}&to=${encodeURIComponent(end.toISOString())}`);
      setAnalytics(r.data || null);
    } catch (error) { setAnalyticsError(error.message || 'Could not load analytics'); }
    finally { setAnalyticsLoading(false); }
  };
  useEffect(() => { load(); }, []);
  useEffect(() => { loadAnalytics(); }, [range]);
  const save = async (e) => { e.preventDefault(); const payload = { ...form, priority: Number(form.priority), startsAt: form.startsAt || null, endsAt: form.endsAt || null }; if (editing) await api.patch(`/admin/ads/${editing}`, payload); else await api.post('/admin/ads', payload); setForm(empty); setEditing(null); load(); };
  const edit = (ad) => setForm({ ...empty, ...ad, title: { ...empty.title, ...ad.title }, body: { ...empty.body, ...ad.body }, startsAt: ad.startsAt ? ad.startsAt.slice(0, 16) : '', endsAt: ad.endsAt ? ad.endsAt.slice(0, 16) : '' }) || setEditing(ad._id);
  const remove = async (id) => { if (window.confirm('Delete this ad?')) { await api.delete(`/admin/ads/${id}`); load(); } };
  return <div className="space-y-6">
    <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold">{t('admin.ads.title')}</h1><p className="text-muted">{t('admin.ads.subtitle')}</p></div><button className="btn-primary inline-flex items-center gap-2" onClick={() => { setEditing(null); setForm(empty); }}><Plus size={18}/> {t('admin.ads.new')}</button></div>
    <form onSubmit={save} className="rounded-card border border-line bg-surface p-5 grid gap-4 md:grid-cols-2">
      <input className="input" placeholder="Title (Bangla)" value={form.title.bn} onChange={e => setForm({...form,title:{...form.title,bn:e.target.value}})} required />
      <input className="input" placeholder="Title (English)" value={form.title.en} onChange={e => setForm({...form,title:{...form.title,en:e.target.value}})} />
      <input className="input" placeholder="Image URL" value={form.imageUrl} onChange={e => setForm({...form,imageUrl:e.target.value})} required={!form.mobileImageUrl} />
      <input className="input" placeholder="Mobile image URL (optional)" value={form.mobileImageUrl} onChange={e => setForm({...form,mobileImageUrl:e.target.value})} />
      <input className="input" placeholder="Link / product path" value={form.link} onChange={e => setForm({...form,link:e.target.value})} />
      <select className="input" value={form.placement} onChange={e => setForm({...form,placement:e.target.value})}>{placements.map(x => <option key={x}>{x}</option>)}</select>
      <input className="input" type="number" min="0" placeholder="Priority" value={form.priority} onChange={e => setForm({...form,priority:e.target.value})} />
      <input className="input" type="datetime-local" value={form.startsAt} onChange={e => setForm({...form,startsAt:e.target.value})} />
      <input className="input" type="datetime-local" value={form.endsAt} onChange={e => setForm({...form,endsAt:e.target.value})} />
      <textarea className="input md:col-span-2" placeholder="Body (Bangla)" value={form.body.bn} onChange={e => setForm({...form,body:{...form.body,bn:e.target.value}})} />
      <div className="md:col-span-2 flex gap-3"><button className="btn-primary" type="submit">{editing ? t('admin.common.save') : t('admin.ads.create')}</button>{editing && <button type="button" className="btn-secondary" onClick={() => {setEditing(null);setForm(empty)}}>{t('admin.common.cancel')}</button>}</div>
    </form>
    <section className="rounded-card border border-line bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="font-semibold">{t('admin.ads.analyticsTitle')}</h2><p className="text-sm text-muted">{t('admin.ads.analyticsSubtitle')}</p></div>
        <div className="flex items-center gap-2">
          {['7d','30d','90d'].map((r) => <button key={r} type="button" onClick={() => setRange(r)} className={`rounded-full border px-3 py-2 text-sm ${range === r ? 'border-primary bg-primary text-primary-fg' : 'border-line'}`}>{t(`admin.ads.range_${r}`)}</button>)}
          <button type="button" onClick={loadAnalytics} className="rounded-full border border-line p-2" title={t('admin.ads.refresh')}><RefreshCw size={17} className={analyticsLoading ? 'animate-spin' : ''}/></button>
        </div>
      </div>
      {analyticsError ? <p className="mt-4 text-sm text-danger">{analyticsError}</p> : analytics ? <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-card border border-line p-3"><p className="text-xs text-muted">{t('admin.ads.impressions')}</p><p className="text-xl font-bold">{analytics.summary.impressions}</p></div>
        <div className="rounded-card border border-line p-3"><p className="text-xs text-muted">{t('admin.ads.clicks')}</p><p className="text-xl font-bold">{analytics.summary.clicks}</p></div>
        <div className="rounded-card border border-line p-3"><p className="text-xs text-muted">{t('admin.ads.ctr')}</p><p className="text-xl font-bold">{analytics.summary.ctr}%</p></div>
        <div className="rounded-card border border-line p-3"><p className="text-xs text-muted">{t('admin.ads.trackedAds')}</p><p className="text-xl font-bold">{analytics.ads.length}</p></div>
      </div> : <p className="mt-4 text-sm text-muted">{t('admin.ads.loadingAnalytics')}</p>}
      {analytics?.ads?.length > 0 && <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-line text-muted"><th className="py-2">{t('admin.ads.ad')}</th><th>{t('admin.ads.placement')}</th><th>{t('admin.ads.impressions')}</th><th>{t('admin.ads.clicks')}</th><th>{t('admin.ads.ctr')}</th></tr></thead><tbody>{analytics.ads.map((ad) => <tr key={ad.adId} className="border-b border-line/60"><td className="py-2 font-medium">{ad.title?.bn || ad.title?.en || '—'}</td><td>{ad.placement}</td><td>{ad.impressions}</td><td>{ad.clicks}</td><td>{ad.ctr}%</td></tr>)}</tbody></table></div>}
    </section>
    <div className="grid gap-4">{loading ? <p className="text-muted">Loading…</p> : ads.map(ad => <div key={ad._id} className="rounded-card border border-line bg-surface p-4 flex gap-4 items-center"><img src={ad.imageUrl || ad.mobileImageUrl} className="h-20 w-32 rounded object-cover" alt=""/><div className="min-w-0 flex-1"><h3 className="font-semibold">{ad.title?.bn || ad.title?.en}</h3><p className="text-sm text-muted">{ad.placement} · {ad.impressions} impressions · {ad.clicks} clicks</p></div><button title="Edit" onClick={() => { setEditing(ad._id); edit(ad); }}><Pencil size={18}/></button><button title="Delete" onClick={() => remove(ad._id)}><Trash2 size={18}/></button>{ad.isActive ? <ToggleRight size={22}/> : <ToggleLeft size={22}/>}</div>)}</div>
  </div>;
}
