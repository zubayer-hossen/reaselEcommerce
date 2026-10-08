import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ShoppingBag, Banknote, Clock, Loader2, CheckCircle2, Users, Package, ClipboardList, RefreshCw, ShieldQuestion, AlertTriangle, TrendingUp, TrendingDown, MessageSquare, LifeBuoy } from 'lucide-react';
import { api } from '../../api/client.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { useCountUp } from '../../hooks/useCountUp.js';
import { formatMoney, formatNumber, localized } from '../../utils/format.js';
import Button from '../../components/ui/Button.jsx';
import BarChart from '../../components/charts/BarChart.jsx';
import HBarList from '../../components/charts/HBarList.jsx';

function StatCard({ icon: Icon, label, value, money = false, tone = 'text-primary', big = false }) {
  const { lang } = useLanguage();
  const shown = useCountUp(value);
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`rounded-card border border-line bg-surface p-4 ${big ? 'col-span-2 md:col-span-1' : ''}`}>
      <Icon size={22} className={tone} />
      <p className={`mt-3 font-bold ${big ? 'text-3xl' : 'text-2xl'}`}>{money ? formatMoney(shown, lang) : formatNumber(shown, lang)}</p>
      <p className="text-sm text-muted">{label}</p>
    </motion.div>
  );
}

const Skeleton = ({ n = 8, h = 'h-28' }) => (
  <div className="grid grid-cols-2 gap-3 md:grid-cols-4" aria-hidden="true">{Array.from({ length: n }).map((_, i) => <div key={i} className={`${h} animate-pulse rounded-card bg-surface-2`} />)}</div>
);

function Delta({ value }) {
  const { t, lang } = useLanguage();
  if (value == null) return null;
  const up = value >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return <span className={`inline-flex items-center gap-1 text-xs font-medium ${up ? 'text-success' : 'text-danger'}`} title={t('admin.dashboard.vsPrev')}><Icon size={14} /> {up ? '+' : ''}{formatNumber(value, lang)}%</span>;
}

function Panel({ title, children }) {
  return <section className="rounded-card border border-line bg-surface p-4"><h3 className="mb-3 font-semibold">{title}</h3>{children}</section>;
}

const RANGES = ['7d', '30d', '90d'];

