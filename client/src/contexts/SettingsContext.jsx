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

  useEffect(() => { document.title = siteName; }, [siteName]);

  return <SettingsContext.Provider value={{ settings, loading, failed, siteName }}>{children}</SettingsContext.Provider>;
}

export const useSettings = () => useContext(SettingsContext);
