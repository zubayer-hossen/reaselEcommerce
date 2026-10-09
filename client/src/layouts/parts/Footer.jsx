import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MessageCircle } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { useSettings } from '../../contexts/SettingsContext.jsx';
import { useApi } from '../../hooks/useApi.js';
import { api } from '../../api/client.js';
import { localized, safeUrl } from '../../utils/format.js';

const digits = (s) => String(s || '').replace(/[^\d+]/g, '');

export default function Footer() {
  const { t, lang } = useLanguage();
  const { settings, siteName } = useSettings();
  const { data } = useApi(() => api.get('/categories'), []);
  const cats = (data?.categories || []).filter((c) => !c.parent).slice(0, 6);
  const c = settings?.contact || {};
  const social = [
    ['Facebook', c.facebookUrl], ['Instagram', settings?.social?.instagram],
    ['YouTube', settings?.social?.youtube], ['TikTok', settings?.social?.tiktok],
  ].map(([n, url]) => [n, safeUrl(url)]).filter(([, url]) => url);
  const about = localized(settings?.about, lang) || t('public.footer.aboutDefault');
  const hasContact = c.phone || c.whatsapp || c.email || localized(c.address, lang);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState('');
  const subscribe = async (e) => {
    e.preventDefault(); setError(''); setSubmitting(true);
    try { await api.post('/newsletter/subscribe', { email, source: 'footer' }); setSubscribed(true); setEmail(''); }
    catch (err) { setError(err?.message || t('public.footer.newsletterError')); }
    finally { setSubmitting(false); }
  };

  const colTitle = 'mb-3 font-semibold';
  const link = 'flex min-h-9 items-center text-muted hover:text-primary';

  return (
    <footer className="mt-16 border-t border-line bg-surface">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-2xl font-bold text-primary">{siteName}</p>
          <p className="mt-3 text-muted">{about}</p>
        </div>

        <div>
          <p className={colTitle}>{t('public.footer.links')}</p>
          <Link to="/" className={link}>{t('nav.home')}</Link>
          <Link to="/shop" className={link}>{t('nav.products')}</Link>
          <Link to="/track" className={link}>{t('nav.track')}</Link>
          <Link to="/faq" className={link}>{t('nav.faq')}</Link>
          <Link to="/about" className={link}>{t('public.cms.aboutTitle')}</Link>
          <Link to="/contact" className={link}>{t('nav.contact')}</Link>
          <Link to="/cart" className={link}>{t('nav.cart')}</Link>
          <Link to="/privacy" className={link}>{t('public.footer.privacy')}</Link>
          <Link to="/terms" className={link}>{t('public.footer.terms')}</Link>
          <Link to="/returns" className={link}>{t('public.footer.returns')}</Link>
          <Link to="/shipping" className={link}>{t('public.footer.shipping')}</Link>
          <Link to="/payment" className={link}>{t('public.footer.payment')}</Link>
        </div>

        <div className="rounded-card border border-line bg-surface-2 p-4">
          <p className={colTitle}>{t('public.footer.newsletterTitle')}</p>
          <p className="mb-3 text-sm text-muted">{t('public.footer.newsletterText')}</p>
          {subscribed ? (
            <p className="text-sm font-semibold text-success">{t('public.footer.newsletterSuccess')}</p>
          ) : (
            <form onSubmit={subscribe} className="flex flex-col gap-2">
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('public.footer.newsletterPlaceholder')} aria-label={t('public.footer.newsletterEmail')} className="min-h-11 rounded-control border border-line bg-surface px-3 outline-none focus:border-primary" />
              <button type="submit" disabled={submitting} className="min-h-11 rounded-control bg-primary px-4 font-semibold text-primary-fg disabled:opacity-60">{submitting ? t('common.loading') : t('public.footer.newsletterButton')}</button>
              {error && <p className="text-xs text-danger">{error}</p>}
            </form>
          )}
        </div>

        {cats.length > 0 && (
          <div>
            <p className={colTitle}>{t('public.footer.categories')}</p>
            {cats.map((cat) => <Link key={cat._id} to={`/shop?category=${cat.slug}`} className={link}>{localized(cat.name, lang)}</Link>)}
          </div>
        )}

        {(hasContact || social.length > 0) && (
          <div>
            <p className={colTitle}>{t('public.footer.contact')}</p>
            {c.phone && <a href={`tel:${digits(c.phone)}`} className={`${link} gap-2`}><Phone size={16} /> {c.phone}</a>}
            {c.whatsapp && <a href={`https://wa.me/${digits(c.whatsapp).replace(/^\+/, '')}`} target="_blank" rel="noopener noreferrer" className={`${link} gap-2`}><MessageCircle size={16} /> WhatsApp</a>}
            {c.email && <a href={`mailto:${c.email}`} className={`${link} gap-2`}><Mail size={16} /> {c.email}</a>}
            {localized(c.address, lang) && <p className="mt-1 text-muted">{localized(c.address, lang)}</p>}
            {social.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {social.map(([name, url]) => (
                  <a key={name} href={url} target="_blank" rel="noopener noreferrer" className="rounded-full border border-line px-3 py-1.5 text-sm hover:bg-surface-2">{name}</a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-5 text-sm text-muted sm:flex-row">
          <ul className="flex flex-wrap justify-center gap-2" aria-label={t('public.footer.payments')}>
            {['bKash', 'Nagad', t('public.footer.bank'), t('public.footer.cod')].map((p) => (
              <li key={p} className="rounded-full border border-line px-3 py-1">{p}</li>
            ))}
          </ul>
          <p>© {new Date().getFullYear()} {siteName}. {t('public.footer.rights')}</p>
        </div>
      </div>
    </footer>
  );
}