export default function Dashboard() {
  const { t, lang } = useLanguage();
  const { can } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [range, setRange] = useState('30d');
  const [an, setAn] = useState(null);
  const [anError, setAnError] = useState(false);
  const [metric, setMetric] = useState('revenue');

  const load = useCallback(async () => {
    setError(false); setData(null);
    try { setData((await api.get('/admin/dashboard/summary')).data); } catch { setError(true); }
  }, []);
  const loadAn = useCallback(async () => {
    setAnError(false); setAn(null);
    try { setAn((await api.get('/admin/analytics', { params: { range } })).data); } catch { setAnError(true); }
  }, [range]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadAn(); }, [loadAn]);

  if (error) {
    return (
      <div className="rounded-card border border-line bg-surface p-8 text-center">
        <p className="text-danger">{t('admin.dashboard.error')}</p>
        <Button variant="outline" onClick={load} className="mt-4"><RefreshCw size={18} /> {t('admin.dashboard.retry')}</Button>
      </div>
    );
  }

  const n = (v) => formatNumber(v, lang);
  const money = (v) => formatMoney(v, lang);

  return (
    <div className="flex flex-col gap-6">
      {/* things that need the owner's attention */}
      {data && (data.paymentCheck > 0 || data.lowStock > 0 || data.newMessages > 0 || data.openTickets > 0) && (
        <div className="grid gap-3 md:grid-cols-2">
          {data.paymentCheck > 0 && can('orders:read') && (
            <Link to="/admin/orders?tab=paymentCheck" className="flex min-h-16 items-center gap-3 rounded-card border border-info/40 bg-info/10 p-4">
              <ShieldQuestion className="shrink-0 text-info" size={24} />
              <span className="font-semibold">{n(data.paymentCheck)} {t('admin.dashboard.actionPayment')}</span>
            </Link>
          )}
          {data.openTickets > 0 && can('support:manage') && (
            <Link to="/admin/support?tab=tickets" className="flex min-h-16 items-center gap-3 rounded-card border border-danger/40 bg-danger/10 p-4">
              <LifeBuoy className="shrink-0 text-danger" size={24} />
              <span className="font-semibold">{n(data.openTickets)} {t('admin.dashboard.actionTickets')}</span>
            </Link>
          )}
          {data.newMessages > 0 && can('support:manage') && (
            <Link to="/admin/support?tab=messages" className="flex min-h-16 items-center gap-3 rounded-card border border-primary/40 bg-primary/10 p-4">
              <MessageSquare className="shrink-0 text-primary" size={24} />
              <span className="font-semibold">{n(data.newMessages)} {t('admin.dashboard.actionMessages')}</span>
            </Link>
          )}
          {data.lowStock > 0 && can('products:read') && (
            <Link to="/admin/inventory" className="flex min-h-16 items-center gap-3 rounded-card border border-warning/50 bg-warning/10 p-4">
              <AlertTriangle className="shrink-0 text-warning" size={24} />
              <span className="font-semibold">{n(data.lowStock)} {t('admin.dashboard.actionStock')}</span>
            </Link>
          )}
        </div>
      )}

      {!data ? <Skeleton /> : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard big icon={ShoppingBag} label={t('admin.dashboard.todayOrders')} value={data.todayOrders} />
          <StatCard big icon={Banknote} tone="text-accent" money label={t('admin.dashboard.todaySales')} value={data.todaySales} />
          <StatCard icon={ClipboardList} label={t('admin.dashboard.totalOrders')} value={data.totalOrders} />
          <StatCard icon={Clock} tone="text-warning" label={t('admin.dashboard.pending')} value={data.pending} />
          <StatCard icon={Loader2} tone="text-info" label={t('admin.dashboard.processing')} value={data.processing} />
          <StatCard icon={CheckCircle2} tone="text-success" label={t('admin.dashboard.delivered')} value={data.delivered} />
          <StatCard icon={Users} label={t('admin.dashboard.customers')} value={data.customers} />
          <StatCard icon={Package} label={t('admin.dashboard.products')} value={data.products} />
        </div>
      )}

      {data && data.totalOrders === 0 && (
        <div className="rounded-card border border-dashed border-line p-8 text-center">
          <p className="font-semibold">{t('admin.dashboard.emptyTitle')}</p>
          <p className="mt-1 text-muted">{t('admin.dashboard.emptyText')}</p>
        </div>
      )}

      {/* analytics */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-bold">{t('admin.dashboard.analyticsTitle')}</h2>
        <div className="flex gap-1.5">
          {RANGES.map((r) => (
            <button key={r} onClick={() => setRange(r)} aria-pressed={range === r} className={`min-h-11 rounded-full border px-4 text-sm font-medium ${range === r ? 'border-primary bg-primary text-primary-fg' : 'border-line bg-surface'}`}>{t(`admin.dashboard.range_${r}`)}</button>
          ))}
        </div>
      </div>

      {anError ? (
        <div className="rounded-card border border-line bg-surface p-8 text-center">
          <p className="text-danger">{t('admin.dashboard.analyticsError')}</p>
          <Button variant="outline" onClick={loadAn} className="mt-4"><RefreshCw size={18} /> {t('admin.dashboard.retry')}</Button>
        </div>
      ) : !an ? <Skeleton n={4} h="h-24" /> : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-card border border-line bg-surface p-4"><p className="text-sm text-muted">{t('admin.dashboard.kpiRevenue')}</p><p className="mt-1 text-xl font-bold text-primary">{money(an.kpis.revenue)}</p><Delta value={an.kpis.revenueDelta} /></div>
            <div className="rounded-card border border-line bg-surface p-4"><p className="text-sm text-muted">{t('admin.dashboard.kpiOrders')}</p><p className="mt-1 text-xl font-bold">{n(an.kpis.orders)}</p><Delta value={an.kpis.ordersDelta} /></div>
            <div className="rounded-card border border-line bg-surface p-4"><p className="text-sm text-muted">{t('admin.dashboard.kpiAov')}</p><p className="mt-1 text-xl font-bold">{money(an.kpis.aov)}</p></div>
            <div className="rounded-card border border-line bg-surface p-4"><p className="text-sm text-muted">{t('admin.dashboard.kpiNew')}</p><p className="mt-1 text-xl font-bold">{n(an.kpis.newCustomers)}</p><p className="text-xs text-muted">{n(an.kpis.repeatCustomers)} {t('admin.dashboard.kpiRepeat')}</p></div>
          </div>

          <Panel title={t('admin.dashboard.salesChart')}>
            <div className="mb-3 flex gap-2">
              {['revenue', 'orders'].map((m) => (
                <button key={m} onClick={() => setMetric(m)} aria-pressed={metric === m} className={`min-h-10 rounded-full border px-4 text-sm font-medium ${metric === m ? 'border-primary bg-primary/10 text-primary' : 'border-line'}`}>{t(m === 'revenue' ? 'admin.dashboard.chartRevenue' : 'admin.dashboard.chartOrders')}</button>
              ))}
            </div>
            {an.kpis.orders === 0 ? <p className="py-8 text-center text-muted">{t('admin.dashboard.noData')}</p> : (
              <BarChart
                data={an.series.map((d) => ({ key: d.date, value: metric === 'revenue' ? d.revenue : d.orders }))}
                format={metric === 'revenue' ? money : n}
                label={t(metric === 'revenue' ? 'admin.dashboard.chartRevenue' : 'admin.dashboard.chartOrders')}
              />
            )}
          </Panel>

          <div className="grid gap-4 md:grid-cols-2">
            <Panel title={t('admin.dashboard.topProducts')}>
              <HBarList empty={t('admin.dashboard.noData')} items={an.topProducts.map((p) => ({ key: p.id || p.name, label: p.name, value: p.revenue, text: money(p.revenue), sub: `${n(p.qty)} ${t('admin.dashboard.sold')}` }))} />
            </Panel>
            <Panel title={t('admin.dashboard.topCategories')}>
              <HBarList empty={t('admin.dashboard.noData')} items={an.topCategories.map((c) => ({ key: c.id, label: localized(c.name, lang), value: c.revenue, text: money(c.revenue), sub: `${n(c.qty)} ${t('admin.dashboard.sold')}` }))} />
            </Panel>
            <Panel title={t('admin.dashboard.byPayment')}>
              <HBarList empty={t('admin.dashboard.noData')} items={an.byPayment.map((p) => ({ key: p.method, label: t(`public.checkout.methods.${p.method}`), value: p.n, text: `${n(p.n)} ${t('admin.customers.ordersWord')}`, sub: money(p.revenue) }))} />
            </Panel>
            <Panel title={t('admin.dashboard.byStatus')}>
              <HBarList empty={t('admin.dashboard.noData')} items={an.byStatus.map((s) => ({ key: s.status, label: t(`admin.orders.status.${s.status}`), value: s.n, text: n(s.n) }))} />
            </Panel>
            <Panel title={t('admin.dashboard.byDistrict')}>
              <HBarList empty={t('admin.dashboard.noData')} items={an.districts.map((d) => ({ key: d.district, label: d.district, value: d.n, text: `${n(d.n)} ${t('admin.customers.ordersWord')}`, sub: money(d.revenue) }))} />
            </Panel>
          </div>
          <p className="text-xs text-muted">{t('admin.dashboard.analyticsNote')}</p>
        </>
      )}
    </div>
  );
}
