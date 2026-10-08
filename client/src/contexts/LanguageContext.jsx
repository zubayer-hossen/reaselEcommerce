import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { translations } from '../i18n/index.js';

const LanguageContext = createContext(null);

function readLang() {
  try {
    return localStorage.getItem('lang') === 'en' ? 'en' : 'bn'; // Bangla is the default
  } catch {
    return 'bn';
  }
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(readLang);

  useEffect(() => {
    document.documentElement.lang = lang;
    try { localStorage.setItem('lang', lang); } catch { /* ignore */ }
  }, [lang]);

  const toggleLang = useCallback(() => setLang((l) => (l === 'bn' ? 'en' : 'bn')), []);

  // t('nav.home') -> translated string, falls back to the key
  const t = useCallback(
    (key) => key.split('.').reduce((o, k) => (o ? o[k] : undefined), translations[lang]) ?? key,
    [lang]
  );

  return <LanguageContext.Provider value={{ lang, toggleLang, t }}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => useContext(LanguageContext);
