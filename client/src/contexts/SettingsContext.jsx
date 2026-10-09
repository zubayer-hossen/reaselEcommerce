import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useLanguage } from './LanguageContext.jsx';
import { localized } from '../utils/format.js';

const SettingsContext = createContext({ settings: null, loading: true, failed: false, siteName: '' });

// Public site settings (name, contact, announcement, maintenance...). If the API is down the site still renders.
export function SettingsProvider({ children }) {
  const { lang, t } = useLanguage();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    api.get('/settings/public')
      .then((r) => alive && setSettings(r.data))
      .catch(() => alive && setFailed(true))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const siteName = localized(settings?.siteName, lang) || t('brand');
  const seoTitle = localized(settings?.seo?.title, lang) || siteName;
  const seoDescription = localized(settings?.seo?.description, lang);
  const seoKeywords = localized(settings?.seo?.keywords, lang);
  const seoImage = settings?.seo?.ogImage || '';

  useEffect(() => {
    document.title = seoTitle;
    const setMeta = (selector, create, content) => {
      let el = document.head.querySelector(selector);
      if (!content) { el?.remove(); return; }
      if (!el) { el = create(); document.head.appendChild(el); }
      el.setAttribute('content', content);
    };
    setMeta('meta[name="description"]', () => { const m = document.createElement('meta'); m.name = 'description'; return m; }, seoDescription);
    setMeta('meta[name="keywords"]', () => { const m = document.createElement('meta'); m.name = 'keywords'; return m; }, seoKeywords);
    setMeta('meta[property="og:title"]', () => { const m = document.createElement('meta'); m.setAttribute('property', 'og:title'); return m; }, seoTitle);
    setMeta('meta[property="og:description"]', () => { const m = document.createElement('meta'); m.setAttribute('property', 'og:description'); return m; }, seoDescription);
    setMeta('meta[property="og:image"]', () => { const m = document.createElement('meta'); m.setAttribute('property', 'og:image'); return m; }, seoImage);
    setMeta('meta[name="twitter:card"]', () => { const m = document.createElement('meta'); m.name = 'twitter:card'; return m; }, seoImage ? 'summary_large_image' : 'summary');
    if (settings?.favicon) {
      let link = document.head.querySelector('link[rel="icon"]');
      if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
      link.href = settings.favicon;
    }
  }, [seoTitle, seoDescription, seoKeywords, seoImage, settings?.favicon]);

  return <SettingsContext.Provider value={{ settings, loading, failed, siteName }}>{children}</SettingsContext.Provider>;
}

export const useSettings = () => useContext(SettingsContext);
